import { Router } from "express";
import { access } from "../../middleware/auth.middleware.js";
import { listMyCalls } from "./calls.controller.js";

const router = Router();
router.use(access);
router.get("/", listMyCalls);

export { router as callsRouter };
