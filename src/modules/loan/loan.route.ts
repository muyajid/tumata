import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { postLoanSchema } from "./loan.dto";
import { loanCreate, loanGet } from "./loan.controller";
import { validate } from "../../middlewares/validation.middleware";

const route = Router();

route.use(authenticate);

route.post("/", validate(postLoanSchema), loanCreate);
route.get("/", loanGet);

export default route;