import { and, asc, count, desc, eq, ilike, isNull, lt } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../../db/client.js";
import { Tx } from "../../db/types.js";
import {
    conversations,
    ConversationType,
} from "../../db/schema/conversations.js";
import { conversationMembers } from "../../db/schema/conversation_members.js";
import {
    conversationRoles,
    conversationRoleNameEnum,
    ConversationRoleName,
} from "../../db/schema/conversation_roles.js";
import { conversationRolePermissions } from "../../db/schema/conversation_role_permissions.js";
import { conversationUserRoles } from "../../db/schema/conversation_user_roles.js";
import {
    conversationPermissions,
    ConversationPermissionName,
} from "../../db/schema/conversation_permissions.js";
import { conversationSettings } from "../../db/schema/conversation_settings.js";
import { conversationInvites } from "../../db/schema/conversation_invites.js";
import { users } from "../../db/schema/users.js";
import {
    conversationPermissionIds,
    must,
} from "./conversation-permissions.cache.js";
import { CONVERSATION_ROLE_PERMISSIONS } from "./conversation-role-permissions.js";

export type Conversation = typeof conversations.$inferSelect;
export type ConversationInvite = typeof conversationInvites.$inferSelect;

async function seedRolesAndPermissions(
    tx: Tx,
    conversationId: number,
    createdBy: number,
) {
    const permissionIds = await conversationPermissionIds();

    const insertedRoles = await tx
        .insert(conversationRoles)
        .values(
            conversationRoleNameEnum.enumValues.map((name) => ({
                conversationId,
                name,
                createdBy,
            })),
        )
        .returning({ id: conversationRoles.id, name: conversationRoles.name });

    const roleIdByName = Object.fromEntries(
        insertedRoles.map((r) => [r.name, r.id]),
    ) as Record<ConversationRoleName, number>;

    await tx.insert(conversationRolePermissions).values(
        conversationRoleNameEnum.enumValues.flatMap((role) =>
            CONVERSATION_ROLE_PERMISSIONS[role].map(
                (permission: ConversationPermissionName) => ({
                    roleId: roleIdByName[role],
                    permissionId: must(
                        permissionIds.get(permission),
                        `conversation permission ${permission}`,
                    ),
                }),
            ),
        ),
    );

    return roleIdByName;
}

export class ConversationsRepository {
    async findDirectBetween(
        userIdA: number,
        userIdB: number,
    ): Promise<Conversation | null> {
        const m1 = alias(conversationMembers, "m1");
        const m2 = alias(conversationMembers, "m2");

        const [row] = await db
            .select({ conversation: conversations })
            .from(conversations)
            .innerJoin(
                m1,
                and(
                    eq(m1.conversationId, conversations.id),
                    eq(m1.userId, userIdA),
                    isNull(m1.leftAt),
                ),
            )
            .innerJoin(
                m2,
                and(
                    eq(m2.conversationId, conversations.id),
                    eq(m2.userId, userIdB),
                    isNull(m2.leftAt),
                ),
            )
            .where(eq(conversations.type, "direct"))
            .limit(1);

        return row?.conversation ?? null;
    }

    async createDirect(
        userIdA: number,
        userIdB: number,
    ): Promise<Conversation> {
        return db.transaction(async (tx: Tx) => {
            const [conversation] = await tx
                .insert(conversations)
                .values({ type: "direct", createdBy: userIdA })
                .returning();
            if (!conversation)
                throw new Error("conversation insert returned no row");

            const roleIdByName = await seedRolesAndPermissions(
                tx,
                conversation.id,
                userIdA,
            );

            const insertedMembers = await tx
                .insert(conversationMembers)
                .values([
                    { conversationId: conversation.id, userId: userIdA },
                    { conversationId: conversation.id, userId: userIdB },
                ])
                .returning({ id: conversationMembers.id });

            await tx
                .insert(conversationUserRoles)
                .values(
                    insertedMembers.map((m) => ({
                        conversationMemberId: m.id,
                        conversationRoleId: roleIdByName.owner,
                    })),
                );

            return conversation;
        });
    }

    async createGroup(creatorId: number, name: string): Promise<Conversation> {
        return db.transaction(async (tx: Tx) => {
            const [conversation] = await tx
                .insert(conversations)
                .values({ type: "group", name, createdBy: creatorId })
                .returning();
            if (!conversation)
                throw new Error("conversation insert returned no row");

            const roleIdByName = await seedRolesAndPermissions(
                tx,
                conversation.id,
                creatorId,
            );

            const [member] = await tx
                .insert(conversationMembers)
                .values({ conversationId: conversation.id, userId: creatorId })
                .returning({ id: conversationMembers.id });
            if (!member) throw new Error("member insert returned no row");

            await tx
                .insert(conversationUserRoles)
                .values({
                    conversationMemberId: member.id,
                    conversationRoleId: roleIdByName.owner,
                });

            return conversation;
        });
    }

