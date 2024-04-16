import { log } from "console";
import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  //validation

  const { email, name, password } = req.body;
  if (!name || !email || !password) {
    const error = createHttpError(400, "all fields required");
    return next(error);
  }
  const user = await userModel.findOne({ email: email });
  if (user) {
    const error = createHttpError(400, "User Already Exist with this email");
    return next(error);
  }

  //Response
  res.json({ message: name });
};

export { createUser };
