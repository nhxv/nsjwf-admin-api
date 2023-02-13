import { NextFunction, Request, Response, Router } from "express";
import { Role } from "../commons/role.enum";
import { ProductStockResponseDto } from "../dto/responses/product-stock-response.dto";
import { hasAnyRole } from "../services/auth/authorization.service";
import {
  findAllProductStock,
  updateProductStock,
} from "../services/product-stock.service";
import { verifyAccessToken } from "./../services/auth/token.service";

const router = Router();

router.get(
  `/product-stock`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN, Role.OPERATOR])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findAllProductStock();
      res.send(
        response.map((productStock) => {
          const productStockRes: ProductStockResponseDto = {
            name: productStock.product_name,
            quantity: productStock.quantity,
            id: productStock.id,
          };
          return productStockRes;
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

// update product stock by product name & status
router.put(
  `/product-stock`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await updateProductStock(
        req.body.stock,
        req.body.reason
      );
      res.send(
        response.map((productStock) => {
          const productStockRes: ProductStockResponseDto = {
            name: productStock.product_name,
            quantity: productStock.quantity,
          };
          return productStockRes;
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

export default router;
