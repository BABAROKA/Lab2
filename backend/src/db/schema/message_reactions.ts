import {
    bigint,
    index,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
} from "drizzle-orm/pg-core";

import { messages } from "./messages";
import { users } from "./users";

export const messageReactions = pgTable(
    "message_reactions",
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

        reaction: text("reaction").notNull(),

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
        uniqueIndex("message_reactions_message_user_reaction_unique").on(
            table.messageId,
            table.userId,
            table.reaction,
        ),

        index("message_reactions_user_id_index").on(table.userId),
    ],
);
