import { Router } from "express";
import userRoute from "../modules/user/user.route";
import authRoute from "../modules/auth/auth.route";
import inventoryRoute from "../modules/inventory/inventory.route";

const router = Router();

router.use("/user", userRoute);
router.use("/auth", authRoute);
router.use("/inventory", inventoryRoute);

export default router;