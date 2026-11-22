import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { postLoanSchema } from "./loan.dto";
import { loanCreate } from "./loan.controller";
import { validate } from "../../middlewares/validation.middleware";

const route = Router();

route.use(authenticate);

route.post("/", validate(postLoanSchema), loanCreate);

export default route;