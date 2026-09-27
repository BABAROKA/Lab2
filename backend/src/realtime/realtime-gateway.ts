import type { Server } from "socket.io";

export interface RealtimeGateway {
    emitToConversation(
        conversationId: number,
        event: string,
        payload: unknown,
    ): void;
    emitToUser(userId: number, event: string, payload: unknown): void;
    joinConversation(userId: number, conversationId: number): void;
    leaveConversation(userId: number, conversationId: number): void;
}

export const conversationRoom = (id: number): string => `conversation:${id}`;
export const userRoom = (id: number): string => `user:${id}`;

class RealtimeGatewayRegistry implements RealtimeGateway {
    private io: Server | null = null;

    attach(io: Server): void {
        this.io = io;
    }

    emitToConversation(
        conversationId: number,
        event: string,
        payload: unknown,
    ): void {
        this.io?.to(conversationRoom(conversationId)).emit(event, payload);
    }

    emitToUser(userId: number, event: string, payload: unknown): void {
        this.io?.to(userRoom(userId)).emit(event, payload);
    }

    joinConversation(userId: number, conversationId: number): void {
        this.io
            ?.in(userRoom(userId))
            .socketsJoin(conversationRoom(conversationId));
    }

    leaveConversation(userId: number, conversationId: number): void {
        this.io
            ?.in(userRoom(userId))
            .socketsLeave(conversationRoom(conversationId));
    }
}

export const realtimeGateway = new RealtimeGatewayRegistry();
