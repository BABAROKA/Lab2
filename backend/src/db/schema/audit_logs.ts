import {
    index,
    pgTable,
    bigint,
    text,
    pgEnum,
    jsonb,
    timestamp,
    inet,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const auditActionEnum = pgEnum("audit_action", [
    "create",
    "update",
    "delete",
    "login",
    "logout",
    "register",
    "password_change",
    "account_deactivate",
    "role_assign",
    "role_remove",
    "permission_grant",
    "permission_revoke",
    "invite_create",
    "invite_accept",
    "invite_revoke",
    "device_register",
    "device_revoke",
    "error",
]);

export const auditEntityEnum = pgEnum("audit_entity", [
    "user",
    "role",
    "permission",
    "refresh_token",
    "conversation",
    "conversation_member",
    "conversation_role",
    "conversation_permission",
    "conversation_invite",
    "message",
    "file",
    "device",
    "profile_picture",
    "notification",
    "settings",
]);

export const auditLogs = pgTable(
    "audit_logs",
    {
        id: bigint("id", { mode: "number" })
            .generatedAlwaysAsIdentity()
            .primaryKey(),
        userId: bigint("user_id", { mode: "number" }).references(
            () => users.id,
            { onDelete: "set null" },
        ),
        action: auditActionEnum("action").notNull(),
        entity: auditEntityEnum("entity").notNull(),
        entityId: bigint("entity_id", { mode: "number" }),
        oldValue: jsonb("old_value"),
        newValue: jsonb("new_value"),
        ipAddress: inet("ip_address"),
        createdAt: timestamp("created_at", {
            withTimezone: true,
            mode: "date",
        })
            .notNull()
            .defaultNow(),
    },
    (table) => [
        index("audit_logs_user_id_index").on(table.userId),

        index("audit_logs_entity_entity_id_index").on(
            table.entity,
            table.entityId,
        ),

        index("audit_logs_created_at_index").on(table.createdAt),
    ],
);
