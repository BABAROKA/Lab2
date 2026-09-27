import { bigint, index, pgTable, uniqueIndex } from "drizzle-orm/pg-core";

import { conversationRoles } from "./conversation_roles";
import { conversationPermissions } from "./conversation_permissions";

export const conversationRolePermissions = pgTable(
    "conversation_role_permissions",
    {
        id: bigint("id", { mode: "number" })
            .generatedAlwaysAsIdentity()
            .primaryKey(),

        roleId: bigint("role_id", {
            mode: "number",
        })
            .notNull()
            .references(() => conversationRoles.id, {
                onDelete: "cascade",
            }),

        permissionId: bigint("permission_id", {
            mode: "number",
        })
            .notNull()
            .references(() => conversationPermissions.id, {
                onDelete: "cascade",
            }),
    },

    (table) => [
        uniqueIndex("conversation_role_permissions_role_permission_unique").on(
            table.roleId,
            table.permissionId,
        ),

        index("conversation_role_permissions_permission_id_index").on(
            table.permissionId,
        ),
    ],
);
