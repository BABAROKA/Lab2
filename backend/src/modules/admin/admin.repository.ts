import {
    and,
    desc,
    eq,
    gte,
    ilike,
    inArray,
    lt,
    lte,
    or,
} from "drizzle-orm";
import { db } from "../../db/client.js";
import { users } from "../../db/schema/users.js";
import { roles, RoleName } from "../../db/schema/roles.js";
import { permissions } from "../../db/schema/permissions.js";
import { userRoles } from "../../db/schema/user_roles.js";
import {
    auditLogs,
    auditActionEnum,
    auditEntityEnum,
} from "../../db/schema/audit_logs.js";
import { settings } from "../../db/schema/settings.js";

type AuditAction = (typeof auditActionEnum.enumValues)[number];
type AuditEntity = (typeof auditEntityEnum.enumValues)[number];

export class AdminRepository {
    async listRoles() {
        return db.select().from(roles);
    }

    async listPermissions() {
        return db.select().from(permissions);
    }

    async searchUsers(opts: {
        limit: number;
        before?: Date | undefined;
        search?: string | undefined;
        isActive?: boolean | undefined;
    }) {
        const conditions = [];
        if (opts.before !== undefined)
            conditions.push(lt(users.createdAt, opts.before));
        if (opts.isActive !== undefined)
            conditions.push(eq(users.isActive, opts.isActive));
        if (opts.search) {
            const clause = or(
                ilike(users.firstName, `%${opts.search}%`),
                ilike(users.lastName, `%${opts.search}%`),
                ilike(users.email, `%${opts.search}%`),
            );
            if (clause) conditions.push(clause);
        }

        return db
            .select({
                uuid: users.uuid,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                isActive: users.isActive,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(and(...conditions))
            .orderBy(desc(users.createdAt))
            .limit(opts.limit);
    }

    async setUserRoles(userId: number, roleNames: RoleName[]): Promise<void> {
        await db.transaction(async (tx) => {
            const roleRows = roleNames.length
                ? await tx
                    .select()
                    .from(roles)
                    .where(inArray(roles.name, roleNames))
                : [];

            await tx.delete(userRoles).where(eq(userRoles.userId, userId));
            if (roleRows.length > 0) {
                await tx
                    .insert(userRoles)
                    .values(roleRows.map((r) => ({ userId, roleId: r.id })));
            }
        });
    }

    async getUserRoles(userId: number): Promise<RoleName[]> {
        const rows = await db
            .select({ name: roles.name })
            .from(userRoles)
            .innerJoin(roles, eq(roles.id, userRoles.roleId))
            .where(eq(userRoles.userId, userId));
        return rows.map((r) => r.name);
    }

    async setUserActive(userId: number, isActive: boolean): Promise<boolean> {
        const rows = await db
            .update(users)
            .set({ isActive })
            .where(eq(users.id, userId))
            .returning({ id: users.id });
        return rows.length > 0;
    }

    async searchAuditLogs(opts: {
        limit: number;
        before?: number | undefined;
        action?: AuditAction | undefined;
        entity?: AuditEntity | undefined;
        userUuid?: string | undefined;
        from?: Date | undefined;
        to?: Date | undefined;
    }) {
        const conditions = [];
        if (opts.before !== undefined)
            conditions.push(lt(auditLogs.id, opts.before));
        if (opts.action) conditions.push(eq(auditLogs.action, opts.action));
        if (opts.entity) conditions.push(eq(auditLogs.entity, opts.entity));
        if (opts.userUuid) conditions.push(eq(users.uuid, opts.userUuid));
        if (opts.from) conditions.push(gte(auditLogs.createdAt, opts.from));
        if (opts.to) conditions.push(lte(auditLogs.createdAt, opts.to));

        return db
            .select({
                id: auditLogs.id,
                userUuid: users.uuid,
                action: auditLogs.action,
                entity: auditLogs.entity,
                entityId: auditLogs.entityId,
                oldValue: auditLogs.oldValue,
                newValue: auditLogs.newValue,
                ipAddress: auditLogs.ipAddress,
                createdAt: auditLogs.createdAt,
            })
            .from(auditLogs)
            .leftJoin(users, eq(users.id, auditLogs.userId))
            .where(and(...conditions))
            .orderBy(desc(auditLogs.id))
            .limit(opts.limit);
    }

    async listSettings() {
        return db.select().from(settings);
    }

    async upsertSetting(key: string, value: string, description?: string) {
        const [row] = await db
            .insert(settings)
            .values({ key, value, description })
            .onConflictDoUpdate({
                target: settings.key,
                set: { value, description },
            })
            .returning();
        return row;
    }
}
