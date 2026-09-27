import cookie from "cookie";
import { Server, Socket } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { env } from "../config/env.js";
import { verifyAccessToken } from "../modules/auth/auth.utils.js";
import { UserRepository } from "../modules/users/users.repository.js";
import { DevicesRepository } from "../modules/devices/devices.repository.js";
import { ConversationsRepository } from "../modules/conversations/conversations.repository.js";
import { CallsRepository } from "../modules/calls/calls.repository.js";
import { redis } from "../lib/redis.js";
import {
    conversationRoom,
    realtimeGateway,
    userRoom,
} from "../realtime/realtime-gateway.js";

const userRepository = new UserRepository();
const devicesRepository = new DevicesRepository();
const conversationsRepository = new ConversationsRepository();
const callsRepository = new CallsRepository();

interface SocketData {
    userId: number;
    userUuid: string;
    deviceId: number;
}

const presenceConnCountKey = (userId: number) => `presence:conncount:${userId}`;
const typingKey = (conversationId: number, userId: number) =>
    `typing:${conversationId}:${userId}`;

export const setupWebsocket = (httpServer: HttpServer): void => {
    const io = new Server<any, any, any, SocketData>(httpServer, {
        cors: { origin: env.CORS_ORIGIN, credentials: true },
    });

    io.use(async (socket, next) => {
        try {
            const rawCookie = socket.handshake.headers.cookie;
            if (!rawCookie) throw new Error("no cookie header");

            const parsed = cookie.parse(rawCookie);
            const accessToken = parsed.access_token;
            if (!accessToken) throw new Error("no access_token cookie");

            const claims = verifyAccessToken(accessToken);

            const user = await userRepository.findByUuid(claims.sub);
            if (!user || !user.isActive)
                throw new Error("inactive or unknown user");

            const deviceUuid: unknown = socket.handshake.auth?.deviceUuid;
            if (typeof deviceUuid !== "string")
                throw new Error("deviceUuid required in handshake auth");

            const device = await devicesRepository.findActiveByUuidForUser(
                user.id,
                deviceUuid,
            );
            if (!device) throw new Error("unknown or inactive device");

            socket.data = {
                userId: user.id,
                userUuid: user.uuid,
                deviceId: device.id,
            };
            next();
        } catch (err) {
            next(
                err instanceof Error ? err : new Error("authentication failed"),
            );
        }
    });

    io.on("connection", (socket: Socket<any, any, any, SocketData>) => {
        void handleConnection(io, socket);
    });

    realtimeGateway.attach(io);
};

async function handleConnection(
    io: Server,
    socket: Socket<any, any, any, SocketData>,
): Promise<void> {
    const { userId, userUuid, deviceId } = socket.data;

    await socket.join(userRoom(userId));

    const conversationIds =
        await conversationsRepository.listConversationIdsForUser(userId);
    for (const id of conversationIds) {
        await socket.join(conversationRoom(id));
    }

    void devicesRepository.touchLastSeen(deviceId);

    const connCount = await redis.incr(presenceConnCountKey(userId));
    if (connCount === 1) {
        io.emit("presence:update", { userUuid, online: true });
    }

    socket.on("typing:start", (payload: { conversationUuid: string }) => {
        void handleTyping(socket, payload.conversationUuid, true);
    });

    socket.on("typing:stop", (payload: { conversationUuid: string }) => {
        void handleTyping(socket, payload.conversationUuid, false);
    });

    socket.on(
        "call:invite",
        (
            payload: { conversationUuid: string; type: "audio" | "video" },
            ack?: (res: { callUuid: string } | { error: string }) => void,
        ) => {
            void handleCallInvite(socket, payload, ack);
        },
    );

    socket.on(
        "call:accept",
        (payload: { callUuid: string }) =>
            void handleCallRespond(io, socket, payload.callUuid, "accepted"),
    );
    socket.on(
        "call:decline",
        (payload: { callUuid: string }) =>
            void handleCallRespond(io, socket, payload.callUuid, "declined"),
    );
    socket.on(
        "call:end",
        (payload: { callUuid: string }) =>
            void handleCallEnd(io, socket, payload.callUuid),
    );

    socket.on(
        "call:signal",
        (payload: {
            callUuid: string;
            targetUserUuid: string;
            signal: unknown;
        }) => {
            void handleCallSignal(io, socket, payload);
        },
    );

    socket.on("disconnect", () => {
        void handleDisconnect(io, userId, userUuid);
    });
}

