import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { verify } from "jsonwebtoken";
import { config } from "../config/config";

export interface AuthRequest extends Request {
  userId: string;
}
/**
 * Authenticates the user by checking the authorization token in the request header.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function in the middleware chain.
 */
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("Authorization");

  if (!token) {
    return next(createHttpError(401, "Authorization Token is required"));
  }
  
  try {
    const parsedToken = token.split(" ")[1]; // Authorization: Bearer <token>

  if (!parsedToken) {
    return next(createHttpError(403, "Invalid format of Authorization Token"));
  }
    const decoded = verify(parsedToken, config.jwtSecret as string);
    const _req = req as AuthRequest;
    _req.userId = decoded.sub as string;
    //   console.log(`User ID : ${decoded}`);
  } catch (error) {
    return next(createHttpError(401, "Token expired"));
  }

  next();
};

export default authenticate;
