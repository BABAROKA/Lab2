import {
    bigint,
    index,
    pgTable,
    timestamp,
    uniqueIndex,
} from "drizzle-orm/pg-core";

import { conversations } from "./conversations";
import { users } from "./users";

export const conversationMembers = pgTable(
    "conversation_members",
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

        userId: bigint("user_id", {
            mode: "number",
        })
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),

        joinedAt: timestamp("joined_at", {
            withTimezone: true,
            mode: "date",
        })
            .notNull()
            .defaultNow(),

        leftAt: timestamp("left_at", {
            withTimezone: true,
            mode: "date",
        }),

        createdAt: timestamp("created_at", {
            withTimezone: true,
            mode: "date",
        })
            .notNull()
            .defaultNow(),

        updatedAt: timestamp("updated_at", {
            withTimezone: true,
            mode: "date",
        })
            .notNull()
            .defaultNow()
            .$onUpdate(() => new Date()),
    },

    (table) => [
        uniqueIndex("conversation_members_conversation_user_unique").on(
            table.conversationId,
            table.userId,
        ),

        index("conversation_members_user_id_index").on(table.userId),
    ],
);
