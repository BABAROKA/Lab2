import { bigint, text, pgTable, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const notifications = pgTable(
    "notifications",
    {
        id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
        userId: bigint("user_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade" }),
        type: text("type").notNull(),
        title: text("title").notNull(),
        message: text("message").notNull(),
        isRead: boolean("is_read").notNull().default(false),
        ReadAt: timestamp("read_at", {
            withTimezone: true,
            mode: "date",
        }),
    }
)
