import { Request, Response } from "express";
import { z } from "zod";
import { notificationTypeEnum } from "../../db/schema/notifications.js";
import { sendList } from "../../lib/list-format.js";
import {
    cursorSchema,
    limitSchema,
    listFormatSchema,
    positiveIntParam,
} from "../../schemas/common.js";
import { NotificationsRepository } from "./notifications.repository.js";
import { NotificationsService } from "./notifications.service.js";

const notificationsService = new NotificationsService(
    new NotificationsRepository(),
);

const searchNotificationsQuerySchema = z.object({
    limit: limitSchema,
    before: cursorSchema,
    type: z.enum(notificationTypeEnum.enumValues).optional(),
    isRead: z.coerce.boolean().optional(),
    search: z.string().trim().min(1).max(100).optional(),
    format: listFormatSchema,
});

export const listNotifications = async (req: Request, res: Response) => {
    const query = searchNotificationsQuerySchema.parse(req.query);
    const rows = await notificationsService.search(req.auth.id, query);
    sendList(res, "notifications", rows, query.format);
};

export const unreadCount = async (req: Request, res: Response) => {
    res.json({ count: await notificationsService.countUnread(req.auth.id) });
};

export const markNotificationRead = async (req: Request, res: Response) => {
    const notificationId = positiveIntParam.parse(req.params.notificationId);
    await notificationsService.markRead(req.auth.id, notificationId);
    res.status(204).end();
};

export const markAllNotificationsRead = async (req: Request, res: Response) => {
    await notificationsService.markAllRead(req.auth.id);
    res.status(204).end();
};
