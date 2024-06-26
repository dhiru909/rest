import express, { NextFunction, Request, Response } from "express";
import createHttpError, { HttpError } from "http-errors";
import { config } from "./config/config";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import userRouter from "./user/userRouter";
import bookRouter from "./book/bookRouter";
import cors from "cors";
const app = express();
app.use(express.json());
app.use(
  cors({
    origin: config.frontendDomain,
  })
); // allow all origins for development purposes only
// app.options("*", cors()) // enable preflight requests for CORS
app.get("/", (req, res, next) => {
  // const error = createHttpError(500, "something went wrong");
  // throw error;
  res.json({ message: "welcome" });
});

//routers
app.use("/api/users", userRouter);
app.use("/api/books", bookRouter);

//global error handler at last of all routes
app.use(globalErrorHandler);
export default app;
