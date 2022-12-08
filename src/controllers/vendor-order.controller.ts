import { ProductVendorOrderResponseDto } from "./../dto/responses/product-vendor-order-response.dto";
import { VendorOrderResponseDto } from "./../dto/responses/vendor-order-response.dto";
import { findVendorOrderByStatus, findVendorOrderByCode } from "./../services/vendor-order.service";
import { verifyAccessToken } from "./../services/auth/token.service";
import { NextFunction, Request, Response, Router } from "express";
import { hasAnyRole } from "../services/auth/authorization.service";
import { Role } from "../commons/role.enum";
import { createVendorOrder, updateVendorOrder } from "../services/vendor-order.service";

const router = Router();

// find vendor order by status
router.get(
  `/vendor-orders/basic-list/:status`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findVendorOrderByStatus(req.params.status);
      res.send(response.map(order => {
        return new VendorOrderResponseDto(
          order.vendor_name,
          order.is_test,
          order.code,
          order.status,
          order.productVendorOrders.map(productOrder => {
            return new ProductVendorOrderResponseDto(
              productOrder.product_name,
              productOrder.quantity,
            )
          }),
          order.created_at,
        );
      }));
    } catch (error) {
      next(error);
    }    
  }
);

// find vendor order by code
router.get(
  `/vendor-orders/:code`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findVendorOrderByCode(req.params.code);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// create order to vendor
router.post(
  `/vendor-orders`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await createVendorOrder(req.body);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// update order to vendor by order code
router.put(
  `/vendor-orders/:code`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await updateVendorOrder(req.params.code, req.body);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;