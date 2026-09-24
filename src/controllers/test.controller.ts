import { nukeOperation } from "./../services/test.service";
import { NextFunction, Request, Response, Router } from "express";
import { hasAnyRole } from "../services/auth/authorization.service";
import { getRoleByName, getRoles, nukeConfigure } from "../services/test.service";
import { verifyAccessToken } from "../services/auth/token.service";
import { Role } from "../commons/enums/role.enum";

const router = Router();

router.get(`/test/hello`, async (req: Request, res: Response, next: NextFunction) => {
  res.json({ content: "hello from test api" });
});

router.get(`/test/roles`, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await getRoles();
    res.json(roles);
  } catch (error) {
    next(error);
  }
});

router.get(`/test/roles/admin`, [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = await getRoleByName("ADMIN");
    res.json(role);
  } catch (error) {
    next(error);
  }
});

router.get(`/test/roles/operator`, [verifyAccessToken, hasAnyRole([Role.OPERATOR])], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = await getRoleByName("OPERATOR");
    res.json(role);
  } catch (error) {
    next(error);
  }
});

router.delete(`/test/nuke/configure`, [verifyAccessToken, hasAnyRole([Role.MASTER])], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await nukeConfigure();
    res.json({ content: "Configure is nuked." });
  } catch (error) {
    next(error);
  }
});

router.delete(`/test/nuke/operation`, [verifyAccessToken, hasAnyRole([Role.MASTER])], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await nukeOperation();
    res.json({ content: "Operation is nuked." });
  } catch (error) {
    next(error);
  }
});

export default router;
