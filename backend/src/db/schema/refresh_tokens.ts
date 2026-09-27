import {
    index,
    bigint,
    pgTable,
    text,
    timestamp,
    inet,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const refreshTokens = pgTable(
    "refresh_tokens",
    {
        id: bigint("id", { mode: "number" })
            .generatedAlwaysAsIdentity()
            .primaryKey(),
        userId: bigint("user_id", { mode: "number" })
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        tokenHash: text("token_hash").notNull().unique(),
        ipAddress: inet("ip_address").notNull(),
        expiresAt: timestamp("expires_at", {
            withTimezone: true,
            mode: "date",
        }).notNull(),
        revokedAt: timestamp("revoked_at", {
            withTimezone: true,
            mode: "date",
        }),
        createdAt: timestamp("created_at", {
            withTimezone: true,
            mode: "date",
        })
            .notNull()
            .defaultNow(),
    },
    (table) => [index("refresh_tokens_user_id_index").on(table.userId)],
);
