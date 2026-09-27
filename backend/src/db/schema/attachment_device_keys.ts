import {
    bigint,
    index,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
} from "drizzle-orm/pg-core";

import { devices } from "./devices";
import { messageAttachments } from "./message_attachments";

export const attachmentDeviceKeys = pgTable(
    "attachment_device_keys",
    {
        id: bigint("id", { mode: "number" })
            .generatedAlwaysAsIdentity()
            .primaryKey(),

        attachmentId: bigint("attachment_id", {
            mode: "number",
        })
            .notNull()
            .references(() => messageAttachments.id, {
                onDelete: "cascade",
            }),

        deviceId: bigint("device_id", {
            mode: "number",
        })
            .notNull()
            .references(() => devices.id, {
                onDelete: "cascade",
            }),

        encryptedAttachmentKey: text("encrypted_attachment_key").notNull(),

        createdAt: timestamp("created_at", {
            withTimezone: true,
            mode: "date",
        })
            .notNull()
            .defaultNow(),
    },

    (table) => [
        uniqueIndex("attachment_device_keys_attachment_device_unique").on(
            table.attachmentId,
            table.deviceId,
        ),

        index("attachment_device_keys_device_id_index").on(table.deviceId),
    ],
);
