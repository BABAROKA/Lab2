import {
    bigint,
    boolean,
    index,
    integer,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
} from "drizzle-orm/pg-core";

import { devices } from "./devices";

export const deviceSignedPrekeys = pgTable(
    "device_signed_prekeys",
    {
        id: bigint("id", { mode: "number" })
            .generatedAlwaysAsIdentity()
            .primaryKey(),

        deviceId: bigint("device_id", {
            mode: "number",
        })
            .notNull()
            .references(() => devices.id, {
                onDelete: "cascade",
            }),

        keyId: integer("key_id").notNull(),

        publicKey: text("public_key").notNull(),

        signature: text("signature").notNull(),

        isActive: boolean("is_active").notNull().default(true),

        expiresAt: timestamp("expires_at", {
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

    (table) => [
        uniqueIndex("device_signed_prekeys_device_key_unique").on(
            table.deviceId,
            table.keyId,
        ),

        index("device_signed_prekeys_device_id_index").on(table.deviceId),
    ],
);
