import { Router } from "express";
import { userCreate } from "./user.controller.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { postUserSchema } from "./user.dto.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);
router.post("/", authorize("Super Admin"), validate(postUserSchema), userCreate);

export default router;