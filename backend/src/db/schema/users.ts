import { bigint, uuid, boolean, timestamp, pgTable, text } from "drizzle-orm/pg-core";

export const users = pgTable(
    "users",
    {
        id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
        uuid: uuid("uuid").defaultRandom().notNull().unique(),
        firstName: text("first_name").notNull(),
        lastName: text("last_name"),
        email: text("email").notNull().unique(),
        passwordHash: text("password_hash").notNull(),
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at", {
            withTimezone: true,
            mode: "date",
        }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", {
            withTimezone: true,
            mode: "date",
        }).notNull().defaultNow().$onUpdate(() => new Date()),
    },
);
