import { bigint, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { files } from "./files";
import { messages } from "./messages";

export const messageAttachments = pgTable(
    "message_attachments",
    {
        id: bigint("id", { mode: "number" })
            .generatedAlwaysAsIdentity()
            .primaryKey(),
        messageId: bigint("message_id", {
            mode: "number",
        })
            .notNull()
            .references(() => messages.id, {
                onDelete: "cascade",
            }),
        fileId: bigint("file_id", {
            mode: "number",
        })
            .notNull()
            .references(() => files.id, {
                onDelete: "cascade",
            }),
        encryptedMetadata: text("encrypted_metadata").notNull(),
        createdAt: timestamp("created_at", {
            withTimezone: true,
            mode: "date",
        })
            .notNull()
            .defaultNow(),
    },

    (table) => [
        index("message_attachments_message_id_index").on(table.messageId),
        index("message_attachments_file_id_index").on(table.fileId),
    ],
);
