import {
    bigint,
    index,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
} from "drizzle-orm/pg-core";

import { devices } from "./devices";
import { messages } from "./messages";

export const messageDeviceKeys = pgTable(
    "message_device_keys",
    {
        id: bigint("id", { mode: "number" })
            .generatedAlwaysAsIdentity()
            .primaryKey(),

        messageId: bigint("message_id", {
            mode: "number",
        })
            .notNull()
            .references(() => messages.id, {
                onDelete: "cascade",
            }),

        deviceId: bigint("device_id", {
            mode: "number",
        })
            .notNull()
            .references(() => devices.id, {
                onDelete: "cascade",
            }),

        encryptedMessageKey: text("encrypted_message_key").notNull(),

        createdAt: timestamp("created_at", {
            withTimezone: true,
            mode: "date",
        })
            .notNull()
            .defaultNow(),
    },

    (table) => [
        uniqueIndex("message_device_keys_message_device_unique").on(
            table.messageId,
            table.deviceId,
        ),

        index("message_device_keys_device_id_index").on(table.deviceId),
    ],
);
