import { Router } from "express";
import { access } from "../../middleware/auth.middleware";
import { me } from "./users.controller";

const router = Router();

router.get("/me", access, me);

export { router as usersRouter };
