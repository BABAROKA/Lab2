import { Router } from "express";
import { access } from "../../middleware/auth.middleware.js";
import {
    changePassword,
    deactivateAccount,
    login,
    logout,
    refresh,
    register,
} from "./auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

router.post("/password", access, changePassword);
router.post("/deactivate", access, deactivateAccount);

export { router as authRouter };
