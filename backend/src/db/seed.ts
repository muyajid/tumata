import "dotenv/config";
import { db, pool } from "../configs/db.config";
import { users } from "./schema";
import { hashPassword } from "../utils/auth.util";
import logger from "../configs/logger";

type SeedUser = {
  username: string;
  email: string;
  phone: string;
  role: "Super Admin" | "Admin" | "User";
  password: string;
};

const seedUsers: SeedUser[] = [
  {
    username: "superadmin",
    email: "superadmin@example.com",
    phone: "081234567001",
    role: "Super Admin",
    password: "password123",
  },
  {
    username: "admin1",
    email: "admin1@example.com",
    phone: "081234567002",
    role: "Admin",
    password: "password123",
  },
  {
    username: "admin2",
    email: "admin2@example.com",
    phone: "081234567003",
    role: "Admin",
    password: "password123",
  },
  {
    username: "admin3",
    email: "admin3@example.com",
    phone: "081234567004",
    role: "Admin",
    password: "password123",
  },
  {
    username: "user1",
    email: "user1@example.com",
    phone: "081234567005",
    role: "User",
    password: "password123",
  },
  {
    username: "user2",
    email: "user2@example.com",
    phone: "081234567006",
    role: "User",
    password: "password123",
  },
  {
    username: "user3",
    email: "user3@example.com",
    phone: "081234567007",
    role: "User",
    password: "password123",
  },
  {
    username: "user4",
    email: "user4@example.com",
    phone: "081234567008",
    role: "User",
    password: "password123",
  },
  {
    username: "user5",
    email: "user5@example.com",
    phone: "081234567009",
    role: "User",
    password: "password123",
  },
  {
    username: "user6",
    email: "user6@example.com",
    phone: "081234567010",
    role: "User",
    password: "password123",
  },
  {
    username: "user7",
    email: "user7@example.com",
    phone: "081234567011",
    role: "User",
    password: "password123",
  },
  {
    username: "user8",
    email: "user8@example.com",
    phone: "081234567012",
    role: "User",
    password: "password123",
  },
  {
    username: "user9",
    email: "user9@example.com",
    phone: "081234567013",
    role: "User",
    password: "password123",
  },
  {
    username: "user10",
    email: "user10@example.com",
    phone: "081234567014",
    role: "User",
    password: "password123",
  },
  {
    username: "user11",
    email: "user11@example.com",
    phone: "081234567015",
    role: "User",
    password: "password123",
  },
];

async function seed() {
  try {
    logger.info("Starting user seed...");

    for (const user of seedUsers) {
      const hashedPassword = await hashPassword(user.password);

      await db.insert(users).values({
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        password: hashedPassword,
      });
    }

    logger.info("User seed completed successfully");
  } catch (error) {
    logger.error(error, "User seed failed");
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
