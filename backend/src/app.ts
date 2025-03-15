import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "50mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb",
  })
);

app.use(
  cookieParser()
);

app.use(
  morgan("dev")
);

// Api start url
const api = "api";

// Api version
const apiVersion = "v1";

// Api base url
const apiBaseUrl = `/${api}/${apiVersion}`;

// Api routes

import userRouter from "./routes/user.routes.js";

// Api end-point routes

app.use(`${apiBaseUrl}/user`, userRouter);


// Middleware for error handling
app.use(
  errorMiddleware
);

export { app };