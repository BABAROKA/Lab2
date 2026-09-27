import { Request, Response } from "express";
import { uuidParam } from "../../schemas/common.js";
import { FileNotFoundError } from "../../errors.js";
import { LocalDiskStorage } from "../../lib/blob-storage.js";
import { env } from "../../config/env.js";
import { FilesRepository } from "./files.repository.js";
import { FilesService } from "./files.service.js";

const filesService = new FilesService(
    new FilesRepository(),
    new LocalDiskStorage(env.FILE_STORAGE_ROOT),
);

export const uploadFile = async (req: Request, res: Response) => {
    const body = req.body as Buffer;
    res.status(201).json(await filesService.upload(req.auth.id, body));
};

export const downloadFile = async (req: Request, res: Response) => {
    const fileUuid = uuidParam.parse(req.params.fileUuid);
    const blob = await filesService.getBlobForConversationMember(
        fileUuid,
        req.auth.id,
    );
    if (!blob) throw new FileNotFoundError();

    res.setHeader("Content-Type", "application/octet-stream");
    res.send(blob);
};
