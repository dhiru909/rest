import express, { NextFunction, Request, Response } from "express";
import createHttpError, { HttpError } from "http-errors";
import { config } from "./config/config";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import userRouter from "./user/userRouter";
const app = express();

app.get("/", (req, res, next) => {
  const error = createHttpError(500, "something went wrong");
  throw error;
  res.json({ message: "welcome" });
});

app.use("/api/users",userRouter);

//global error handler at last of all routes
app.use(globalErrorHandler);
export default app;
