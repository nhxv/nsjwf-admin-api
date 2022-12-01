import { NextFunction, Request, Response } from "express";
import createError from "http-errors";
import JWT from "jsonwebtoken";

export const signAccessToken = (accountId: number, roleId: number) => {
  return new Promise<string>((resolve, reject) => {
    const payload = { account: {id: accountId, roleId: roleId} };
    const secret = process.env.ACCESS_TOKEN_SECRET || "nhxv";
    const options = {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE,
      audience: `${accountId}`,
    };
    JWT.sign(payload, secret, options, async (err, token) => {
      if (err) {
        reject(new createError.InternalServerError("Fail to sign token."));
        return;
      }
      resolve(token);
    });
  });
}

export const verifyAccessToken = (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers["authorization"]) {
    return next(new createError.Unauthorized("Missing headers"));
  } 
  const authHeader = req.headers["authorization"];
  const bearerToken = authHeader.split(" ");
  const token = bearerToken[1];

  JWT.verify(token, process.env.ACCESS_TOKEN_SECRET || "nhxv", async (err, payload) => {
    if (err) {
      const message = err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
      return next(new createError.Unauthorized(message));
    }
    // pass payload to authorization middleware
    req.payload = payload;
    next();
  });
};