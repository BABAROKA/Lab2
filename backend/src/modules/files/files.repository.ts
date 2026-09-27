import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db/client.js";
import { files } from "../../db/schema/files.js";
import { messageAttachments } from "../../db/schema/message_attachments.js";
import { messages } from "../../db/schema/messages.js";
import { conversationMembers } from "../../db/schema/conversation_members.js";

export type FileRow = typeof files.$inferSelect;

export class FilesRepository {
    async create(
        uploadedBy: number,
        storageKey: string,
        sizeBytes: number,
        sha256: string,
    ): Promise<FileRow> {
        const [row] = await db
            .insert(files)
            .values({ uploadedBy, storageKey, sizeBytes, sha256 })
            .returning();
        if (!row) throw new Error("file insert returned no row");
        return row;
    }

    async findByUuid(fileUuid: string): Promise<FileRow | null> {
        const [row] = await db
            .select()
            .from(files)
            .where(eq(files.uuid, fileUuid))
            .limit(1);
        return row ?? null;
    }

    async findForConversationMember(
        fileUuid: string,
        userId: number,
    ): Promise<FileRow | null> {
        const [row] = await db
            .select({ file: files })
            .from(files)
            .innerJoin(
                messageAttachments,
                eq(messageAttachments.fileId, files.id),
            )
            .innerJoin(messages, eq(messages.id, messageAttachments.messageId))
            .innerJoin(
                conversationMembers,
                and(
                    eq(
                        conversationMembers.conversationId,
                        messages.conversationId,
                    ),
                    eq(conversationMembers.userId, userId),
                    isNull(conversationMembers.leftAt),
                ),
            )
            .where(eq(files.uuid, fileUuid))
            .limit(1);
        return row?.file ?? null;
    }

    async deleteById(fileId: number): Promise<void> {
        await db.delete(files).where(eq(files.id, fileId));
    }
}
