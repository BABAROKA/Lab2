import { pgTable, bigint, text, pgEnum } from "drizzle-orm/pg-core";


export const permissionNameEnum = pgEnum(
    "permission_name",
    [
        "manage_users",
        "manage_global_roles",
        "manage_global_permissions",
        "manage_system_settings",
        "view_audit_logs",
        "manage_platform",
    ],
);

export const permissions = pgTable(
    "permissions",
    {
        id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
        name: permissionNameEnum("name").notNull().unique(),
        description: text("description").notNull(),
    }
);

export type PermissionName = (typeof permissionNameEnum.enumValues)[number];
