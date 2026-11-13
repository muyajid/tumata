import { Router } from "express";
import {
  userCreate,
  userExport,
  userGet,
  userImport,
  userPatch,
  userPutRole,
} from "./user.controller";
import { validate } from "../../middlewares/validation.middleware";
import { patchUserSchema, postUserSchema, updateRoleSchema } from "./user.dto";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { importXLSX } from "../../middlewares/import.middleware";

const router = Router();

router.use(authenticate);
router.post(
  "/",
  authorize("Super Admin"),
  validate(postUserSchema),
  userCreate,
);
router.get("/", authorize("Super Admin"), userGet);
router.post(
  "/import",
  authorize("Super Admin"),
  importXLSX.single("xlsx_file"),
  userImport,
);
router.get("/export", authorize("Super Admin"), userExport);
router.patch(
  "/:id",
  authorize("Super Admin"),
  validate(patchUserSchema),
  userPatch,
);
router.put(
  "/role/:id",
  authorize("Super Admin"),
  validate(updateRoleSchema),
  userPutRole,
);

export default router;
