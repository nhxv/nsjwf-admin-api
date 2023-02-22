import { NextFunction, Request, Response, Router } from "express";
import { Role } from "../commons/enums/role.enum";
import {
  createProduct,
  findActiveProducts,
  findAllProducts,
  findProductById,
  updateProduct,
} from "../services/product.service";
import { hasAnyRole } from "./../services/auth/authorization.service";
import { verifyAccessToken } from "./../services/auth/token.service";

const router = Router();

// find all products
router.get(
  `/products/all`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findAllProducts();
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// find active products
router.get(
  `/products/active`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findActiveProducts();
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// find product by id
router.get(
  `/products/find/:id`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findProductById(+req.params.id);
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