async function handleTyping(
    socket: Socket<any, any, any, SocketData>,
    conversationUuid: string,
    isTyping: boolean,
): Promise<void> {
    const { userId, userUuid } = socket.data;

    const conversation = await conversationsRepository.findForMemberByUuid(
        conversationUuid,
        userId,
    );
    if (!conversation) return;

    if (isTyping) {
        await redis.set(typingKey(conversation.id, userId), "1", "EX", 5);
    } else {
        await redis.del(typingKey(conversation.id, userId));
    }

    socket
        .to(conversationRoom(conversation.id))
        .emit("typing:update", { conversationUuid, userUuid, isTyping });
}

async function handleCallInvite(
    socket: Socket<any, any, any, SocketData>,
    payload: { conversationUuid: string; type: "audio" | "video" },
    ack?: (res: { callUuid: string } | { error: string }) => void,
): Promise<void> {
    const { userId, userUuid } = socket.data;

    const conversation = await conversationsRepository.findForMemberByUuid(
        payload.conversationUuid,
        userId,
    );
    if (!conversation) {
        ack?.({ error: "not a member of this conversation" });
        return;
    }

    const call = await callsRepository.create(
        conversation.id,
        userId,
        payload.type,
    );
    ack?.({ callUuid: call.uuid });

    socket.to(conversationRoom(conversation.id)).emit("call:incoming", {
        callUuid: call.uuid,
        conversationUuid: payload.conversationUuid,
        callerUuid: userUuid,
        type: payload.type,
    });
}

async function handleCallRespond(
    io: Server,
    socket: Socket<any, any, any, SocketData>,
    callUuid: string,
    status: "accepted" | "declined",
): Promise<void> {
    const call = await callsRepository.findByUuid(callUuid);
    if (!call) return;

    const isMember = await conversationsRepository.findActiveMember(
        call.conversationId,
        socket.data.userId,
    );
    if (!isMember) return;

    await callsRepository.setStatus(
        call.id,
        status,
        status === "declined" ? new Date() : undefined,
    );

    io.to(conversationRoom(call.conversationId)).emit(
        status === "accepted" ? "call:accepted" : "call:declined",
        {
            callUuid,
            respondedByUuid: socket.data.userUuid,
        },
    );
}

async function handleCallEnd(
    io: Server,
    socket: Socket<any, any, any, SocketData>,
    callUuid: string,
): Promise<void> {
    const call = await callsRepository.findByUuid(callUuid);
    if (!call) return;

    const isMember = await conversationsRepository.findActiveMember(
        call.conversationId,
        socket.data.userId,
    );
    if (!isMember) return;

    await callsRepository.setStatus(call.id, "ended", new Date());
    io.to(conversationRoom(call.conversationId)).emit("call:ended", {
        callUuid,
        endedByUuid: socket.data.userUuid,
    });
}

async function handleCallSignal(
    io: Server,
    socket: Socket<any, any, any, SocketData>,
    payload: { callUuid: string; targetUserUuid: string; signal: unknown },
): Promise<void> {
    const target = await userRepository.findByUuid(payload.targetUserUuid);
    if (!target) return;

    io.to(userRoom(target.id)).emit("call:signal", {
        callUuid: payload.callUuid,
        fromUserUuid: socket.data.userUuid,
        signal: payload.signal,
    });
}

async function handleDisconnect(
    io: Server,
    userId: number,
    userUuid: string,
): Promise<void> {
    const remaining = await redis.decr(presenceConnCountKey(userId));
    if (remaining <= 0) {
        await redis.del(presenceConnCountKey(userId));
        io.emit("presence:update", { userUuid, online: false });
    }
}
