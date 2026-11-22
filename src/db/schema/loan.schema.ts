import {
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { units } from "./inventory.schema";
import { users } from "./user.schema";

export const loanStatus = pgEnum("loanStatus", [
  "pending",
  "borrowed",
  "rejected",
  "returned",
]);

export const loans = pgTable(
  "loans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    unitId: uuid("unitId")
      .notNull()
      .references(() => units.id),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id),
    purpose: varchar("purpose", { length: 255 }).notNull(),
    borrowedDate: timestamp("borrowedDate").notNull(),
    returnDate: timestamp("returnDate").notNull(),
    actualReturnDate: timestamp("actualReturnDate"),
    status: loanStatus("status").default("pending").notNull(),
    processedBy: uuid("processedBy").references(() => users.id),
    checkedBy: uuid("checkedBy").references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_loans_unitId").on(table.unitId),
    index("idx_loans_userId").on(table.userId),
    index("idx_loans_createdAt").on(table.createdAt),
  ],
);

export const returnImages = pgTable(
  "returnImages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    loanId: uuid("loanId")
      .notNull()
      .references(() => loans.id, { onDelete: "cascade" }),
    imgUrl: varchar("imgUrl", { length: 255 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("idx_returnImages_loanId").on(table.loanId)],
);

export const loanCounters = pgTable("loanCounters", {
  year: integer("year").primaryKey(),
  lastNumber: integer("lastNumber").notNull().default(0),
});