    async findById(conversationId: number): Promise<Conversation | null> {
        const [row] = await db
            .select()
            .from(conversations)
            .where(eq(conversations.id, conversationId))
            .limit(1);
        return row ?? null;
    }

    async findForMember(
        conversationId: number,
        userId: number,
    ): Promise<Conversation | null> {
        const [row] = await db
            .select({ conversation: conversations })
            .from(conversations)
            .innerJoin(
                conversationMembers,
                and(
                    eq(conversationMembers.conversationId, conversations.id),
                    eq(conversationMembers.userId, userId),
                    isNull(conversationMembers.leftAt),
                ),
            )
            .where(eq(conversations.id, conversationId))
            .limit(1);

        return row?.conversation ?? null;
    }

    async findForMemberByUuid(
        conversationUuid: string,
        userId: number,
    ): Promise<Conversation | null> {
        const [row] = await db
            .select({ conversation: conversations })
            .from(conversations)
            .innerJoin(
                conversationMembers,
                and(
                    eq(conversationMembers.conversationId, conversations.id),
                    eq(conversationMembers.userId, userId),
                    isNull(conversationMembers.leftAt),
                ),
            )
            .where(eq(conversations.uuid, conversationUuid))
            .limit(1);

        return row?.conversation ?? null;
    }

    async listForUser(
        userId: number,
        opts: {
            limit: number;
            before?: Date | undefined;
            search?: string | undefined;
            type?: ConversationType | undefined;
            sort: "recent" | "name";
        },
    ): Promise<Conversation[]> {
        const conditions = [
            eq(conversationMembers.userId, userId),
            isNull(conversationMembers.leftAt),
        ];
        if (opts.type) conditions.push(eq(conversations.type, opts.type));
        if (opts.search)
            conditions.push(ilike(conversations.name, `%${opts.search}%`));
        if (opts.sort === "recent" && opts.before !== undefined) {
            conditions.push(lt(conversations.updatedAt, opts.before));
        }

        const orderBy =
            opts.sort === "name"
                ? asc(conversations.name)
                : desc(conversations.updatedAt);

        const rows = await db
            .select({ conversation: conversations })
            .from(conversations)
            .innerJoin(
                conversationMembers,
                eq(conversationMembers.conversationId, conversations.id),
            )
            .where(and(...conditions))
            .orderBy(orderBy)
            .limit(opts.limit);

        return rows.map((r) => r.conversation);
    }

    async listConversationIdsForUser(userId: number): Promise<number[]> {
        const rows = await db
            .select({ id: conversationMembers.conversationId })
            .from(conversationMembers)
            .where(
                and(
                    eq(conversationMembers.userId, userId),
                    isNull(conversationMembers.leftAt),
                ),
            );
        return rows.map((r) => r.id);
    }

    async updateName(
        conversationId: number,
        updatedBy: number,
        name: string,
    ): Promise<Conversation | null> {
        const [row] = await db
            .update(conversations)
            .set({ name, updatedBy })
            .where(eq(conversations.id, conversationId))
            .returning();
        return row ?? null;
    }

    async listMembers(conversationId: number) {
        return db
            .select({
                userUuid: users.uuid,
                firstName: users.firstName,
                lastName: users.lastName,
                joinedAt: conversationMembers.joinedAt,
                roleName: conversationRoles.name,
            })
            .from(conversationMembers)
            .innerJoin(users, eq(users.id, conversationMembers.userId))
            .leftJoin(
                conversationUserRoles,
                eq(
                    conversationUserRoles.conversationMemberId,
                    conversationMembers.id,
                ),
            )
            .leftJoin(
                conversationRoles,
                eq(
                    conversationRoles.id,
                    conversationUserRoles.conversationRoleId,
                ),
            )
            .where(
                and(
                    eq(conversationMembers.conversationId, conversationId),
                    isNull(conversationMembers.leftAt),
                ),
            );
    }

    async findActiveMember(conversationId: number, userId: number) {
        const [row] = await db
            .select()
            .from(conversationMembers)
            .where(
                and(
                    eq(conversationMembers.conversationId, conversationId),
                    eq(conversationMembers.userId, userId),
                    isNull(conversationMembers.leftAt),
                ),
            )
            .limit(1);
        return row ?? null;
    }

