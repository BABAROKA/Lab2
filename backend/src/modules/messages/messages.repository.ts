import { and, desc, eq, inArray, lt } from "drizzle-orm";
import { db } from "../../db/client.js";
import { Tx } from "../../db/types.js";
import { messages } from "../../db/schema/messages.js";
import { messageDeviceKeys } from "../../db/schema/message_device_keys.js";
import { messageAttachments } from "../../db/schema/message_attachments.js";
import { attachmentDeviceKeys } from "../../db/schema/attachment_device_keys.js";
import { messageReactions } from "../../db/schema/message_reactions.js";
import { messageReads } from "../../db/schema/message_reads.js";
import { messageMentions } from "../../db/schema/message_mentions.js";
import { conversations } from "../../db/schema/conversations.js";
import { files } from "../../db/schema/files.js";
import { users } from "../../db/schema/users.js";
import { SendMessageInput } from "./messages.schemas.js";

export type Message = typeof messages.$inferSelect;

export interface MessageListRow {
    id: number;
    senderUuid: string;
    ciphertext: string;
    replyToMessageId: number | null;
    createdAt: Date;
    editedAt: Date | null;
    deletedAt: Date | null;
}

export class MessagesRepository {
    async create(
        conversationId: number,
        senderId: number,
        input: SendMessageInput,
        resolvedDeviceKeys: { deviceId: number; encryptedKey: string }[],
        resolvedAttachments: {
            fileId: number;
            encryptedMetadata: string;
            deviceKeys: { deviceId: number; encryptedKey: string }[];
        }[],
        mentionUserIds: number[],
    ): Promise<Message> {
        return db.transaction(async (tx: Tx) => {
            const [message] = await tx
                .insert(messages)
                .values({
                    conversationId,
                    senderId,
                    ciphertext: input.ciphertext,
                    replyToMessageId: input.replyToMessageId ?? null,
                })
                .returning();
            if (!message) throw new Error("message insert returned no row");

            await tx
                .insert(messageDeviceKeys)
                .values(
                    resolvedDeviceKeys.map((k) => ({
                        messageId: message.id,
                        deviceId: k.deviceId,
                        encryptedMessageKey: k.encryptedKey,
                    })),
                );

            for (const attachment of resolvedAttachments) {
                const [row] = await tx
                    .insert(messageAttachments)
                    .values({
                        messageId: message.id,
                        fileId: attachment.fileId,
                        encryptedMetadata: attachment.encryptedMetadata,
                    })
                    .returning({ id: messageAttachments.id });
                if (!row) throw new Error("attachment insert returned no row");

                await tx
                    .insert(attachmentDeviceKeys)
                    .values(
                        attachment.deviceKeys.map((k) => ({
                            attachmentId: row.id,
                            deviceId: k.deviceId,
                            encryptedAttachmentKey: k.encryptedKey,
                        })),
                    );
            }

            if (mentionUserIds.length > 0) {
                await tx
                    .insert(messageMentions)
                    .values(
                        mentionUserIds.map((userId) => ({
                            messageId: message.id,
                            userId,
                        })),
                    )
                    .onConflictDoNothing();
            }

            await tx
                .update(conversations)
                .set({ updatedBy: senderId })
                .where(eq(conversations.id, conversationId));

            return message;
        });
    }

    async findInConversation(
        conversationId: number,
        messageId: number,
    ): Promise<Message | null> {
        const [row] = await db
            .select()
            .from(messages)
            .where(
                and(
                    eq(messages.id, messageId),
                    eq(messages.conversationId, conversationId),
                ),
            )
            .limit(1);
        return row ?? null;
    }

