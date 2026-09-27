import { Router } from "express";
import { access } from "../../middleware/auth.middleware.js";
import {
    getPrekeyBundle,
    listDevicesForUser,
    listOwnDevices,
    registerDevice,
    revokeDevice,
    topUpPrekeys,
} from "./devices.controller.js";

const router = Router();

router.use(access);

router.post("/", registerDevice);
router.get("/", listOwnDevices);
router.delete("/:deviceUuid", revokeDevice);
router.post("/:deviceUuid/prekeys", topUpPrekeys);
router.get("/:deviceUuid/bundle", getPrekeyBundle);
router.get("/users/:userUuid", listDevicesForUser);

export { router as devicesRouter };
