import { LoanStatus } from "../modules/loan/loan.dto";

export const resolveLoanStatus = (current: LoanStatus, returnDate: Date): LoanStatus => {
    const now = new Date();

    if (current === "borrowed" && now > returnDate) {
        return "overdue"
    }
    return current;
}