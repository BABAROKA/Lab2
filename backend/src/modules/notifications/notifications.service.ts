import { NotificationNotFoundError } from "../../errors.js";
import { realtimeGateway } from "../../realtime/realtime-gateway.js";
import {
    Notification,
    NotificationsRepository,
    NotificationType,
} from "./notifications.repository.js";

export class NotificationsService {
    constructor(
        private readonly notificationsRepository: NotificationsRepository,
    ) { }

    async notify(
        userId: number,
        type: NotificationType,
        title: string,
        message: string,
    ): Promise<void> {
        await this.notificationsRepository.create(userId, type, title, message);
        realtimeGateway.emitToUser(userId, "notification:new", {
            type,
            title,
            message,
        });
    }

    async search(
        userId: number,
        opts: Parameters<NotificationsRepository["search"]>[1],
    ): Promise<Notification[]> {
        return this.notificationsRepository.search(userId, opts);
    }

    async countUnread(userId: number): Promise<number> {
        return this.notificationsRepository.countUnread(userId);
    }

    /** @throws */
    async markRead(userId: number, notificationId: number): Promise<void> {
        const ok = await this.notificationsRepository.markRead(
            userId,
            notificationId,
        );
        if (!ok) throw new NotificationNotFoundError();
    }

    async markAllRead(userId: number): Promise<void> {
        await this.notificationsRepository.markAllRead(userId);
    }
}
