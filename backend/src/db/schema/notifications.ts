import {
    index,
    pgEnum,
    bigint,
    text,
    pgTable,
    boolean,
    timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const notificationTypeEnum = pgEnum("notification_type", [
    "message",
    "mention",
    "reaction",
    "conversation_invite",
    "conversation_added",
    "system",
    "security",
]);

export const notifications = pgTable(
    "notifications",
    {
        id: bigint("id", { mode: "number" })
            .generatedAlwaysAsIdentity()
            .primaryKey(),
        userId: bigint("user_id", { mode: "number" })
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: notificationTypeEnum("type").notNull(),
        title: text("title").notNull(),
        message: text("message").notNull(),
        isRead: boolean("is_read").notNull().default(false),
        readAt: timestamp("read_at", {
            withTimezone: true,
            mode: "date",
        }),
        createdAt: timestamp("created_at", {
            withTimezone: true,
            mode: "date",
        })
            .notNull()
            .defaultNow(),

        updatedAt: timestamp("updated_at", {
            withTimezone: true,
            mode: "date",
        })
            .notNull()
            .defaultNow()
            .$onUpdate(() => new Date()),
    },

    (table) => [index("notifications_user_id_index").on(table.userId)],
);
