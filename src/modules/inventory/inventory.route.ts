import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import {
  patchDepartmentSchema,
  patchLocationSchema,
  postDepartmentSchema,
  postLocationSchema,
} from "./inventory.dto";
import {
  departmentCreate,
  departmentGet,
  locationCreate,
  locationGet,
  patchDepartment,
  patchLocation,
} from "./inventory.controller";

const router = Router();

router.use(authenticate);

router.post(
  "/department",
  authorize("Super Admin"),
  validate(postDepartmentSchema),
  departmentCreate,
);
router.get("/department", departmentGet);
router.post(
  "/location",
  authorize("Super Admin"),
  validate(postLocationSchema),
  locationCreate,
);
router.get("/location", locationGet);
router.patch(
  "/department/:id",
  authorize("Super Admin"),
  validate(patchDepartmentSchema),
  patchDepartment,
);
router.patch(
  "/location/:id",
  authorize("Super Admin"),
  validate(patchLocationSchema),
  patchLocation,
);

export default router;
