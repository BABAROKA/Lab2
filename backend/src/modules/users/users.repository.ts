import { eq, inArray } from "drizzle-orm";
import { db } from "../../db/client.js";
import { users } from "../../db/schema/users.js";
import { roles } from "../../db/schema/roles.js";
import { userRoles } from "../../db/schema/user_roles.js";
import { userProfilePictures } from "../../db/schema/user_profile_pictures.js";
import { profilePictureDeviceKeys } from "../../db/schema/profile_picture_device_keys.js";
import { files } from "../../db/schema/files.js";
import { NewUser, UpdateUser, User } from "./users.schema.js";

export class UserRepository {
    async findByEmail(email: string): Promise<User | null> {
        const result = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1)
            .execute();
        return result[0] ?? null;
    }

    async findById(id: number): Promise<User | null> {
        const result = await db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1)
            .execute();
        return result[0] ?? null;
    }

    async findByUuid(uuid: string): Promise<User | null> {
        const result = await db
            .select()
            .from(users)
            .where(eq(users.uuid, uuid))
            .limit(1)
            .execute();
        return result[0] ?? null;
    }

    async findManyByUuids(uuids: string[]): Promise<User[]> {
        if (uuids.length === 0) return [];
        return db.select().from(users).where(inArray(users.uuid, uuids));
    }

    async create(user: NewUser): Promise<User | null> {
        const result = await db
            .insert(users)
            .values(user)
            .returning()
            .execute();
        return result[0] ?? null;
    }

    async createWithDefaultRole(user: NewUser): Promise<User> {
        return db.transaction(async (tx) => {
            const [created] = await tx.insert(users).values(user).returning();
            if (!created) throw new Error("user insert returned no row");

            const [role] = await tx
                .select({ id: roles.id })
                .from(roles)
                .where(eq(roles.name, "user"))
                .limit(1);
            if (!role)
                throw new Error("role 'user' missing: run `npm run db:seed`");

            await tx
                .insert(userRoles)
                .values({ userId: created.id, roleId: role.id });

            return created;
        });
    }

    async updateById(id: number, user: UpdateUser): Promise<User | null> {
        const result = await db
            .update(users)
            .set(user)
            .where(eq(users.id, id))
            .returning()
            .execute();
        return result[0] ?? null;
    }

    async updateByUuid(uuid: string, user: UpdateUser): Promise<User | null> {
        const result = await db
            .update(users)
            .set(user)
            .where(eq(users.uuid, uuid))
            .returning()
            .execute();
        return result[0] ?? null;
    }

    async updatePasswordByUuid(
        uuid: string,
        passwordHash: string,
    ): Promise<User | null> {
        const result = await db
            .update(users)
            .set({ passwordHash })
            .where(eq(users.uuid, uuid))
            .returning()
            .execute();
        return result[0] ?? null;
    }

    async deactivateByUuid(uuid: string): Promise<User | null> {
        const result = await db
            .update(users)
            .set({ isActive: false })
            .where(eq(users.uuid, uuid))
            .returning()
            .execute();
        return result[0] ?? null;
    }

    async findProfilePictureFileId(userId: number): Promise<number | null> {
        const [row] = await db
            .select({ fileId: userProfilePictures.fileId })
            .from(userProfilePictures)
            .where(eq(userProfilePictures.userId, userId))
            .limit(1);
        return row?.fileId ?? null;
    }

    async setProfilePicture(
        userId: number,
        fileId: number,
        deviceKeys: { deviceId: number; encryptedKey: string }[],
    ): Promise<void> {
        await db.transaction(async (tx) => {
            const existing = await tx
                .select({
                    id: userProfilePictures.id,
                    fileId: userProfilePictures.fileId,
                })
                .from(userProfilePictures)
                .where(eq(userProfilePictures.userId, userId))
                .limit(1);

            if (existing[0]) {
                await tx
                    .delete(userProfilePictures)
                    .where(eq(userProfilePictures.id, existing[0].id));
                await tx.delete(files).where(eq(files.id, existing[0].fileId));
            }

            const [row] = await tx
                .insert(userProfilePictures)
                .values({ userId, fileId })
                .returning({ id: userProfilePictures.id });
            if (!row) throw new Error("profile picture insert returned no row");

            await tx
                .insert(profilePictureDeviceKeys)
                .values(
                    deviceKeys.map((k) => ({
                        profilePictureId: row.id,
                        deviceId: k.deviceId,
                        encryptedProfilePictureKey: k.encryptedKey,
                    })),
                );
        });
    }

    async deleteProfilePicture(userId: number): Promise<void> {
        const existing = await db
            .select({
                id: userProfilePictures.id,
                fileId: userProfilePictures.fileId,
            })
            .from(userProfilePictures)
            .where(eq(userProfilePictures.userId, userId))
            .limit(1);
        if (!existing[0]) return;

        await db
            .delete(userProfilePictures)
            .where(eq(userProfilePictures.id, existing[0].id));
        await db.delete(files).where(eq(files.id, existing[0].fileId));
    }

    async findFileUuidForProfilePicture(
        userUuid: string,
    ): Promise<string | null> {
        const [row] = await db
            .select({ fileUuid: files.uuid })
            .from(userProfilePictures)
            .innerJoin(users, eq(users.id, userProfilePictures.userId))
            .innerJoin(files, eq(files.id, userProfilePictures.fileId))
            .where(eq(users.uuid, userUuid))
            .limit(1);
        return row?.fileUuid ?? null;
    }
}
