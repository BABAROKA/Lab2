import { Request, Response } from "express";
import { RecipientDeviceNotEligibleError } from "../../errors.js";
import { positiveIntParam } from "../../schemas/common.js";
import { ConversationsRepository } from "../conversations/conversations.repository.js";
import { DevicesRepository } from "../devices/devices.repository.js";
import { NotificationsRepository } from "../notifications/notifications.repository.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { UserRepository } from "../users/users.repository.js";
import { realtimeGateway } from "../../realtime/realtime-gateway.js";
import { MessagesRepository } from "./messages.repository.js";
import {
    addReactionSchema,
    editMessageSchema,
    listMessagesQuerySchema,
    markReadSchema,
    sendMessageSchema,
} from "./messages.schemas.js";
import { MessagesService } from "./messages.service.js";

const conversationsRepository = new ConversationsRepository();
const messagesRepository = new MessagesRepository();
const userRepository = new UserRepository();
const devicesRepository = new DevicesRepository();

const messagesService = new MessagesService(
    messagesRepository,
    conversationsRepository,
    devicesRepository,
    new NotificationsService(new NotificationsRepository()),
    realtimeGateway,
);

export const sendMessage = async (req: Request, res: Response) => {
    const conversationId = req.conversationId!;
    const input = sendMessageSchema.parse(req.body);

    let mentionUserIds: number[] = [];
    if (input.mentionUserUuids.length > 0) {
        const mentioned = await userRepository.findManyByUuids(
            input.mentionUserUuids,
        );
        mentionUserIds = mentioned.map((u) => u.id);
    }

    const fileRows = input.attachments.length
        ? await messagesRepository.resolveFileIdsByUuids(
            input.attachments.map((a) => a.fileUuid),
        )
        : [];
    const fileIdByUuid = new Map(fileRows.map((f) => [f.uuid, f.id]));

    const memberUserIds = new Set(
        await conversationsRepository.listActiveMemberUserIds(conversationId),
    );
    const allDeviceUuids = [
        ...input.deviceKeys.map((k) => k.deviceUuid),
        ...input.attachments.flatMap((a) =>
            a.deviceKeys.map((k) => k.deviceUuid),
        ),
    ];
    const resolvedDevices = await devicesRepository.findActiveByUuids([
        ...new Set(allDeviceUuids),
    ]);
    const deviceByUuid = new Map(resolvedDevices.map((d) => [d.uuid, d]));

    const resolveDevice = (deviceUuid: string): number => {
        const device = deviceByUuid.get(deviceUuid);
        if (!device || !memberUserIds.has(device.userId))
            throw new RecipientDeviceNotEligibleError();
        return device.id;
    };

    const resolvedDeviceKeys = input.deviceKeys.map((k) => ({
        deviceId: resolveDevice(k.deviceUuid),
        encryptedKey: k.encryptedKey,
    }));

    const resolvedAttachments = input.attachments.map((a) => {
        const fileId = fileIdByUuid.get(a.fileUuid);
        if (fileId === undefined) throw new RecipientDeviceNotEligibleError();
        return {
            fileId,
            encryptedMetadata: a.encryptedMetadata,
            deviceKeys: a.deviceKeys.map((k) => ({
                deviceId: resolveDevice(k.deviceUuid),
                encryptedKey: k.encryptedKey,
            })),
        };
    });

    const message = await messagesRepository.create(
        conversationId,
        req.auth.id,
        input,
        resolvedDeviceKeys,
        resolvedAttachments,
        mentionUserIds,
    );

    realtimeGateway.emitToConversation(conversationId, "message:new", {
        conversationUuid: req.conversationUuid!,
        messageId: message.id,
    });

    res.status(201).json({ id: message.id, createdAt: message.createdAt });
};

export const listMessages = async (req: Request, res: Response) => {
    const conversationId = req.conversationId!;
    const query = listMessagesQuerySchema.parse(req.query);

    const dtos = await messagesService.listPage(
        conversationId,
        req.auth.id,
        query.deviceUuid,
        {
            limit: query.limit,
            before: query.before,
        },
    );

    res.json(dtos);
};

export const editMessage = async (req: Request, res: Response) => {
    const conversationId = req.conversationId!;
    const messageId = positiveIntParam.parse(req.params.messageId);
    const input = editMessageSchema.parse(req.body);

    res.json(
        await messagesService.edit(
            conversationId,
            req.conversationUuid!,
            req.auth.id,
            messageId,
            input,
        ),
    );
};

export const deleteMessage = async (req: Request, res: Response) => {
    const conversationId = req.conversationId!;
    const messageId = positiveIntParam.parse(req.params.messageId);

    const hasDeleteAny = await conversationsRepository.memberHasPermission(
        conversationId,
        req.auth.id,
        "delete_any_message",
    );
    await messagesService.remove(
        conversationId,
        req.conversationUuid!,
        req.auth.id,
        messageId,
        hasDeleteAny,
    );
    res.status(204).end();
};

export const addReaction = async (req: Request, res: Response) => {
    const conversationId = req.conversationId!;
    const messageId = positiveIntParam.parse(req.params.messageId);
    const input = addReactionSchema.parse(req.body);

    await messagesService.addReaction(
        conversationId,
        req.conversationUuid!,
        req.auth.id,
        req.auth.uuid,
        messageId,
        input.reaction,
    );
    res.status(204).end();
};

export const removeReaction = async (req: Request, res: Response) => {
    const conversationId = req.conversationId!;
    const messageId = positiveIntParam.parse(req.params.messageId);
    const reaction = String(req.params.reaction);

    await messagesService.removeReaction(
        conversationId,
        req.conversationUuid!,
        req.auth.id,
        req.auth.uuid,
        messageId,
        reaction,
    );
    res.status(204).end();
};

export const markMessageRead = async (req: Request, res: Response) => {
    const conversationId = req.conversationId!;
    const messageId = positiveIntParam.parse(req.params.messageId);
    const input = markReadSchema.parse(req.body);

    await messagesService.markRead(
        conversationId,
        req.conversationUuid!,
        req.auth.id,
        req.auth.uuid,
        messageId,
        input.deviceUuid,
    );
    res.status(204).end();
};
