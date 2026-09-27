import { Router } from "express";
import { access } from "../../middleware/auth.middleware.js";
import {
    deleteProfilePicture,
    getProfilePicture,
    me,
    setProfilePicture,
    updateUser,
} from "./users.controller.js";

const router = Router();

router.use(access);

router.get("/me", me);
router.patch("/me", updateUser);
router.put("/me/profile-picture", setProfilePicture);
router.delete("/me/profile-picture", deleteProfilePicture);
router.get("/:userUuid/profile-picture", getProfilePicture);

export { router as usersRouter };
