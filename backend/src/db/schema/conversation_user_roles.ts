import { bigint, index, pgTable, uniqueIndex } from "drizzle-orm/pg-core";

import { conversationMembers } from "./conversation_members";
import { conversationRoles } from "./conversation_roles";

export const conversationUserRoles = pgTable(
    "conversation_user_roles",
    {
        id: bigint("id", { mode: "number" })
            .generatedAlwaysAsIdentity()
            .primaryKey(),

        conversationMemberId: bigint("conversation_member_id", {
            mode: "number",
        })
            .notNull()
            .references(() => conversationMembers.id, {
                onDelete: "cascade",
            }),

        conversationRoleId: bigint("conversation_role_id", {
            mode: "number",
        })
            .notNull()
            .references(() => conversationRoles.id, {
                onDelete: "cascade",
            }),
    },

    (table) => [
        uniqueIndex("conversation_user_roles_member_role_unique").on(
            table.conversationMemberId,
            table.conversationRoleId,
        ),

        index("conversation_user_roles_role_id_index").on(
            table.conversationRoleId,
        ),
    ],
);
