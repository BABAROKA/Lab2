import {
    conversationPermissionNameEnum,
    ConversationPermissionName,
} from "../../db/schema/conversation_permissions.js";
import {
    conversationRoleNameEnum,
    ConversationRoleName,
} from "../../db/schema/conversation_roles.js";

const member = [
    "send_messages",
    "edit_own_messages",
    "delete_own_messages",
    "send_attachments",
] as const;
const moderator = [...member, "delete_any_message", "remove_members"] as const;
const admin = [
    ...moderator,
    "add_members",
    "manage_invites",
    "manage_conversation",
    "manage_roles",
] as const;
const owner = [...admin, "manage_permissions"] as const;

export const CONVERSATION_ROLE_PERMISSIONS = {
    member,
    moderator,
    admin,
    owner,
} as const satisfies Record<
    ConversationRoleName,
    readonly ConversationPermissionName[]
>;

void (conversationRoleNameEnum.enumValues satisfies readonly ConversationRoleName[]);
void (conversationPermissionNameEnum.enumValues satisfies readonly ConversationPermissionName[]);
