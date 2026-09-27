import {
    bigint,
    index,
    integer,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
} from "drizzle-orm/pg-core";

import { devices } from "./devices";

export const devicePrekeys = pgTable(
    "device_prekeys",
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

        usedAt: timestamp("used_at", {
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

    (table) => [
        uniqueIndex("device_prekeys_device_key_unique").on(
            table.deviceId,
            table.keyId,
        ),

        index("device_prekeys_device_id_index").on(table.deviceId),
    ],
);