    async findFormerMember(conversationId: number, userId: number) {
        const [row] = await db
            .select()
            .from(conversationMembers)
            .where(
                and(
                    eq(conversationMembers.conversationId, conversationId),
                    eq(conversationMembers.userId, userId),
                ),
            )
            .limit(1);
        return row ?? null;
    }

    async listActiveMemberUserIds(conversationId: number): Promise<number[]> {
        const rows = await db
            .select({ userId: conversationMembers.userId })
            .from(conversationMembers)
            .where(
                and(
                    eq(conversationMembers.conversationId, conversationId),
                    isNull(conversationMembers.leftAt),
                ),
            );
        return rows.map((r) => r.userId);
    }

    async countOwners(conversationId: number): Promise<number> {
        const [row] = await db
            .select({ n: count() })
            .from(conversationUserRoles)
            .innerJoin(
                conversationMembers,
                eq(
                    conversationMembers.id,
                    conversationUserRoles.conversationMemberId,
                ),
            )
            .innerJoin(
                conversationRoles,
                eq(
                    conversationRoles.id,
                    conversationUserRoles.conversationRoleId,
                ),
            )
            .where(
                and(
                    eq(conversationMembers.conversationId, conversationId),
                    isNull(conversationMembers.leftAt),
                    eq(conversationRoles.name, "owner"),
                ),
            );
        return row?.n ?? 0;
    }

    async getMemberRole(
        conversationId: number,
        userId: number,
    ): Promise<ConversationRoleName | null> {
        const [row] = await db
            .select({ name: conversationRoles.name })
            .from(conversationUserRoles)
            .innerJoin(
                conversationMembers,
                eq(
                    conversationMembers.id,
                    conversationUserRoles.conversationMemberId,
                ),
            )
            .innerJoin(
                conversationRoles,
                eq(
                    conversationRoles.id,
                    conversationUserRoles.conversationRoleId,
                ),
            )
            .where(
                and(
                    eq(conversationMembers.conversationId, conversationId),
                    eq(conversationMembers.userId, userId),
                    isNull(conversationMembers.leftAt),
                ),
            )
            .limit(1);
        return row?.name ?? null;
    }

    async memberHasPermission(
        conversationId: number,
        userId: number,
        permission: ConversationPermissionName,
    ): Promise<boolean> {
        const [row] = await db
            .select({ id: conversationPermissions.id })
            .from(conversationMembers)
            .innerJoin(
                conversationUserRoles,
                eq(
                    conversationUserRoles.conversationMemberId,
                    conversationMembers.id,
                ),
            )
            .innerJoin(
                conversationRoles,
                and(
                    eq(
                        conversationRoles.id,
                        conversationUserRoles.conversationRoleId,
                    ),
                    eq(conversationRoles.conversationId, conversationId),
                ),
            )
            .innerJoin(
                conversationRolePermissions,
                eq(conversationRolePermissions.roleId, conversationRoles.id),
            )
            .innerJoin(
                conversationPermissions,
                and(
                    eq(
                        conversationPermissions.id,
                        conversationRolePermissions.permissionId,
                    ),
                    eq(conversationPermissions.name, permission),
                ),
            )
            .where(
                and(
                    eq(conversationMembers.conversationId, conversationId),
                    eq(conversationMembers.userId, userId),
                    isNull(conversationMembers.leftAt),
                ),
            )
            .limit(1);

        return row !== undefined;
    }

    async setMemberRole(
        conversationMemberId: number,
        roleId: number,
    ): Promise<void> {
        await db.transaction(async (tx: Tx) => {
            await tx
                .delete(conversationUserRoles)
                .where(
                    eq(
                        conversationUserRoles.conversationMemberId,
                        conversationMemberId,
                    ),
                );
            await tx
                .insert(conversationUserRoles)
                .values({ conversationMemberId, conversationRoleId: roleId });
        });
    }

    async findRoleByName(conversationId: number, name: ConversationRoleName) {
        const [row] = await db
            .select()
            .from(conversationRoles)
            .where(
                and(
                    eq(conversationRoles.conversationId, conversationId),
                    eq(conversationRoles.name, name),
                ),
            )
            .limit(1);
        return row ?? null;
    }

