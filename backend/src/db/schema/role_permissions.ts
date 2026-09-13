import { pgTable, bigint, uniqueIndex, index } from "drizzle-orm/pg-core";
import { roles } from "./roles";
import { permissions } from "./permissions";

export const rolePermissions = pgTable(
    "role_permissions",
    {
        id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
        roleId: bigint("role_id", { mode: "number" }).notNull().references(() => roles.id, { onDelete: "cascade" }),
        permissionId: bigint("permission_id", { mode: "number" }).notNull().references(() => permissions.id, { onDelete: "cascade" }),
    },
    table => [
        uniqueIndex("role_permissions_role_permission_unique").on(
            table.roleId,
            table.permissionId,
        ),
        index("role_permissions_permission_id_index").on(table.permissionId),
    ],
);
