import { pgTable, bigint, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const roleNameEnum = pgEnum(
    "role_name",
    [
        "admin",
        "user",
    ]
)

export const roles = pgTable(
    "roles",
    {
        id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
        name: roleNameEnum("name").notNull().unique(),
        description: text("description").notNull(),
        createdAt: timestamp("created_at", {
            withTimezone: true,
            mode: "date",
        }).notNull().defaultNow(),
    }
);
