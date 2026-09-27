import {
    bigint,
    index,
    pgEnum,
    pgTable,
    timestamp,
    uniqueIndex,
} from "drizzle-orm/pg-core";

import { conversations } from "./conversations";
import { users } from "./users";

export const conversationRoleNameEnum = pgEnum("conversation_role_name", [
    "owner",
    "admin",
    "moderator",
    "member",
]);

export const conversationRoles = pgTable(
    "conversation_roles",
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

        name: conversationRoleNameEnum("name").notNull(),

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
    },

    (table) => [
        uniqueIndex("conversation_roles_conversation_name_unique").on(
            table.conversationId,
            table.name,
        ),

        index("conversation_roles_conversation_id_index").on(
            table.conversationId,
        ),
    ],
);

export type ConversationRoleName = (typeof conversationRoleNameEnum.enumValues)[number];
