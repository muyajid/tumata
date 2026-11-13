import { pgEnum, pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const userRole = pgEnum("userRole", ["Super Admin", "Admin", "User"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  role: userRole("role").default("User").notNull(),
  password: varchar("password", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
