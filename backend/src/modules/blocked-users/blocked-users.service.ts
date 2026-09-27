import {
    AlreadyBlockedError,
    CannotBlockSelfError,
    NotBlockedError,
    UserNotFoundError,
} from "../../errors.js";
import { UserRepository } from "../users/users.repository.js";
import { BlockedUsersRepository } from "./blocked-users.repository.js";
import { importBlockRowSchema } from "./blocked-users.schemas.js";

export class BlockedUsersService {
    constructor(
        private readonly blockedUsersRepository: BlockedUsersRepository,
        private readonly userRepository: UserRepository,
    ) { }

    /** @throws */
    async block(blockerId: number, targetUuid: string): Promise<void> {
        const target = await this.userRepository.findByUuid(targetUuid);
        if (!target) throw new UserNotFoundError();
        if (target.id === blockerId) throw new CannotBlockSelfError();

        if (await this.blockedUsersRepository.isBlocked(blockerId, target.id))
            throw new AlreadyBlockedError();

        await this.blockedUsersRepository.block(blockerId, target.id);
    }

    /** @throws */
    async unblock(blockerId: number, targetUuid: string): Promise<void> {
        const target = await this.userRepository.findByUuid(targetUuid);
        if (!target) throw new UserNotFoundError();

        const ok = await this.blockedUsersRepository.unblock(
            blockerId,
            target.id,
        );
        if (!ok) throw new NotBlockedError();
    }

    async list(blockerId: number) {
        return this.blockedUsersRepository.listBlockedByUser(blockerId);
    }

    async importBlocks(blockerId: number, rawRows: Record<string, unknown>[]) {
        const results = {
            imported: 0,
            failed: [] as { row: number; error: string }[],
        };

        for (let i = 0; i < rawRows.length; i++) {
            const parsed = importBlockRowSchema.safeParse(rawRows[i]);
            if (!parsed.success) {
                results.failed.push({ row: i, error: "invalid row" });
                continue;
            }

            const target = await this.userRepository.findByEmail(
                parsed.data.email,
            );
            if (!target) {
                results.failed.push({ row: i, error: "user not found" });
                continue;
            }
            if (target.id === blockerId) {
                results.failed.push({ row: i, error: "cannot block self" });
                continue;
            }

            await this.blockedUsersRepository.block(blockerId, target.id);
            results.imported++;
        }

        return results;
    }
}
