import { NextFunction, Request, Response } from "express";
import createError from "http-errors";
import JWT from "jsonwebtoken";
import prisma from "../../prisma/prisma-client";

export const signAccessToken = (accountId: number, roleId: number) => {
  return new Promise((resolve, reject) => {
    const payload = { account: {id: accountId, roleId: roleId} };
    const secret = process.env.ACCESS_TOKEN_SECRET || "nhxv";
    const options = {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE,
      audience: `${accountId}`,
    };
    JWT.sign(payload, secret, options, async (err, token) => {
      if (err) {
        reject(new createError.InternalServerError());
        return;
      }
      await prisma.account.update({where: {id: accountId}, data: {access_token: token}});
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
    //@ts-ignore
    const account = await prisma.account.findUnique({ where: { id: payload?.account?.id } });
    if (account?.access_token !== token) {
      return next(new createError.Unauthorized());
    }
    // pass payload to authorization middleware
    req.payload = payload;
    next();
  });
};

export const signRefreshToken = (accountId: number, roleId: number) => {
  return new Promise((resolve, reject) => {
    const payload = {account: { id: accountId, roleId: roleId }};
    const secret = process.env.REFRESH_TOKEN_SECRET || "nhxv";
    const options = {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE,
      audience: `${accountId}`,
    };
    JWT.sign(payload, secret, options, async (err, token) => {
      if (err) {
        reject(new createError.InternalServerError());
      }
      await prisma.account.update({ where: { id: accountId }, data: { refresh_token: token } });
      resolve(token);
    });
  });
}

export const verifyRefreshToken = (refreshToken: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    JWT.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || "nhxv", async (err, payload: any) => {
      if (err) return reject(new createError.Unauthorized());
      const accountId: string | undefined = payload.aud;
      if (!accountId) {
        throw new createError.Unauthorized();
      }
      const account = await prisma.account.findUnique({ where: { id: +accountId } });
      if (!account) {
        reject(new createError.Unauthorized());
      }
      if (refreshToken === account?.refresh_token) return resolve(+accountId);
      reject(new createError.Unauthorized());
    });
  });
}