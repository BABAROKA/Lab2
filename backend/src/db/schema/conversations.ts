import {
    bigint,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

import { users } from "./users";

export const conversationTypeEnum = pgEnum("conversation_type", [
    "direct",
    "group",
]);

export const conversations = pgTable("conversations", {
    id: bigint("id", { mode: "number" })
        .generatedAlwaysAsIdentity()
        .primaryKey(),

    uuid: uuid("uuid").defaultRandom().notNull().unique(),

    type: conversationTypeEnum("type").notNull(),

    name: text("name"),

    createdBy: bigint("created_by", {
        mode: "number",
    })
        .notNull()
        .references(() => users.id, {
            onDelete: "restrict",
        }),

    updatedBy: bigint("updated_by", {
        mode: "number",
    }).references(() => users.id, {
        onDelete: "set null",
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
});
