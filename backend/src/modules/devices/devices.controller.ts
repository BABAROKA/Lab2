import { Request, Response } from "express";
import { z } from "zod";
import { devicePlatformEnum } from "../../db/schema/devices.js";
import { sendList } from "../../lib/list-format.js";
import {
    limitSchema,
    listFormatSchema,
    uuidParam,
} from "../../schemas/common.js";
import { BlockedUsersRepository } from "../blocked-users/blocked-users.repository.js";
import { UserRepository } from "../users/users.repository.js";
import { DevicesRepository } from "./devices.repository.js";
import { registerDeviceSchema, topUpPrekeysSchema } from "./devices.schemas.js";
import { DevicesService } from "./devices.service.js";

const devicesService = new DevicesService(
    new DevicesRepository(),
    new UserRepository(),
    new BlockedUsersRepository(),
);

const searchDevicesQuerySchema = z.object({
    search: z.string().trim().min(1).max(100).optional(),
    platform: z.enum(devicePlatformEnum.enumValues).optional(),
    isActive: z.coerce.boolean().optional(),
    limit: limitSchema,
    format: listFormatSchema,
});

export const registerDevice = async (req: Request, res: Response) => {
    const input = registerDeviceSchema.parse(req.body);
    res.status(201).json(
        await devicesService.registerDevice(req.auth.id, input),
    );
};

export const listOwnDevices = async (req: Request, res: Response) => {
    const query = searchDevicesQuerySchema.parse(req.query);
    const rows = await devicesService.searchOwn(req.auth.id, query);
    sendList(res, "devices", rows, query.format);
};

export const revokeDevice = async (req: Request, res: Response) => {
    const deviceUuid = uuidParam.parse(req.params.deviceUuid);
    await devicesService.revokeDevice(req.auth.id, deviceUuid);
    res.status(204).end();
};

export const topUpPrekeys = async (req: Request, res: Response) => {
    const deviceUuid = uuidParam.parse(req.params.deviceUuid);
    const input = topUpPrekeysSchema.parse(req.body);
    await devicesService.topUpPrekeys(req.auth.id, deviceUuid, input);
    res.status(204).end();
};

export const listDevicesForUser = async (req: Request, res: Response) => {
    const userUuid = uuidParam.parse(req.params.userUuid);
    res.json(await devicesService.listDevicesForUser(req.auth.id, userUuid));
};

export const getPrekeyBundle = async (req: Request, res: Response) => {
    const deviceUuid = uuidParam.parse(req.params.deviceUuid);
    res.json(await devicesService.getPrekeyBundle(req.auth.id, deviceUuid));
};
