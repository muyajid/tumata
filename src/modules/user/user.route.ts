import { Router } from "express";
import { userCreate, userGet } from "./user.controller";
import { validate } from "../../middlewares/validation.middleware";
import { postUserSchema } from "./user.dto";
import { authenticate, authorize } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);
router.post(
  "/",
  authorize("Super Admin"),
  validate(postUserSchema),
  userCreate,
);
router.get("/", authorize("Super Admin"), userGet);

export default router;