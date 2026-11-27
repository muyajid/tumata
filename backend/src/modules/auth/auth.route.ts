import { Router } from "express";
import { validate } from "../../middlewares/validation.middleware";
import { postLoginSchema } from "./auth.dto";
import { getCurrentUser, login, logout } from "./auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
router.post("/login", validate(postLoginSchema), login);
router.post("/logout", logout);
router.get("/me", authenticate, getCurrentUser);

export default router;