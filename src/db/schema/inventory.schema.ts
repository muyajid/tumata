import { relations } from "drizzle-orm";
import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";

export const departments = pgTable("departments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const locations = pgTable(
  "locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    departmentId: uuid("departmentId")
      .notNull()
      .references(() => departments.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [index("idx_location_departmentId").on(table.departmentId)],
);

export const departmentsRelations = relations(departments, ({ many }) => ({
  locations: many(locations),
}));

export const locationsRelations = relations(locations, ({ one }) => ({
  department: one(departments, {
    fields: [locations.departmentId],
    references: [departments.id],
  }),
}));

