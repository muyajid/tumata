import { Router } from "express";
import { userCreate } from "./user.controller.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { postUserSchema } from "./user.dto.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);
router.post("/", validate(postUserSchema), userCreate);

export default router;