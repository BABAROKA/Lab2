import { pgTable, bigint, text, timestamp } from "drizzle-orm/pg-core";

export const settings = pgTable(
    "settings",
    {
        id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
        key: text("key").notNull().unique(),
        value: text("value").notNull(),
        description: text("descriptions"),
        updatedAt: timestamp("updated_at", {
            withTimezone: true,
            mode: "date",
        }).$onUpdate(() => new Date())
    }
)
