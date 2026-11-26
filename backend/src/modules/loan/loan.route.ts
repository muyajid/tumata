import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { postLoanSchema, rejectLoanSchema } from "./loan.dto";
import {
  loanApprove,
  loanCancel,
  loanCreate,
  loanGet,
  loanGetById,
  loanHandOver,
  loanReject,
  loanReturn,
} from "./loan.controller";
import { validate } from "../../middlewares/validation.middleware";
import { importImage } from "../../middlewares/import.middleware";

const route = Router();

route.use(authenticate);

route.post("/", validate(postLoanSchema), loanCreate);
route.get("/", loanGet);
route.get("/:id", loanGetById);
route.patch("/approve/:id", authorize("Super Admin", "Admin"), loanApprove);
route.patch(
  "/reject/:id",
  authorize("Super Admin", "Admin"),
  validate(rejectLoanSchema),
  loanReject,
);
route.patch("/handover/:id", authorize("Super Admin", "Admin"), loanHandOver);
route.patch("/cancel/:id", authorize("User"), loanCancel);
route.patch(
  "/return/:id",
  authorize("Admin", "Super Admin"),
  importImage.array("images"),
  loanReturn,
);

export default route;
