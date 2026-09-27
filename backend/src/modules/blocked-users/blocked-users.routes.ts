import { Router } from "express";
import express from "express";
import { access } from "../../middleware/auth.middleware.js";
import {
    blockUser,
    importBlockedUsers,
    listBlockedUsers,
    unblockUser,
} from "./blocked-users.controller.js";

const router = Router();
router.use(access);

router.post("/", blockUser);
router.get("/", listBlockedUsers);
router.delete("/:userUuid", unblockUser);

router.post(
    "/import",
    express.raw({
        type: [
            "text/csv",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/octet-stream",
        ],
        limit: "5mb",
    }),
    importBlockedUsers,
);

export { router as blockedUsersRouter };
