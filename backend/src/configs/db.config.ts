import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../db/schema/index";
import { logger } from "./logger";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, {
  schema,
  logger: {
    logQuery(query, params) {
      logger.debug({ query, params }, "drizzle query");
    },
  },
});

export { pool };