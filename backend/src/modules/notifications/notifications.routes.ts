import { Router } from "express";
import { access } from "../../middleware/auth.middleware.js";
import {
    listNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    unreadCount,
} from "./notifications.controller.js";

const router = Router();
router.use(access);

router.get("/", listNotifications);
router.get("/unread-count", unreadCount);
router.post("/:notificationId/read", markNotificationRead);
router.post("/read-all", markAllNotificationsRead);

export { router as notificationsRouter };
