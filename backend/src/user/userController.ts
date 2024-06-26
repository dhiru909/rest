import { log } from "console";
import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";
import bcrypt from "bcrypt";
import { sign, verify } from "jsonwebtoken";
import { config } from "../config/config";
import { User } from "./userTypes";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  //validation

  const { email, name, password } = req.body;
  if (!name || !email || !password) {
    const error = createHttpError(400, "all fields required");
    return next(error);
  }

  try {
    const user = await userModel.findOne({ email: email });
    if (user) {
      const error = createHttpError(400, "User Already Exist with this email");
      return next(error);
    }
  } catch (error) {
    return next(createHttpError(500, "Error while getting user"));
  }

  //password ->hash
  let newUser: User;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });
    //Token generation JWT
    const token = sign({ sub: newUser._id }, config.jwtSecret as string, {
      expiresIn: "7d",
      algorithm: "HS256",
    });

    //Response
    res.json({ accessToken: token });
  } catch (error) {
    return next(createHttpError(500, "Error while creating user"));
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw createHttpError(400, "All field are required");
  }

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return next(createHttpError(404, "user not found."));
    }
    const isMatch = await bcrypt.compare(password, user?.password!);
    if (!isMatch) {
      return next(createHttpError(400, "Username or password incorrect!"));
    }
    const token = sign({ sub: user._id }, config.jwtSecret as string, {
      expiresIn: "7d",
      algorithm: "HS256",
    });
    return res.json({ accessToken : token});
  } catch (error) {
    return next(createHttpError(500, "Error while getting user"));
  }

  res.status(201).json({ message: "OK" });
};

export { createUser, loginUser };