    async reactivateMember(
        conversationId: number,
        userId: number,
        memberRoleId: number,
    ): Promise<void> {
        await db.transaction(async (tx: Tx) => {
            const [member] = await tx
                .update(conversationMembers)
                .set({ leftAt: null })
                .where(
                    and(
                        eq(conversationMembers.conversationId, conversationId),
                        eq(conversationMembers.userId, userId),
                    ),
                )
                .returning({ id: conversationMembers.id });
            if (!member)
                throw new Error(
                    "reactivateMember: no member row to reactivate",
                );

            await tx
                .delete(conversationUserRoles)
                .where(
                    eq(conversationUserRoles.conversationMemberId, member.id),
                );
            await tx
                .insert(conversationUserRoles)
                .values({
                    conversationMemberId: member.id,
                    conversationRoleId: memberRoleId,
                });
        });
    }

    async removeMember(conversationId: number, userId: number): Promise<void> {
        await db
            .update(conversationMembers)
            .set({ leftAt: new Date() })
            .where(
                and(
                    eq(conversationMembers.conversationId, conversationId),
                    eq(conversationMembers.userId, userId),
                ),
            );
    }

    async getSettings(conversationId: number) {
        const [row] = await db
            .select()
            .from(conversationSettings)
            .where(eq(conversationSettings.conversationId, conversationId))
            .limit(1);
        return row ?? null;
    }

    async upsertSettings(
        conversationId: number,
        input: {
            disappearingMessages: boolean;
            disappearingMessagesSeconds: number | null;
        },
    ) {
        const [row] = await db
            .insert(conversationSettings)
            .values({ conversationId, ...input })
            .onConflictDoUpdate({
                target: conversationSettings.conversationId,
                set: input,
            })
            .returning();
        return row;
    }

    async createInvite(
        conversationId: number,
        inviterId: number,
        inviteeId: number,
        expiresAt: Date,
    ): Promise<ConversationInvite> {
        const [row] = await db
            .insert(conversationInvites)
            .values({ conversationId, inviterId, inviteeId, expiresAt })
            .returning();
        if (!row) throw new Error("invite insert returned no row");
        return row;
    }

    async findInviteByUuid(
        inviteUuid: string,
    ): Promise<ConversationInvite | null> {
        const [row] = await db
            .select()
            .from(conversationInvites)
            .where(eq(conversationInvites.uuid, inviteUuid))
            .limit(1);
        return row ?? null;
    }

    async listPendingForConversation(conversationId: number) {
        return db
            .select({
                uuid: conversationInvites.uuid,
                inviteeUuid: users.uuid,
                expiresAt: conversationInvites.expiresAt,
                createdAt: conversationInvites.createdAt,
            })
            .from(conversationInvites)
            .innerJoin(users, eq(users.id, conversationInvites.inviteeId))
            .where(
                and(
                    eq(conversationInvites.conversationId, conversationId),
                    isNull(conversationInvites.acceptedAt),
                    isNull(conversationInvites.revokedAt),
                ),
            );
    }

    async listPendingForUser(userId: number) {
        const inviter = alias(users, "inviter");

        return db
            .select({
                uuid: conversationInvites.uuid,
                conversationUuid: conversations.uuid,
                conversationName: conversations.name,
                conversationType: conversations.type,
                inviterUuid: inviter.uuid,
                expiresAt: conversationInvites.expiresAt,
                createdAt: conversationInvites.createdAt,
            })
            .from(conversationInvites)
            .innerJoin(
                conversations,
                eq(conversations.id, conversationInvites.conversationId),
            )
            .innerJoin(inviter, eq(inviter.id, conversationInvites.inviterId))
            .where(
                and(
                    eq(conversationInvites.inviteeId, userId),
                    isNull(conversationInvites.acceptedAt),
                    isNull(conversationInvites.revokedAt),
                ),
            );
    }

    async markInviteRevoked(inviteId: number): Promise<void> {
        await db
            .update(conversationInvites)
            .set({ revokedAt: new Date() })
            .where(eq(conversationInvites.id, inviteId));
    }

    async acceptInviteAndJoin(
        invite: ConversationInvite,
        memberRoleId: number,
    ): Promise<void> {
        await db.transaction(async (tx: Tx) => {
            await tx
                .update(conversationInvites)
                .set({ acceptedAt: new Date() })
                .where(eq(conversationInvites.id, invite.id));

            const [member] = await tx
                .insert(conversationMembers)
                .values({
                    conversationId: invite.conversationId,
                    userId: invite.inviteeId,
                })
                .returning({ id: conversationMembers.id });
            if (!member) throw new Error("member insert returned no row");

            await tx
                .insert(conversationUserRoles)
                .values({
                    conversationMemberId: member.id,
                    conversationRoleId: memberRoleId,
                });
        });
    }
}
