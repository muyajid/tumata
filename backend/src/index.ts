import { configDotenv } from "dotenv";
import express, { Request, Response } from "express";
import logger from "./configs/logger";
import router from "./routes/index.route";
import { errorHandler } from "./exceptions/error-handler.exception";
import { requestLogMiddleware } from "./middlewares/request.middleware";
import cors from "cors";
import path from "node:path";
import cookieParser from "cookie-parser";

configDotenv();

const app: express.Express = express();

app.use(cookieParser());
app.use(express.json());

app.use(
  cors({
    origin: "*",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "DELETE", "OPTIONS", "PUT", "PATCH"],
  }),
);

app.use(requestLogMiddleware);

app.use("/images", express.static(`${process.cwd()}/public/images`));
app.use(express.static(`${process.cwd()}/public`));

app.get("/api/health", (req: Request, res: Response) => {
  return res.json({
    message: "Tumata API is running",
  });
});

app.use("/api", router);
app.get("*", (req: Request, res: Response) => {
  return res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

app.use(errorHandler);

const port: number = Number(process.env.PORT) || 8080;

app.listen(port, () => {
  logger.info(`Server is succesfully running on port:${port}`);
});