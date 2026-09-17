import { pgTable, bigint, text, timestamp } from "drizzle-orm/pg-core";

export const permissions = pgTable(
    "permissions",
    {
        id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
        name: text("name").notNull().unique(),
        description: text("description").notNull(),
    }
);
