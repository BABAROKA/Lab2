import { Router } from "express";
import express from "express";
import { access } from "../../middleware/auth.middleware.js";
import { env } from "../../config/env.js";
import { downloadFile, uploadFile } from "./files.controller.js";

const router = Router();

router.use(access);

router.post(
    "/",
    express.raw({
        type: "application/octet-stream",
        limit: env.MAX_FILE_SIZE_BYTES,
    }),
    uploadFile,
);
router.get("/:fileUuid", downloadFile);

export { router as filesRouter };
