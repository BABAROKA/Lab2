import {
    bigint,
    boolean,
    index,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

import { users } from "./users";

export const devicePlatformEnum = pgEnum("device_platform", [
    "web",
    "windows",
    "macos",
    "linux",
    "android",
    "ios",
]);

export const devices = pgTable(
    "devices",
    {
        id: bigint("id", { mode: "number" })
            .generatedAlwaysAsIdentity()
            .primaryKey(),

        uuid: uuid("uuid").defaultRandom().notNull().unique(),

        userId: bigint("user_id", {
            mode: "number",
        })
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),

        name: text("name").notNull(),

        platform: devicePlatformEnum("platform").notNull(),

        identityPublicKey: text("identity_public_key").notNull(),

        isActive: boolean("is_active").notNull().default(true),

        lastSeenAt: timestamp("last_seen_at", {
            withTimezone: true,
            mode: "date",
        }),

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

        updatedAt: timestamp("updated_at", {
            withTimezone: true,
            mode: "date",
        })
            .notNull()
            .defaultNow()
            .$onUpdate(() => new Date()),
    },

    (table) => [index("devices_user_id_index").on(table.userId)],
);

export type DevicePlatform = (typeof devicePlatformEnum.enumValues)[number];
