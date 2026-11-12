import { Router } from "express";
import userRoute from "../modules/user/user.route";
import authRoute from "../modules/auth/auth.route";

const router = Router();

router.use("/user", userRoute);
router.use("/auth", authRoute);

export default router;