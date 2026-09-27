import {
    bigint,
    index,
    pgTable,
    timestamp,
    uniqueIndex,
} from "drizzle-orm/pg-core";

import { users } from "./users";

export const blockedUsers = pgTable(
    "blocked_users",
    {
        id: bigint("id", { mode: "number" })
            .generatedAlwaysAsIdentity()
            .primaryKey(),

        blockerId: bigint("blocker_id", {
            mode: "number",
        })
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),

        blockedId: bigint("blocked_id", {
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

    (table) => [
        uniqueIndex("blocked_users_blocker_blocked_unique").on(
            table.blockerId,
            table.blockedId,
        ),

        index("blocked_users_blocked_id_index").on(table.blockedId),
    ],
);
