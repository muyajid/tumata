import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
  integer,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";

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

export const items = pgTable(
  "items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 200 }).notNull(),
    departmentId: uuid("departmentId")
      .notNull()
      .references(() => departments.id),
    locationId: uuid("locationId")
      .notNull()
      .references(() => locations.id),
    procurementYear: integer("procurementYear").notNull(),
    description: varchar("description", { length: 200 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    index("idx_item_departmentId").on(table.departmentId),
    index("idx_item_locationId").on(table.locationId),
  ],
);

export const unitStatus = pgEnum("unitStatus", [
  "Tersedia",
  "Rusak",
  "Dalam Perawatan",
]);

export const units = pgTable(
  "units",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    itemId: uuid("itemId")
      .references(() => items.id)
      .notNull(),
    imgUrl: varchar("imgUrl", { length: 255 }),
    status: unitStatus("status").default("Tersedia").notNull(),
    isArchived: boolean("isArchived").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [index("idx_unit_itemId").on(table.itemId)],
);

export const itemsRelations = relations(items, ({ one, many }) => ({
  department: one(departments, {
    fields: [items.departmentId],
    references: [departments.id],
  }),
  location: one(locations, {
    fields: [items.locationId],
    references: [locations.id],
  }),
  units: many(units),
}));

export const unitsRelations = relations(units, ({ one }) => ({
  item: one(items, {
    fields: [units.itemId],
    references: [items.id],
  }),
}));