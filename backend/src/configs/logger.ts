import pino from "pino";
import "dotenv/config";

const isDevelopment = process.env.NODE_ENV === "development";

const redactPaths = [
  "password",
  "*.password",
  "*[*].password",
  "*.*.password",
  "userId",
  "*.userId",
  "*[*].userId",
  "*.*.userId",
  "user_id",
  "*.user_id",
  "*[*].user_id",
  "*.*.user_id",
  "userid",
  "*.userid",
  "*[*].userid",
  "*.*.userid",
  "params[*].password",
  "params[*].userId",
  "params[*].user_id",
  "params[*].userid",
];

export const logger = pino({
  level: isDevelopment ? "debug" : "info",
  redact: {
    paths: redactPaths,
    censor: "[REDACTED]",
  },
  ...(isDevelopment && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  }),
});

export default logger;

