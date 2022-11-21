import { hasAnyRole } from "./../services/auth/authorization.service";
import { verifyAccessToken } from "./../services/auth/token.service";
import { NextFunction, Request, Response, Router } from "express";
import { findProductsByName, createProduct, updateProduct } from "../services/product.service";
import { Role } from "../commons/role.enum";

const router = Router();

// find products with data from product table
router.get(
  `/products/basic-search`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findProductsByName(req.query.keyword as string);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// add product
router.post(
  `/products`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await createProduct(req.body);
      res.send(response);
    } catch (error) {
      next(error);
    }
  } 
);

// update product by id
router.put(
  `/products/:id`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await updateProduct(req.body, +req.params.id);
      res.send(response);
    } catch (error) {
      next(error);
    }
  } 
);

export default router;