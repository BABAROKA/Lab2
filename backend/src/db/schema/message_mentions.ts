import {
    bigint,
    index,
    pgTable,
    timestamp,
    uniqueIndex,
} from "drizzle-orm/pg-core";

import { messages } from "./messages";
import { users } from "./users";

export const messageMentions = pgTable(
    "message_mentions",
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

        userId: bigint("user_id", {
            mode: "number",
        })
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),

        createdAt: timestamp("created_at", {
            withTimezone: true,
            mode: "date",
        })
            .notNull()
            .defaultNow(),
    },

    (table) => [
        uniqueIndex("message_mentions_message_user_unique").on(
            table.messageId,
            table.userId,
        ),

        index("message_mentions_user_id_index").on(table.userId),
    ],
);
