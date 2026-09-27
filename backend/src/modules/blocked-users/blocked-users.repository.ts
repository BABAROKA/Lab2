import { and, eq, or } from "drizzle-orm";
import { db } from "../../db/client.js";
import { blockedUsers } from "../../db/schema/blocked_users.js";
import { users } from "../../db/schema/users.js";

export class BlockedUsersRepository {
    async block(blockerId: number, blockedId: number): Promise<void> {
        await db
            .insert(blockedUsers)
            .values({ blockerId, blockedId })
            .onConflictDoNothing();
    }

    async unblock(blockerId: number, blockedId: number): Promise<boolean> {
        const rows = await db
            .delete(blockedUsers)
            .where(
                and(
                    eq(blockedUsers.blockerId, blockerId),
                    eq(blockedUsers.blockedId, blockedId),
                ),
            )
            .returning({ id: blockedUsers.id });
        return rows.length > 0;
    }

    async isBlocked(blockerId: number, blockedId: number): Promise<boolean> {
        const [row] = await db
            .select({ id: blockedUsers.id })
            .from(blockedUsers)
            .where(
                and(
                    eq(blockedUsers.blockerId, blockerId),
                    eq(blockedUsers.blockedId, blockedId),
                ),
            )
            .limit(1);
        return row !== undefined;
    }

    async isBlockedEitherWay(
        userIdA: number,
        userIdB: number,
    ): Promise<boolean> {
        const [row] = await db
            .select({ id: blockedUsers.id })
            .from(blockedUsers)
            .where(
                or(
                    and(
                        eq(blockedUsers.blockerId, userIdA),
                        eq(blockedUsers.blockedId, userIdB),
                    ),
                    and(
                        eq(blockedUsers.blockerId, userIdB),
                        eq(blockedUsers.blockedId, userIdA),
                    ),
                ),
            )
            .limit(1);
        return row !== undefined;
    }

    async listBlockedByUser(blockerId: number) {
        return db
            .select({
                uuid: users.uuid,
                firstName: users.firstName,
                lastName: users.lastName,
            })
            .from(blockedUsers)
            .innerJoin(users, eq(users.id, blockedUsers.blockedId))
            .where(eq(blockedUsers.blockerId, blockerId));
    }
}
