import { Router } from "express";
import {
    requireConversationMember,
    requireConversationPermission,
} from "../conversations/conversations.middleware.js";
import {
    addReaction,
    deleteMessage,
    editMessage,
    listMessages,
    markMessageRead,
    removeReaction,
    sendMessage,
} from "./messages.controller.js";

const router = Router({ mergeParams: true });

router.post("/", requireConversationPermission("send_messages"), sendMessage);
router.get("/", requireConversationMember, listMessages);
router.patch("/:messageId", requireConversationMember, editMessage);
router.delete("/:messageId", requireConversationMember, deleteMessage);
router.post("/:messageId/reactions", requireConversationMember, addReaction);
router.delete(
    "/:messageId/reactions/:reaction",
    requireConversationMember,
    removeReaction,
);
router.post("/:messageId/read", requireConversationMember, markMessageRead);

export { router as messagesRouter };
