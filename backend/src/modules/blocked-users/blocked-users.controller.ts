import { Request, Response } from "express";
import { z } from "zod";
import { parseImportBuffer } from "../../lib/import-parse.js";
import { sendList } from "../../lib/list-format.js";
import { listFormatSchema, uuidParam } from "../../schemas/common.js";
import { UserRepository } from "../users/users.repository.js";
import { BlockedUsersRepository } from "./blocked-users.repository.js";
import { BlockedUsersService } from "./blocked-users.service.js";

const blockedUsersService = new BlockedUsersService(
    new BlockedUsersRepository(),
    new UserRepository(),
);
const listQuerySchema = z.object({ format: listFormatSchema });

export const blockUser = async (req: Request, res: Response) => {
    const userUuid = uuidParam.parse(req.body.userUuid);
    await blockedUsersService.block(req.auth.id, userUuid);
    res.status(204).end();
};

export const unblockUser = async (req: Request, res: Response) => {
    const userUuid = uuidParam.parse(req.params.userUuid);
    await blockedUsersService.unblock(req.auth.id, userUuid);
    res.status(204).end();
};

export const listBlockedUsers = async (req: Request, res: Response) => {
    const query = listQuerySchema.parse(req.query);
    sendList(
        res,
        "blocked-users",
        await blockedUsersService.list(req.auth.id),
        query.format,
    );
};

export const importBlockedUsers = async (req: Request, res: Response) => {
    const format = listFormatSchema.parse(req.query.format ?? "json");
    const rawRows: Record<string, unknown>[] =
        format === "json"
            ? Array.isArray(req.body)
                ? req.body
                : []
            : parseImportBuffer(req.body as Buffer, format);

    res.status(207).json(
        await blockedUsersService.importBlocks(req.auth.id, rawRows),
    );
};
