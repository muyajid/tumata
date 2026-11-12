import { Router } from "express";
import { validate } from "../../middlewares/validation.middleware";
import { postLoginSchema } from "./auth.dto";
import { login } from "./auth.controller";

const router = Router();
router.post("/login", validate(postLoginSchema), login);

export default router;