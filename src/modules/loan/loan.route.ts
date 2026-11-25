import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { postLoanSchema, rejectLoanSchema } from "./loan.dto";
import {
  loanApprove,
  loanCreate,
  loanGet,
  loanGetById,
  loanHandOver,
  loanReject,
} from "./loan.controller";
import { validate } from "../../middlewares/validation.middleware";

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

export default route;
