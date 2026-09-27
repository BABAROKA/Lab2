import { bigint, index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { conversations } from "./conversations";
import { users } from "./users";

export const conversationInvites = pgTable(
    "conversation_invites",
    {
        id: bigint("id", { mode: "number" })
            .generatedAlwaysAsIdentity()
            .primaryKey(),

        uuid: uuid("uuid").defaultRandom().notNull().unique(),

        conversationId: bigint("conversation_id", {
            mode: "number",
        })
            .notNull()
            .references(() => conversations.id, {
                onDelete: "cascade",
            }),

        inviterId: bigint("inviter_id", {
            mode: "number",
        })
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),

        inviteeId: bigint("invitee_id", {
            mode: "number",
        })
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),

        expiresAt: timestamp("expires_at", {
            withTimezone: true,
            mode: "date",
        }).notNull(),

        acceptedAt: timestamp("accepted_at", {
            withTimezone: true,
            mode: "date",
        }),

        revokedAt: timestamp("revoked_at", {
            withTimezone: true,
            mode: "date",
        }),

        createdAt: timestamp("created_at", {
            withTimezone: true,
            mode: "date",
        })
            .notNull()
            .defaultNow(),
    },

    (table) => [
        index("conversation_invites_conversation_id_index").on(
            table.conversationId,
        ),

        index("conversation_invites_invitee_id_index").on(table.inviteeId),
    ],
);
