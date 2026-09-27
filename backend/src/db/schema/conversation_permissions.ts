import { bigint, pgEnum, pgTable, text } from "drizzle-orm/pg-core";

export const conversationPermissionNameEnum = pgEnum(
    "conversation_permission_name",
    [
        "send_messages",
        "edit_own_messages",
        "delete_own_messages",
        "delete_any_message",
        "send_attachments",
        "add_members",
        "remove_members",
        "manage_invites",
        "manage_conversation",
        "manage_roles",
        "manage_permissions",
    ],
);

export const conversationPermissions = pgTable("conversation_permissions", {
    id: bigint("id", { mode: "number" })
        .generatedAlwaysAsIdentity()
        .primaryKey(),

    name: conversationPermissionNameEnum("name").notNull().unique(),

    description: text("description").notNull(),
});
