import {
    bigint,
    index,
    pgTable,
    timestamp,
    uniqueIndex,
} from "drizzle-orm/pg-core";

import { devices } from "./devices";
import { messages } from "./messages";
import { users } from "./users";

export const messageReads = pgTable(
    "message_reads",
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

        userId: bigint("user_id", {
            mode: "number",
        })
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),

        deviceId: bigint("device_id", {
            mode: "number",
        })
            .notNull()
            .references(() => devices.id, {
                onDelete: "cascade",
            }),

        readAt: timestamp("read_at", {
            withTimezone: true,
            mode: "date",
        })
            .notNull()
            .defaultNow(),
    },

    (table) => [
        uniqueIndex("message_reads_message_device_unique").on(
            table.messageId,
            table.deviceId,
        ),

        index("message_reads_user_id_index").on(table.userId),
    ],
);
