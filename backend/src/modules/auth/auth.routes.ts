import { Router } from "express";

import { login, register } from "./auth.controller.js";
import { access } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(access);

router.post("/register", register);
router.post("/login", login);
router.post("/rotate");

export { router as authRouter };
