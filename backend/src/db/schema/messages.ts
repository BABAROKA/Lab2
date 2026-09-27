import {
    AnyPgColumn,
    bigint,
    index,
    pgTable,
    text,
    timestamp,
} from "drizzle-orm/pg-core";

import { conversations } from "./conversations";
import { users } from "./users";

export const messages = pgTable(
    "messages",
    {
        id: bigint("id", { mode: "number" })
            .generatedAlwaysAsIdentity()
            .primaryKey(),

        conversationId: bigint("conversation_id", {
            mode: "number",
        })
            .notNull()
            .references(() => conversations.id, {
                onDelete: "cascade",
            }),

        senderId: bigint("sender_id", {
            mode: "number",
        })
            .notNull()
            .references(() => users.id, {
                onDelete: "restrict",
            }),

        ciphertext: text("ciphertext").notNull(),

        replyToMessageId: bigint("reply_to_message_id", {
            mode: "number",
        }).references((): AnyPgColumn => messages.id, {
            onDelete: "set null",
        }),

        createdAt: timestamp("created_at", {
            withTimezone: true,
            mode: "date",
        })
            .notNull()
            .defaultNow(),

        editedAt: timestamp("edited_at", {
            withTimezone: true,
            mode: "date",
        }),

        deletedAt: timestamp("deleted_at", {
            withTimezone: true,
            mode: "date",
        }),
    },

    (table) => [
        index("messages_conversation_created_index").on(
            table.conversationId,
            table.createdAt,
        ),
        index("messages_sender_id_index").on(table.senderId),
        index("messages_reply_to_message_id_index").on(table.replyToMessageId),
    ],
);
