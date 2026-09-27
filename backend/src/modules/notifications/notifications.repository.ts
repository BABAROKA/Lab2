import { and, count, desc, eq, ilike, lt } from "drizzle-orm";
import { db } from "../../db/client.js";
import {
    notifications,
    notificationTypeEnum,
} from "../../db/schema/notifications.js";

export type Notification = typeof notifications.$inferSelect;
export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];

export class NotificationsRepository {
    async create(
        userId: number,
        type: NotificationType,
        title: string,
        message: string,
    ): Promise<void> {
        await db.insert(notifications).values({ userId, type, title, message });
    }

    async search(
        userId: number,
        opts: {
            limit: number;
            before?: number | undefined;
            type?: NotificationType | undefined;
            isRead?: boolean | undefined;
            search?: string | undefined;
        },
    ): Promise<Notification[]> {
        const conditions = [eq(notifications.userId, userId)];
        if (opts.before !== undefined)
            conditions.push(lt(notifications.id, opts.before));
        if (opts.type) conditions.push(eq(notifications.type, opts.type));
        if (opts.isRead !== undefined)
            conditions.push(eq(notifications.isRead, opts.isRead));
        if (opts.search)
            conditions.push(ilike(notifications.title, `%${opts.search}%`));

        return db
            .select()
            .from(notifications)
            .where(and(...conditions))
            .orderBy(desc(notifications.id))
            .limit(opts.limit);
    }

    async countUnread(userId: number): Promise<number> {
        const [row] = await db
            .select({ n: count() })
            .from(notifications)
            .where(
                and(
                    eq(notifications.userId, userId),
                    eq(notifications.isRead, false),
                ),
            );
        return row?.n ?? 0;
    }

    async markRead(userId: number, notificationId: number): Promise<boolean> {
        const rows = await db
            .update(notifications)
            .set({ isRead: true, readAt: new Date() })
            .where(
                and(
                    eq(notifications.id, notificationId),
                    eq(notifications.userId, userId),
                ),
            )
            .returning({ id: notifications.id });
        return rows.length > 0;
    }

    async markAllRead(userId: number): Promise<void> {
        await db
            .update(notifications)
            .set({ isRead: true, readAt: new Date() })
            .where(
                and(
                    eq(notifications.userId, userId),
                    eq(notifications.isRead, false),
                ),
            );
    }
}
