import { Request, Response } from "express";
import { env } from "../../config/env.js";
import {
    FileNotFoundError,
    RecipientDeviceNotEligibleError,
} from "../../errors.js";
import { LocalDiskStorage } from "../../lib/blob-storage.js";
import { uuidParam } from "../../schemas/common.js";
import { DevicesRepository } from "../devices/devices.repository.js";
import { FilesRepository } from "../files/files.repository.js";
import { FilesService } from "../files/files.service.js";
import { setProfilePictureSchema, UpdateUserSchema } from "./users.schema.js";
import { UserRepository } from "./users.repository.js";
import { UserService } from "./users.service.js";

const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const devicesRepository = new DevicesRepository();
const filesRepository = new FilesRepository();
const filesService = new FilesService(
    filesRepository,
    new LocalDiskStorage(env.FILE_STORAGE_ROOT),
);

export const me = async (req: Request, res: Response) => {
    res.json(await userService.getProfile(req.auth.uuid));
};

export const updateUser = async (req: Request, res: Response) => {
    const input = UpdateUserSchema.parse(req.body);
    res.json(await userService.updateUser(req.auth.uuid, input));
};

export const setProfilePicture = async (req: Request, res: Response) => {
    const input = setProfilePictureSchema.parse(req.body);

    const file = await filesRepository.findByUuid(input.fileUuid);
    if (!file || file.uploadedBy !== req.auth.id) throw new FileNotFoundError();

    const devices = await devicesRepository.findActiveByUuids(
        input.deviceKeys.map((k) => k.deviceUuid),
    );
    const deviceByUuid = new Map(devices.map((d) => [d.uuid, d]));

    const resolvedKeys = input.deviceKeys.map((k) => {
        const device = deviceByUuid.get(k.deviceUuid);
        if (!device || device.userId !== req.auth.id)
            throw new RecipientDeviceNotEligibleError();
        return {
            deviceId: device.id,
            encryptedKey: k.encryptedProfilePictureKey,
        };
    });

    await userRepository.setProfilePicture(req.auth.id, file.id, resolvedKeys);
    res.status(204).end();
};

export const deleteProfilePicture = async (req: Request, res: Response) => {
    await userRepository.deleteProfilePicture(req.auth.id);
    res.status(204).end();
};

export const getProfilePicture = async (req: Request, res: Response) => {
    const userUuid = uuidParam.parse(req.params.userUuid);
    const fileUuid =
        await userRepository.findFileUuidForProfilePicture(userUuid);
    if (!fileUuid) throw new FileNotFoundError();

    const blob = await filesService.getBlobOpen(fileUuid);
    if (!blob) throw new FileNotFoundError();

    res.setHeader("Content-Type", "application/octet-stream");
    res.send(blob);
};
