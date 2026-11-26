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
  "Menunggu",
  "Disetujui",
  "Ditolak",
  "Dipinjam",
  "Dikembalikan",
  "Dibatalkan",
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

    borrowedDate: timestamp("borrowedDate", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    returnDate: timestamp("returnDate", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    actualReturnDate: timestamp("actualReturnDate", {
      withTimezone: true,
      mode: "date",
    }),

    status: loanStatus("status").default("Menunggu").notNull(),

    reviewedBy: uuid("reviewedBy").references(() => users.id, {
      onDelete: "restrict",
    }),
    reviewedAt: timestamp("reviewedAt", { withTimezone: true, mode: "date" }),

    handedOverBy: uuid("handedOverBy").references(() => users.id, {
      onDelete: "restrict",
    }),
    handedOverAt: timestamp("handedOverAt", {
      withTimezone: true,
      mode: "date",
    }),

    returnCheckedBy: uuid("returnCheckedBy").references(() => users.id, {
      onDelete: "restrict",
    }),
    returnCheckedAt: timestamp("returnCheckedAt", {
      withTimezone: true,
      mode: "date",
    }),

    rejectedReason: varchar("rejectedReason", { length: 255 }),

    createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" })
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
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_returnImages_loanId").on(table.loanId)],
);

export const loanCounters = pgTable("loanCounters", {
  year: integer("year").primaryKey(),
  lastNumber: integer("lastNumber").notNull().default(0),
});