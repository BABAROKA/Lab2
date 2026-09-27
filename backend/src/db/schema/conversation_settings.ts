import {
    bigint,
    boolean,
    integer,
    pgTable,
    timestamp,
} from "drizzle-orm/pg-core";

import { conversations } from "./conversations";

export const conversationSettings = pgTable("conversation_settings", {
    id: bigint("id", { mode: "number" })
        .generatedAlwaysAsIdentity()
        .primaryKey(),

    conversationId: bigint("conversation_id", {
        mode: "number",
    })
        .notNull()
        .unique()
        .references(() => conversations.id, {
            onDelete: "cascade",
        }),

    disappearingMessages: boolean("disappearing_messages")
        .notNull()
        .default(false),

    disappearingMessagesSeconds: integer("disappearing_messages_seconds"),

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
});
