import {
    ForbiddenError,
    MessageNotFoundError,
    NotMessageAuthorError,
    ReactionNotFoundError,
} from "../../errors.js";
import { RealtimeGateway } from "../../realtime/realtime-gateway.js";
import { ConversationsRepository } from "../conversations/conversations.repository.js";
import { DevicesRepository } from "../devices/devices.repository.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { MessagesRepository } from "./messages.repository.js";
import { EditMessageInput } from "./messages.schemas.js";

export interface MessageDto {
    id: number;
    senderUuid: string;
    ciphertext: string;
    replyToMessageId: number | null;
    createdAt: Date;
    editedAt: Date | null;
    deletedAt: Date | null;
    myEncryptedMessageKey: string | null;
    attachments: {
        fileUuid: string;
        encryptedMetadata: string;
        myEncryptedAttachmentKey: string | null;
    }[];
    reactions: { userUuid: string; reaction: string }[];
}

export class MessagesService {
    constructor(
        private readonly messagesRepository: MessagesRepository,
        private readonly conversationsRepository: ConversationsRepository,
        private readonly devicesRepository: DevicesRepository,
        private readonly notificationsService: NotificationsService,
        private readonly realtime: RealtimeGateway,
    ) { }

    /** @throws */
    async listPage(
        conversationId: number,
        requestingUserId: number,
        deviceUuid: string,
        opts: { limit: number; before?: number | undefined },
    ): Promise<MessageDto[]> {
        const device = await this.devicesRepository.findActiveByUuidForUser(
            requestingUserId,
            deviceUuid,
        );
        if (!device) throw new ForbiddenError();

        const page = await this.messagesRepository.listPage(
            conversationId,
            opts,
        );
        const ids = page.map((m) => m.id);

        const [ownKeys, attachmentRows, reactionRows] = await Promise.all([
            this.messagesRepository.findOwnKeysForMessages(ids, device.id),
            this.messagesRepository.findAttachmentsForMessages(ids, device.id),
            this.messagesRepository.findReactionsForMessages(ids),
        ]);

        const keyByMessage = new Map(
            ownKeys.map((k) => [k.messageId, k.encryptedMessageKey]),
        );

        const attachmentsByMessage = new Map<
            number,
            MessageDto["attachments"]
        >();
        for (const row of attachmentRows) {
            const list = attachmentsByMessage.get(row.messageId) ?? [];
            list.push({
                fileUuid: row.fileUuid,
                encryptedMetadata: row.encryptedMetadata,
                myEncryptedAttachmentKey: row.encryptedAttachmentKey,
            });
            attachmentsByMessage.set(row.messageId, list);
        }

        const reactionsByMessage = new Map<number, MessageDto["reactions"]>();
        for (const row of reactionRows) {
            const list = reactionsByMessage.get(row.messageId) ?? [];
            list.push({ userUuid: row.userUuid, reaction: row.reaction });
            reactionsByMessage.set(row.messageId, list);
        }

        return page.map((m) => ({
            ...m,
            myEncryptedMessageKey: keyByMessage.get(m.id) ?? null,
            attachments: attachmentsByMessage.get(m.id) ?? [],
            reactions: reactionsByMessage.get(m.id) ?? [],
        }));
    }

    /** @throws */
    async edit(
        conversationId: number,
        conversationUuid: string,
        userId: number,
        messageId: number,
        input: EditMessageInput,
    ) {
        const message = await this.messagesRepository.findInConversation(
            conversationId,
            messageId,
        );
        if (!message || message.deletedAt) throw new MessageNotFoundError();
        if (message.senderId !== userId) throw new NotMessageAuthorError();

        const updated = await this.messagesRepository.update(
            messageId,
            input.ciphertext,
        );
        if (!updated) throw new MessageNotFoundError();

        this.realtime.emitToConversation(conversationId, "message:edited", {
            conversationUuid,
            messageId,
        });
        return {
            id: updated.id,
            ciphertext: updated.ciphertext,
            editedAt: updated.editedAt,
        };
    }

    /** @throws */
    async remove(
        conversationId: number,
        conversationUuid: string,
        userId: number,
        messageId: number,
        hasDeleteAny: boolean,
    ): Promise<void> {
        const message = await this.messagesRepository.findInConversation(
            conversationId,
            messageId,
        );
        if (!message || message.deletedAt) throw new MessageNotFoundError();
        if (message.senderId !== userId && !hasDeleteAny)
            throw new NotMessageAuthorError();

        await this.messagesRepository.softDelete(messageId);
        this.realtime.emitToConversation(conversationId, "message:deleted", {
            conversationUuid,
            messageId,
        });
    }

    /** @throws */
    async addReaction(
        conversationId: number,
        conversationUuid: string,
        userId: number,
        userUuid: string,
        messageId: number,
        reaction: string,
    ): Promise<void> {
        const message = await this.messagesRepository.findInConversation(
            conversationId,
            messageId,
        );
        if (!message || message.deletedAt) throw new MessageNotFoundError();

        await this.messagesRepository.addReaction(messageId, userId, reaction);
        this.realtime.emitToConversation(conversationId, "reaction:added", {
            conversationUuid,
            messageId,
            userUuid,
            reaction,
        });
    }

    /** @throws */
    async removeReaction(
        conversationId: number,
        conversationUuid: string,
        userId: number,
        userUuid: string,
        messageId: number,
        reaction: string,
    ): Promise<void> {
        const message = await this.messagesRepository.findInConversation(
            conversationId,
            messageId,
        );
        if (!message || message.deletedAt) throw new MessageNotFoundError();

        const removed = await this.messagesRepository.removeReaction(
            messageId,
            userId,
            reaction,
        );
        if (!removed) throw new ReactionNotFoundError();

        this.realtime.emitToConversation(conversationId, "reaction:removed", {
            conversationUuid,
            messageId,
            userUuid,
            reaction,
        });
    }

    /** @throws */
    async markRead(
        conversationId: number,
        conversationUuid: string,
        userId: number,
        userUuid: string,
        messageId: number,
        deviceUuid: string,
    ): Promise<void> {
        const device = await this.devicesRepository.findActiveByUuidForUser(
            userId,
            deviceUuid,
        );
        if (!device) throw new ForbiddenError();

        const message = await this.messagesRepository.findInConversation(
            conversationId,
            messageId,
        );
        if (!message) throw new MessageNotFoundError();

        await this.messagesRepository.markRead(messageId, userId, device.id);
        this.realtime.emitToConversation(conversationId, "read:receipt", {
            conversationUuid,
            messageId,
            userUuid,
            deviceUuid,
        });
    }
}
