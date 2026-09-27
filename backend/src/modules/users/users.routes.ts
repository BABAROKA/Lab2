import { Router } from "express";
import { access } from "../../middleware/auth.middleware";
import { me, updateUser } from "./users.controller";

const router = Router();

router.use(access);

router.get("/me", me);
router.patch("/me", updateUser)

export { router as usersRouter };
