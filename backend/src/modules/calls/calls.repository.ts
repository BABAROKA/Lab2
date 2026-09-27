import { and, desc, eq, gte, isNull, lte, lt } from "drizzle-orm";
import { db } from "../../db/client.js";
import { calls, CallStatus, CallType } from "../../db/schema/calls.js";
import { conversationMembers } from "../../db/schema/conversation_members.js";
import { conversations } from "../../db/schema/conversations.js";
import { users } from "../../db/schema/users.js";

export type Call = typeof calls.$inferSelect;

export interface CallListRow {
    uuid: string;
    conversationUuid: string;
    callerUuid: string;
    type: CallType;
    status: CallStatus;
    startedAt: Date;
    endedAt: Date | null;
    createdAt: Date;
}

export class CallsRepository {
    async create(
        conversationId: number,
        callerId: number,
        type: CallType,
    ): Promise<Call> {
        const [row] = await db
            .insert(calls)
            .values({ conversationId, callerId, type })
            .returning();
        if (!row) throw new Error("call insert returned no row");
        return row;
    }

    async findByUuid(callUuid: string): Promise<Call | null> {
        const [row] = await db
            .select()
            .from(calls)
            .where(eq(calls.uuid, callUuid))
            .limit(1);
        return row ?? null;
    }

    async setStatus(
        callId: number,
        status: CallStatus,
        endedAt?: Date,
    ): Promise<void> {
        await db
            .update(calls)
            .set({ status, endedAt: endedAt ?? null })
            .where(eq(calls.id, callId));
    }

    async listForConversation(
        conversationId: number,
        opts: { limit: number; before?: Date | undefined },
    ): Promise<CallListRow[]> {
        const conditions = [eq(calls.conversationId, conversationId)];
        if (opts.before !== undefined)
            conditions.push(lt(calls.createdAt, opts.before));

        return db
            .select({
                uuid: calls.uuid,
                conversationUuid: conversations.uuid,
                callerUuid: users.uuid,
                type: calls.type,
                status: calls.status,
                startedAt: calls.startedAt,
                endedAt: calls.endedAt,
                createdAt: calls.createdAt,
            })
            .from(calls)
            .innerJoin(
                conversations,
                eq(conversations.id, calls.conversationId),
            )
            .innerJoin(users, eq(users.id, calls.callerId))
            .where(and(...conditions))
            .orderBy(desc(calls.createdAt))
            .limit(opts.limit);
    }

    async searchForUser(
        userId: number,
        opts: {
            limit: number;
            before?: Date | undefined;
            type?: CallType | undefined;
            status?: CallStatus | undefined;
            conversationId?: number;
            from?: Date | undefined;
            to?: Date | undefined;
        },
    ): Promise<CallListRow[]> {
        const conditions = [
            eq(conversationMembers.userId, userId),
            isNull(conversationMembers.leftAt),
        ];
        if (opts.before !== undefined)
            conditions.push(lt(calls.createdAt, opts.before));
        if (opts.type) conditions.push(eq(calls.type, opts.type));
        if (opts.status) conditions.push(eq(calls.status, opts.status));
        if (opts.conversationId !== undefined)
            conditions.push(eq(calls.conversationId, opts.conversationId));
        if (opts.from) conditions.push(gte(calls.startedAt, opts.from));
        if (opts.to) conditions.push(lte(calls.startedAt, opts.to));

        return db
            .select({
                uuid: calls.uuid,
                conversationUuid: conversations.uuid,
                callerUuid: users.uuid,
                type: calls.type,
                status: calls.status,
                startedAt: calls.startedAt,
                endedAt: calls.endedAt,
                createdAt: calls.createdAt,
            })
            .from(calls)
            .innerJoin(
                conversationMembers,
                eq(conversationMembers.conversationId, calls.conversationId),
            )
            .innerJoin(
                conversations,
                eq(conversations.id, calls.conversationId),
            )
            .innerJoin(users, eq(users.id, calls.callerId))
            .where(and(...conditions))
            .orderBy(desc(calls.createdAt))
            .limit(opts.limit);
    }
}
