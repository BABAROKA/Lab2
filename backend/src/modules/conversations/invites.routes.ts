import { Router } from "express";
import { access } from "../../middleware/auth.middleware.js";
import {
    acceptInvite,
    declineInvite,
    listMyInvites,
} from "./conversations.controller.js";

const router = Router();

router.use(access);

router.get("/", listMyInvites);
router.post("/:inviteUuid/accept", acceptInvite);
router.post("/:inviteUuid/decline", declineInvite);

export { router as invitesRouter };
