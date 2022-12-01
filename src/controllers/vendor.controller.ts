import { NextFunction, Request, Response, Router } from "express";
import { hasAnyRole } from "../services/auth/authorization.service";
import { verifyAccessToken } from "./../services/auth/token.service";
import { Role } from "../commons/role.enum";
import { findActiveVendors, findVendorsByName, createVendor, updateVendor } from "../services/vendor.service";
import { VendorResponseDto } from "../dto/responses/vendor-response.dto";

const router = Router();

// find active vendors
router.get(
  `/vendors/all`,
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

// find vendors by name from vehicle table
router.get(
  `/vendors/basic-search`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findVendorsByName(req.query.keyword as string);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// add vehicle
router.post(
  `/vendors`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await createVendor(req.body);
      res.send(new VendorResponseDto(
        response.name,
        response.discontinued,
        response.id,
        response.address,
        response.phone,
        response.email,
        response.presentative,
      ));
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
      res.send(new VendorResponseDto(
        response.name,
        response.discontinued,
        response.id,
        response.address,
        response.phone,
        response.email,
        response.presentative,
      ));
    } catch (error) {
      next(error);
    }
  } 
);

export default router;