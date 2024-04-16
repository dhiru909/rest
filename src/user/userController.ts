import { log } from "console";
import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  //validation

  const { email, name, password } = req.body;
  if (!name || !email || !password) {
    const error = createHttpError(400, "all fields required");
    return next(error);
  }
  //process

  //Response
  res.json({ message: name });
};

export { createUser };
