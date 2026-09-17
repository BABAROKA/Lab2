import { pgTable, bigint, text, timestamp } from "drizzle-orm/pg-core";

export const roles = pgTable(
    "roles",
    {
        id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
        name: text("name").notNull().unique(),
        description: text("description").notNull(),
        createdAt: timestamp("created_at", {
            withTimezone: true,
            mode: "date",
        }).notNull().defaultNow(),
    }
);
