import { Router } from "express";
import { access } from "../../middleware/auth.middleware.js";
import { listConversationCalls } from "../calls/calls.controller.js";
import { messagesRouter } from "../messages/messages.routes.js";
import {
    addMember,
    assignRole,
    createConversation,
    createInvite,
    getConversation,
    getSettings,
    leaveConversation,
    listConversations,
    listInvitesForConversation,
    listMembers,
    removeMember,
    revokeInvite,
    updateConversation,
    updateSettings,
} from "./conversations.controller.js";
import {
    requireConversationMember,
    requireConversationPermission,
} from "./conversations.middleware.js";

const router = Router();

router.use(access);

router.post("/", createConversation);
router.get("/", listConversations);

router.get("/:conversationUuid", requireConversationMember, getConversation);
router.patch(
    "/:conversationUuid",
    requireConversationPermission("manage_conversation"),
    updateConversation,
);
router.post(
    "/:conversationUuid/leave",
    requireConversationMember,
    leaveConversation,
);

router.get(
    "/:conversationUuid/members",
    requireConversationMember,
    listMembers,
);
router.post(
    "/:conversationUuid/members",
    requireConversationPermission("add_members"),
    addMember,
);
router.delete(
    "/:conversationUuid/members/:userUuid",
    requireConversationPermission("remove_members"),
    removeMember,
);
router.put(
    "/:conversationUuid/members/:userUuid/role",
    requireConversationPermission("manage_roles"),
    assignRole,
);

router.get(
    "/:conversationUuid/settings",
    requireConversationMember,
    getSettings,
);
router.patch(
    "/:conversationUuid/settings",
    requireConversationPermission("manage_conversation"),
    updateSettings,
);

router.post(
    "/:conversationUuid/invites",
    requireConversationPermission("manage_invites"),
    createInvite,
);
router.get(
    "/:conversationUuid/invites",
    requireConversationPermission("manage_invites"),
    listInvitesForConversation,
);
router.delete(
    "/:conversationUuid/invites/:inviteUuid",
    requireConversationPermission("manage_invites"),
    revokeInvite,
);

router.get(
    "/:conversationUuid/calls",
    requireConversationMember,
    listConversationCalls,
);

router.use(
    "/:conversationUuid/messages",
    requireConversationMember,
    messagesRouter,
);

export { router as conversationsRouter };
