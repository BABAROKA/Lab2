import { bigint, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";

export const refreshTokens = pgTable(
    "refresh_token",
    {
        id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
        userId: bigint("user_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade" }),
        token: text("token").notNull(),
        deviceName: text("device_name").notNull(),
        userAgent: text("user_agent"),
    },
    table => [
        uniqueIndex("refresh_token_user_unique").on(
            table.userId,
            table.token,
        )
    ]
)
