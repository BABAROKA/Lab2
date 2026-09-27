import {
    bigint,
    index,
    pgEnum,
    pgTable,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";
import { conversations } from "./conversations.js";
import { users } from "./users.js";

export const callTypeEnum = pgEnum("call_type", ["audio", "video"]);
export const callStatusEnum = pgEnum("call_status", [
    "ringing",
    "accepted",
    "declined",
    "missed",
    "ended",
]);

export type CallType = (typeof callTypeEnum.enumValues)[number];
export type CallStatus = (typeof callStatusEnum.enumValues)[number];

export const calls = pgTable(
    "calls",
    {
        id: bigint("id", { mode: "number" })
            .generatedAlwaysAsIdentity()
            .primaryKey(),
        uuid: uuid("uuid").defaultRandom().notNull().unique(),

        conversationId: bigint("conversation_id", { mode: "number" })
            .notNull()
            .references(() => conversations.id, { onDelete: "cascade" }),

        callerId: bigint("caller_id", { mode: "number" })
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),

        type: callTypeEnum("type").notNull(),
        status: callStatusEnum("status").notNull().default("ringing"),

        startedAt: timestamp("started_at", { withTimezone: true, mode: "date" })
            .notNull()
            .defaultNow(),
        endedAt: timestamp("ended_at", { withTimezone: true, mode: "date" }),
        createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
            .notNull()
            .defaultNow(),
    },
    (table) => [
        index("calls_conversation_id_index").on(table.conversationId),
        index("calls_caller_id_index").on(table.callerId),
    ],
);
