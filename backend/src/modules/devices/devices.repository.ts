import { and, count, desc, eq, ilike, inArray, isNull } from "drizzle-orm";
import { db } from "../../db/client.js";
import { Tx } from "../../db/types.js";
import { devices, DevicePlatform } from "../../db/schema/devices.js";
import { devicePrekeys } from "../../db/schema/device_prekeys.js";
import { deviceSignedPrekeys } from "../../db/schema/device_signed_prekeys.js";
import { RegisterDeviceInput } from "./devices.schemas.js";

export type Device = typeof devices.$inferSelect;

export class DevicesRepository {
    async createWithKeys(
        userId: number,
        input: RegisterDeviceInput,
    ): Promise<Device> {
        return db.transaction(async (tx: Tx) => {
            const [device] = await tx
                .insert(devices)
                .values({
                    userId,
                    name: input.name,
                    platform: input.platform,
                    identityPublicKey: input.identityPublicKey,
                })
                .returning();
            if (!device) throw new Error("device insert returned no row");

            await tx.insert(deviceSignedPrekeys).values({
                deviceId: device.id,
                keyId: input.signedPrekey.keyId,
                publicKey: input.signedPrekey.publicKey,
                signature: input.signedPrekey.signature,
            });

            await tx
                .insert(devicePrekeys)
                .values(
                    input.oneTimePrekeys.map((k) => ({
                        deviceId: device.id,
                        keyId: k.keyId,
                        publicKey: k.publicKey,
                    })),
                );

            return device;
        });
    }

    async listActiveForUser(userId: number): Promise<Device[]> {
        return db
            .select()
            .from(devices)
            .where(and(eq(devices.userId, userId), eq(devices.isActive, true)));
    }

    async searchOwn(
        userId: number,
        opts: {
            search?: string | undefined;
            platform?: DevicePlatform | undefined;
            isActive?: boolean | undefined;
            limit: number;
        },
    ): Promise<Device[]> {
        const conditions = [eq(devices.userId, userId)];
        if (opts.isActive !== undefined)
            conditions.push(eq(devices.isActive, opts.isActive));
        if (opts.platform) conditions.push(eq(devices.platform, opts.platform));
        if (opts.search)
            conditions.push(ilike(devices.name, `%${opts.search}%`));

        return db
            .select()
            .from(devices)
            .where(and(...conditions))
            .orderBy(desc(devices.id))
            .limit(opts.limit);
    }

    async findByUuid(deviceUuid: string): Promise<Device | null> {
        const [row] = await db
            .select()
            .from(devices)
            .where(eq(devices.uuid, deviceUuid))
            .limit(1);
        return row ?? null;
    }

    async findActiveByUuidForUser(
        userId: number,
        deviceUuid: string,
    ): Promise<Device | null> {
        const [row] = await db
            .select()
            .from(devices)
            .where(
                and(
                    eq(devices.uuid, deviceUuid),
                    eq(devices.userId, userId),
                    eq(devices.isActive, true),
                ),
            )
            .limit(1);
        return row ?? null;
    }

    async findActiveByUuids(deviceUuids: string[]): Promise<Device[]> {
        if (deviceUuids.length === 0) return [];
        return db
            .select()
            .from(devices)
            .where(
                and(
                    inArray(devices.uuid, deviceUuids),
                    eq(devices.isActive, true),
                ),
            );
    }

    async revoke(userId: number, deviceUuid: string): Promise<Device | null> {
        const [row] = await db
            .update(devices)
            .set({ isActive: false, revokedAt: new Date() })
            .where(
                and(eq(devices.uuid, deviceUuid), eq(devices.userId, userId)),
            )
            .returning();
        return row ?? null;
    }

    async touchLastSeen(deviceId: number): Promise<void> {
        await db
            .update(devices)
            .set({ lastSeenAt: new Date() })
            .where(eq(devices.id, deviceId));
    }

    async addOneTimePrekeys(
        deviceId: number,
        keys: { keyId: number; publicKey: string }[],
    ): Promise<void> {
        await db
            .insert(devicePrekeys)
            .values(
                keys.map((k) => ({
                    deviceId,
                    keyId: k.keyId,
                    publicKey: k.publicKey,
                })),
            );
    }

    async countUnusedPrekeys(deviceId: number): Promise<number> {
        const [row] = await db
            .select({ n: count() })
            .from(devicePrekeys)
            .where(
                and(
                    eq(devicePrekeys.deviceId, deviceId),
                    isNull(devicePrekeys.usedAt),
                ),
            );
        return row?.n ?? 0;
    }

    async claimOneTimePrekey(
        deviceId: number,
    ): Promise<{ keyId: number; publicKey: string } | null> {
        return db.transaction(async (tx: Tx) => {
            const [prekey] = await tx
                .select({
                    id: devicePrekeys.id,
                    keyId: devicePrekeys.keyId,
                    publicKey: devicePrekeys.publicKey,
                })
                .from(devicePrekeys)
                .where(
                    and(
                        eq(devicePrekeys.deviceId, deviceId),
                        isNull(devicePrekeys.usedAt),
                    ),
                )
                .orderBy(devicePrekeys.id)
                .limit(1)
                .for("update", { skipLocked: true });

            if (!prekey) return null;

            await tx
                .update(devicePrekeys)
                .set({ usedAt: new Date() })
                .where(eq(devicePrekeys.id, prekey.id));

            return { keyId: prekey.keyId, publicKey: prekey.publicKey };
        });
    }

    async findActiveSignedPrekey(deviceId: number) {
        const [row] = await db
            .select()
            .from(deviceSignedPrekeys)
            .where(
                and(
                    eq(deviceSignedPrekeys.deviceId, deviceId),
                    eq(deviceSignedPrekeys.isActive, true),
                ),
            )
            .orderBy(deviceSignedPrekeys.id)
            .limit(1);
        return row ?? null;
    }
}
