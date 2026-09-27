import {
    bigint,
    pgTable,
    timestamp,
    uniqueIndex,
} from "drizzle-orm/pg-core";

import { users } from "./users";
import { files } from "./files";

export const userProfilePictures = pgTable(
    "user_profile_pictures",
    {
        id: bigint("id", { mode: "number" })
            .generatedAlwaysAsIdentity()
            .primaryKey(),

        userId: bigint("user_id", {
            mode: "number",
        })
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),

        fileId: bigint("file_id", {
            mode: "number",
        })
            .notNull()
            .references(() => files.id, {
                onDelete: "cascade",
            }),

        createdAt: timestamp("created_at", {
            withTimezone: true,
            mode: "date",
        })
            .notNull()
            .defaultNow(),
    },

    table => [
        uniqueIndex(
            "user_profile_pictures_user_unique",
        ).on(table.userId),

        uniqueIndex(
            "user_profile_pictures_file_unique",
        ).on(table.fileId),
    ],
);
