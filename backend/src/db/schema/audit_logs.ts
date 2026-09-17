import { pgTable, bigint, text, jsonb, timestamp, inet } from "drizzle-orm/pg-core";
import { users } from "./users";

export const auditLogs = pgTable(
    "audit_logs",
    {
        id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
        userId: bigint("user_id", { mode: "number" }).references(() => users.id, { onDelete: "set null" }),
        action: text("action").notNull(),
        entity: text("entity").notNull(),
        entityId: bigint("entity_id", { mode: "number" }),
        oldValue: jsonb("old_value"),
        newValue: jsonb("new_value"),
        ipAddress: inet("ip_address"),
        createdAt: timestamp("created_at", {
            withTimezone: true,
            mode: "date",
        }).notNull().defaultNow(),
    }
)
