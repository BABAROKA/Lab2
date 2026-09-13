import { pgTable, bigint, text, timestamp } from "drizzle-orm/pg-core";

export const permissions = pgTable(
    "permissions",
    {
        id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
        name: text("name").notNull().unique(),
        description: text("description").notNull(),
        createdAt: timestamp("created_at", {
            withTimezone: true,
            mode: "date",
        }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", {
            withTimezone: true,
            mode: "date",
        }).notNull().defaultNow(),
    }
);