    async listPage(
        conversationId: number,
        opts: { limit: number; before?: number | undefined },
    ): Promise<MessageListRow[]> {
        const conditions = [eq(messages.conversationId, conversationId)];
        if (opts.before !== undefined)
            conditions.push(lt(messages.id, opts.before));

        return db
            .select({
                id: messages.id,
                senderUuid: users.uuid,
                ciphertext: messages.ciphertext,
                replyToMessageId: messages.replyToMessageId,
                createdAt: messages.createdAt,
                editedAt: messages.editedAt,
                deletedAt: messages.deletedAt,
            })
            .from(messages)
            .innerJoin(users, eq(users.id, messages.senderId))
            .where(and(...conditions))
            .orderBy(desc(messages.id))
            .limit(opts.limit);
    }

    async findOwnKeysForMessages(messageIds: number[], deviceId: number) {
        if (messageIds.length === 0) return [];
        return db
            .select({
                messageId: messageDeviceKeys.messageId,
                encryptedMessageKey: messageDeviceKeys.encryptedMessageKey,
            })
            .from(messageDeviceKeys)
            .where(
                and(
                    inArray(messageDeviceKeys.messageId, messageIds),
                    eq(messageDeviceKeys.deviceId, deviceId),
                ),
            );
    }

    async findAttachmentsForMessages(messageIds: number[], deviceId: number) {
        if (messageIds.length === 0) return [];
        return db
            .select({
                messageId: messageAttachments.messageId,
                fileUuid: files.uuid,
                encryptedMetadata: messageAttachments.encryptedMetadata,
                encryptedAttachmentKey:
                    attachmentDeviceKeys.encryptedAttachmentKey,
            })
            .from(messageAttachments)
            .innerJoin(files, eq(files.id, messageAttachments.fileId))
            .leftJoin(
                attachmentDeviceKeys,
                and(
                    eq(
                        attachmentDeviceKeys.attachmentId,
                        messageAttachments.id,
                    ),
                    eq(attachmentDeviceKeys.deviceId, deviceId),
                ),
            )
            .where(inArray(messageAttachments.messageId, messageIds));
    }

    async findReactionsForMessages(messageIds: number[]) {
        if (messageIds.length === 0) return [];
        return db
            .select({
                messageId: messageReactions.messageId,
                userUuid: users.uuid,
                reaction: messageReactions.reaction,
            })
            .from(messageReactions)
            .innerJoin(users, eq(users.id, messageReactions.userId))
            .where(inArray(messageReactions.messageId, messageIds));
    }

    async update(
        messageId: number,
        ciphertext: string,
    ): Promise<Message | null> {
        const [row] = await db
            .update(messages)
            .set({ ciphertext, editedAt: new Date() })
            .where(eq(messages.id, messageId))
            .returning();
        return row ?? null;
    }

    async softDelete(messageId: number): Promise<void> {
        await db
            .update(messages)
            .set({ deletedAt: new Date(), ciphertext: "" })
            .where(eq(messages.id, messageId));
    }

    async addReaction(
        messageId: number,
        userId: number,
        reaction: string,
    ): Promise<void> {
        await db
            .insert(messageReactions)
            .values({ messageId, userId, reaction })
            .onConflictDoNothing();
    }

    async removeReaction(
        messageId: number,
        userId: number,
        reaction: string,
    ): Promise<boolean> {
        const rows = await db
            .delete(messageReactions)
            .where(
                and(
                    eq(messageReactions.messageId, messageId),
                    eq(messageReactions.userId, userId),
                    eq(messageReactions.reaction, reaction),
                ),
            )
            .returning({ id: messageReactions.id });
        return rows.length > 0;
    }

    async markRead(
        messageId: number,
        userId: number,
        deviceId: number,
    ): Promise<void> {
        await db
            .insert(messageReads)
            .values({ messageId, userId, deviceId })
            .onConflictDoUpdate({
                target: [messageReads.messageId, messageReads.deviceId],
                set: { readAt: new Date() },
            });
    }

    async resolveFileIdsByUuids(fileUuids: string[]) {
        if (fileUuids.length === 0) return [];
        return db
            .select({ id: files.id, uuid: files.uuid })
            .from(files)
            .where(inArray(files.uuid, fileUuids));
    }
}
