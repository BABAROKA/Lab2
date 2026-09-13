import { bigint, timestamp, pgTable, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";
import { roles } from "./roles";

export const userRoles = pgTable(
    "user_roles",
    {
        id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
        userId: bigint("user_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade" }),
        roleId: bigint("role_id", { mode: "number" }).notNull().references(() => roles.id, { onDelete: "cascade" }),
        assignedAt: timestamp("assigned_at", {
            withTimezone: true,
            mode: "date",
        }).notNull().defaultNow(),
    },
    table => [
        uniqueIndex("user_roles_user_role_unique").on(
            table.userId,
            table.roleId,
        ),
    ]
);
