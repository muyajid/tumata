import { configDotenv } from "dotenv";
import express, { Request, Response } from "express";
import logger from "./configs/logger.js";
import router from "./routes/index.route.js";
import { errorHandler } from "./exceptions/error-handler.exception.js";
import { requestLogMiddleware } from "./middlewares/request.middleware.js";

configDotenv();

const app: express.Express = express();

app.use(express.json());

app.use(requestLogMiddleware);

app.get("/", (req: Request, res: Response) => {
    return res.json({
        message: 'Tumata API is running'
    });
});


app.use("/api", router);
app.use(errorHandler);

const port: number = Number(process.env.PORT) || 8080;

app.listen(port, () => {
    logger.info(`Server is succesfully running on port:${port}`);
});