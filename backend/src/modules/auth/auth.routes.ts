import { Router } from "express";

import { changePassword, deactivateAccount, login, logout, register } from "./auth.controller";
import { access } from "../../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.post("/password", access, changePassword);
router.post("/deactivate", access, deactivateAccount);

export { router as authRouter };
