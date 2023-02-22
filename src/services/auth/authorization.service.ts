import { NextFunction, Request, Response } from "express";
import createError from "http-errors";

export const hasAnyRole = (roles: number[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.payload.account?.roleId)) {
      return next(new createError.Forbidden());
    }
    next();
  };
};
