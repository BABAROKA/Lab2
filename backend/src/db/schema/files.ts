import { pgTable, bigint, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const files = pgTable(
    "files",
    {
        id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
        entity: text("entity").notNull(),
        entityId: bigint("entity_id", { mode: "number" }),
        fileName: text("file_name").notNull(),
        filePath: text("file_path").notNull(),
        fileSize: bigint("file_size", { mode: "number" }).notNull(),
        uploadedBy: bigint("uploaded_by", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at", {
            withTimezone: true,
            mode: "date"
        }),
    }
)
