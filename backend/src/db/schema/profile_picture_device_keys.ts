import {
    bigint,
    index,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
} from "drizzle-orm/pg-core";

import { devices } from "./devices";
import { userProfilePictures } from "./user_profile_pictures";

export const profilePictureDeviceKeys = pgTable(
    "profile_picture_device_keys",
    {
        id: bigint("id", { mode: "number" })
            .generatedAlwaysAsIdentity()
            .primaryKey(),

        profilePictureId: bigint("profile_picture_id", {
            mode: "number",
        })
            .notNull()
            .references(() => userProfilePictures.id, {
                onDelete: "cascade",
            }),

        deviceId: bigint("device_id", {
            mode: "number",
        })
            .notNull()
            .references(() => devices.id, {
                onDelete: "cascade",
            }),

        encryptedProfilePictureKey: text(
            "encrypted_profile_picture_key",
        ).notNull(),

        createdAt: timestamp("created_at", {
            withTimezone: true,
            mode: "date",
        })
            .notNull()
            .defaultNow(),
    },

    (table) => [
        uniqueIndex("profile_picture_device_keys_picture_device_unique").on(
            table.profilePictureId,
            table.deviceId,
        ),

        index("profile_picture_device_keys_device_id_index").on(table.deviceId),
    ],
);
