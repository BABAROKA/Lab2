import { DeviceNotFoundError } from "../../errors.js";
import { DevicePlatform } from "../../db/schema/devices.js";
import { BlockedUsersRepository } from "../blocked-users/blocked-users.repository.js";
import { UserRepository } from "../users/users.repository.js";
import { Device, DevicesRepository } from "./devices.repository.js";
import { RegisterDeviceInput, TopUpPrekeysInput } from "./devices.schemas.js";

export type PublicDevice = Pick<
    Device,
    "uuid" | "name" | "platform" | "identityPublicKey" | "createdAt"
>;
export type OwnDevice = Pick<
    Device,
    "uuid" | "name" | "platform" | "isActive" | "lastSeenAt" | "createdAt"
>;

export interface PrekeyBundle {
    deviceUuid: string;
    identityPublicKey: string;
    signedPrekey: { keyId: number; publicKey: string; signature: string };
    oneTimePrekey: { keyId: number; publicKey: string } | null;
}

export class DevicesService {
    constructor(
        private readonly devicesRepository: DevicesRepository,
        private readonly userRepository: UserRepository,
        private readonly blockedUsersRepository: BlockedUsersRepository,
    ) { }

    async registerDevice(
        userId: number,
        input: RegisterDeviceInput,
    ): Promise<OwnDevice> {
        const device = await this.devicesRepository.createWithKeys(
            userId,
            input,
        );
        return toOwnDevice(device);
    }

    async listOwnDevices(userId: number): Promise<OwnDevice[]> {
        const devices = await this.devicesRepository.listActiveForUser(userId);
        return devices.map(toOwnDevice);
    }

    async searchOwn(
        userId: number,
        opts: {
            search?: string | undefined;
            platform?: DevicePlatform | undefined;
            isActive?: boolean | undefined;
            limit: number;
        },
    ): Promise<OwnDevice[]> {
        const devices = await this.devicesRepository.searchOwn(userId, opts);
        return devices.map(toOwnDevice);
    }

    /** @throws */
    async revokeDevice(userId: number, deviceUuid: string): Promise<void> {
        const device = await this.devicesRepository.revoke(userId, deviceUuid);
        if (!device) throw new DeviceNotFoundError();
    }

    /** @throws */
    async topUpPrekeys(
        userId: number,
        deviceUuid: string,
        input: TopUpPrekeysInput,
    ): Promise<void> {
        const device = await this.devicesRepository.findActiveByUuidForUser(
            userId,
            deviceUuid,
        );
        if (!device) throw new DeviceNotFoundError();

        await this.devicesRepository.addOneTimePrekeys(
            device.id,
            input.oneTimePrekeys,
        );
    }

    /** @throws */
    async listDevicesForUser(
        requestingUserId: number,
        targetUserUuid: string,
    ): Promise<PublicDevice[]> {
        const target = await this.userRepository.findByUuid(targetUserUuid);
        if (!target) return [];

        if (
            await this.blockedUsersRepository.isBlockedEitherWay(
                requestingUserId,
                target.id,
            )
        )
            return [];

        const devices = await this.devicesRepository.listActiveForUser(
            target.id,
        );
        return devices.map(toPublicDevice);
    }

    /** @throws */
    async getPrekeyBundle(
        requestingUserId: number,
        deviceUuid: string,
    ): Promise<PrekeyBundle> {
        const device = await this.devicesRepository.findByUuid(deviceUuid);
        if (!device || !device.isActive) throw new DeviceNotFoundError();

        if (
            await this.blockedUsersRepository.isBlockedEitherWay(
                requestingUserId,
                device.userId,
            )
        ) {
            throw new DeviceNotFoundError();
        }

        const signedPrekey =
            await this.devicesRepository.findActiveSignedPrekey(device.id);
        if (!signedPrekey) throw new DeviceNotFoundError();

        const oneTimePrekey = await this.devicesRepository.claimOneTimePrekey(
            device.id,
        );

        return {
            deviceUuid: device.uuid,
            identityPublicKey: device.identityPublicKey,
            signedPrekey: {
                keyId: signedPrekey.keyId,
                publicKey: signedPrekey.publicKey,
                signature: signedPrekey.signature,
            },
            oneTimePrekey,
        };
    }
}

const toOwnDevice = (d: Device): OwnDevice => ({
    uuid: d.uuid,
    name: d.name,
    platform: d.platform,
    isActive: d.isActive,
    lastSeenAt: d.lastSeenAt,
    createdAt: d.createdAt,
});

const toPublicDevice = (d: Device): PublicDevice => ({
    uuid: d.uuid,
    name: d.name,
    platform: d.platform,
    identityPublicKey: d.identityPublicKey,
    createdAt: d.createdAt,
});
