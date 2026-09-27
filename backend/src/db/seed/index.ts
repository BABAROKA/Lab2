import { client, db } from "../client.js";
import {
    conversationPermissionNameEnum,
    conversationPermissions,
} from "../schema/conversation_permissions.js";
import { permissionNameEnum, permissions } from "../schema/permissions.js";
import { rolePermissions } from "../schema/role_permissions.js";
import { roleNameEnum, roles } from "../schema/roles.js";

type RoleName = (typeof roleNameEnum.enumValues)[number];
type PermissionName = (typeof permissionNameEnum.enumValues)[number];
type ConversationPermissionName = (typeof conversationPermissionNameEnum.enumValues)[number];

const ROLE_DESCRIPTIONS = {
    admin: "Full platform administrator",
    user: "Regular platform user",
} satisfies Record<RoleName, string>;

const PERMISSION_DESCRIPTIONS = {
    manage_users: "Manage any user account",
    manage_global_roles: "Create and assign platform roles",
    manage_global_permissions: "Grant and revoke platform permissions",
    manage_system_settings: "Change platform settings",
    view_audit_logs: "Read the audit log",
    manage_platform: "Full control over the platform",
} satisfies Record<PermissionName, string>;

const CONVERSATION_PERMISSION_DESCRIPTIONS = {
    send_messages: "Send messages",
    edit_own_messages: "Edit own messages",
    delete_own_messages: "Delete own messages",
    delete_any_message: "Delete anyone's messages",
    send_attachments: "Send attachments",
    add_members: "Add members",
    remove_members: "Remove members",
    manage_invites: "Create and revoke invites",
    manage_conversation: "Edit conversation name and settings",
    manage_roles: "Assign conversation roles",
    manage_permissions: "Change what each role can do",
} satisfies Record<ConversationPermissionName, string>;

const PLATFORM_ROLE_PERMISSIONS: Record<RoleName, readonly PermissionName[]> = {
    admin: permissionNameEnum.enumValues,
    user: [],
};

const must = <T>(value: T | undefined, what: string): T => {
    if (value === undefined) throw new Error(`seed: missing ${what}`);
    return value;
};

async function seed(): Promise<void> {
    await db
        .insert(roles)
        .values(roleNameEnum.enumValues.map((name) => ({ name, description: ROLE_DESCRIPTIONS[name] })))
        .onConflictDoNothing();

    await db
        .insert(permissions)
        .values(permissionNameEnum.enumValues.map((name) => ({ name, description: PERMISSION_DESCRIPTIONS[name] })))
        .onConflictDoNothing();

    await db
        .insert(conversationPermissions)
        .values(
            conversationPermissionNameEnum.enumValues.map((name) => ({
                name,
                description: CONVERSATION_PERMISSION_DESCRIPTIONS[name],
            })),
        )
        .onConflictDoNothing();

    const roleIds = new Map((await db.select().from(roles)).map((r) => [r.name, r.id] as const));
    const permissionIds = new Map((await db.select().from(permissions)).map((p) => [p.name, p.id] as const));

    const links = roleNameEnum.enumValues.flatMap((role) =>
        PLATFORM_ROLE_PERMISSIONS[role].map((permission) => ({
            roleId: must(roleIds.get(role), `role ${role}`),
            permissionId: must(permissionIds.get(permission), `permission ${permission}`),
        })),
    );

    if (links.length > 0) {
        await db.insert(rolePermissions).values(links).onConflictDoNothing();
    }
}

seed()
    .then(() => console.log("seed complete"))
    .catch((err) => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(() => client.end());
