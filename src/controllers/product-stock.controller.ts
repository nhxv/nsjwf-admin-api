import { ProductStockRequestDto } from "./../dto/requests/product-stock-request.dto";
import { verifyAccessToken } from "./../services/auth/token.service";
import { NextFunction, Request, Response, Router } from "express";
import { hasAnyRole } from "../services/auth/authorization.service";
import { Role } from "../commons/role.enum";
import { findAllProductStock, updateProductStock } from "../services/product-stock.service";
import { ProductStockResponseDto } from "../dto/responses/product-stock-response.dto";

const router = Router();

router.get(
  `/product-stock`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findAllProductStock();
      res.send(response.map((productStock) => {
        return new ProductStockResponseDto(
          productStock.product_name,
          productStock.quantity,
          productStock.id,
        )
      }));
    } catch (error) {
      next(error);
    }

  }
)

// update product stock by product name & status
router.put(
  `/product-stock/:reason`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await updateProductStock(req.body, req.params.reason);
      res.send(response.map((productStock) => {
        return new ProductStockResponseDto(
          productStock.product_name,
          productStock.quantity,
        )
      }));
    } catch (error) {
      next(error);
    }
  }
);

export default router;