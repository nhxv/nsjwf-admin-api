import { NextFunction, Request, Response, Router } from "express";
import { Role } from "../commons/enums/role.enum";
import { hasAnyRole } from "../services/auth/authorization.service";
import {
  createVendor,
  findActiveVendors,
  findAllVendors,
  findVendorById,
  findVendorTendencyByName,
  updateVendor,
} from "../services/vendor.service";
import { verifyAccessToken } from "./../services/auth/token.service";

const router = Router();

// find all vendors
router.get(
  `/vendors/all`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findAllVendors();
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// find active vendors
router.get(
  `/vendors/active`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findActiveVendors();
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// find vendor by id
router.get(
  `/vendors/active/:id`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findVendorById(+req.params.id);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  `/vendors/active/tendency/:name`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findVendorTendencyByName(
        decodeURIComponent(req.params.name)
      );
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// add vendor
router.post(
  `/vendors`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await createVendor(req.body);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// update vendor by id
router.put(
  `/vendors/:id`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await updateVendor(req.body, +req.params.id);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
