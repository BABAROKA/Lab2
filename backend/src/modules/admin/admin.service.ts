import { SettingNotFoundError, UserNotFoundError } from "../../errors.js";
import { hashPassword } from "../auth/auth.utils.js";
import { isUniqueViolation } from "../../db/errors.js";
import { recordAudit } from "../../lib/audit.js";
import { RoleName } from "../../db/schema/roles.js";
import { UserRepository } from "../users/users.repository.js";
import { AdminRepository } from "./admin.repository.js";
import { importUserRowSchema } from "./admin.schemas.js";

export class AdminService {
    constructor(
        private readonly adminRepository: AdminRepository,
        private readonly userRepository: UserRepository,
    ) { }

    listRoles() {
        return this.adminRepository.listRoles();
    }

    listPermissions() {
        return this.adminRepository.listPermissions();
    }

    searchUsers(opts: Parameters<AdminRepository["searchUsers"]>[0]) {
        return this.adminRepository.searchUsers(opts);
    }

    /** @throws */
    async setUserRoles(
        actorId: number,
        targetUuid: string,
        roleNames: RoleName[],
    ): Promise<void> {
        const target = await this.userRepository.findByUuid(targetUuid);
        if (!target) throw new UserNotFoundError();

        const before = await this.adminRepository.getUserRoles(target.id);
        await this.adminRepository.setUserRoles(target.id, roleNames);

        await recordAudit({
            userId: actorId,
            action: "role_assign",
            entity: "user",
            entityId: target.id,
            oldValue: { roles: before },
            newValue: { roles: roleNames },
        });
    }

    /** @throws */
    async setUserActive(
        actorId: number,
        targetUuid: string,
        isActive: boolean,
    ): Promise<void> {
        const target = await this.userRepository.findByUuid(targetUuid);
        if (!target) throw new UserNotFoundError();

        const ok = await this.adminRepository.setUserActive(
            target.id,
            isActive,
        );
        if (!ok) throw new UserNotFoundError();

        await recordAudit({
            userId: actorId,
            action: isActive ? "account_activate" : "account_deactivate",
            entity: "user",
            entityId: target.id,
            newValue: { isActive },
        });
    }

    searchAuditLogs(opts: Parameters<AdminRepository["searchAuditLogs"]>[0]) {
        return this.adminRepository.searchAuditLogs(opts);
    }

    listSettings() {
        return this.adminRepository.listSettings();
    }

    /** @throws */
    async updateSetting(key: string, value: string, description?: string) {
        const row = await this.adminRepository.upsertSetting(
            key,
            value,
            description,
        );
        if (!row) throw new SettingNotFoundError();
        return row;
    }

    async importUsers(actorId: number, rawRows: Record<string, unknown>[]) {
        const results = {
            imported: 0,
            failed: [] as { row: number; error: string }[],
        };

        for (let i = 0; i < rawRows.length; i++) {
            const parsed = importUserRowSchema.safeParse(rawRows[i]);
            if (!parsed.success) {
                results.failed.push({
                    row: i,
                    error: parsed.error.issues
                        .map((iss) => iss.message)
                        .join("; "),
                });
                continue;
            }

            try {
                const passwordHash = await hashPassword(parsed.data.password);
                await this.userRepository.createWithDefaultRole({
                    firstName: parsed.data.firstName,
                    lastName: parsed.data.lastName,
                    email: parsed.data.email,
                    passwordHash,
                });
                results.imported++;
            } catch (err) {
                results.failed.push({
                    row: i,
                    error: isUniqueViolation(err)
                        ? "email already in use"
                        : "insert failed",
                });
            }
        }

        await recordAudit({
            userId: actorId,
            action: "create",
            entity: "user",
            newValue: { imported: results.imported },
        });
        return results;
    }
}
