import {
    bigint,
    index,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

import { users } from "./users";

export const files = pgTable(
    "files",
    {
        id: bigint("id", { mode: "number" })
            .generatedAlwaysAsIdentity()
            .primaryKey(),

        uuid: uuid("uuid").defaultRandom().notNull().unique(),

        storageKey: text("storage_key").notNull().unique(),

        sizeBytes: bigint("size_bytes", {
            mode: "number",
        }).notNull(),

        sha256: text("sha256").notNull(),

        uploadedBy: bigint("uploaded_by", {
            mode: "number",
        })
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),

        createdAt: timestamp("created_at", {
            withTimezone: true,
            mode: "date",
        })
            .notNull()
            .defaultNow(),
    },

    (table) => [index("files_uploaded_by_index").on(table.uploadedBy)],
);
