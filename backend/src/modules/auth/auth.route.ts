import { Router } from "express";
import { validate } from "../../middlewares/validation.middleware";
import { postLoginSchema } from "./auth.dto";
import { getCurrentUser, login } from "./auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
router.post("/login", validate(postLoginSchema), login);
router.get("/me", authenticate, getCurrentUser);

export default router;