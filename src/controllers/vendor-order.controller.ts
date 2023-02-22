import { ProductVendorOrderResponseDto } from "./../dto/responses/product-vendor-order-response.dto";
import { VendorOrderResponseDto } from "./../dto/responses/vendor-order-response.dto";
import {
  findVendorOrderByStatus,
  findVendorOrderByCode,
  findVendorSale,
} from "./../services/vendor-order.service";
import { verifyAccessToken } from "./../services/auth/token.service";
import { NextFunction, Request, Response, Router } from "express";
import { hasAnyRole } from "../services/auth/authorization.service";
import { Role } from "../commons/enums/role.enum";
import {
  createVendorOrder,
  updateVendorOrder,
} from "../services/vendor-order.service";

const router = Router();

// find vendor order by status
router.get(
  `/vendor-orders/basic-list/:status`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findVendorOrderByStatus(req.params.status);
      res.send(
        response.map((order) => {
          const vendorOrderRes: VendorOrderResponseDto = {
            vendorName: order.vendor_name,
            isTest: order.is_test,
            code: order.code,
            status: order.status,
            productVendorOrders: order.productVendorOrders.map((po) => {
              const poRes: ProductVendorOrderResponseDto = {
                productName: po.product_name,
                quantity: po.quantity,
                unitCode: po.unit_code.split("_")[1].toLowerCase(),
                unitPrice: po.unit_price,
              };
              return poRes;
            }),
            expectedAt: order.expected_at,
            createdAt: order.created_at,
          };
          return vendorOrderRes;
        })
      );
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

// search vendor sale
router.get(
  `/vendor-orders/sold/search`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response: any = await findVendorSale(
        decodeURIComponent(req.query.keyword as string),
        req.query.date as string
      );
      res.send(
        response.map((order) => {
          const vendorOrderRes: VendorOrderResponseDto = {
            vendorName: order.vendor_name,
            isTest: order.is_test,
            code: order.code,
            status: order.status,
            productVendorOrders: order.productVendorOrders.map((po) => {
              const poRes: ProductVendorOrderResponseDto = {
                productName: po.product_name,
                quantity: po.quantity,
                unitCode: po.unit_code.split("_")[1].toLowerCase(),
                unitPrice: po.unit_price,
              };
              return poRes;
            }),
            expectedAt: order.expected_at,
            createdAt: order.created_at,
            updatedAt: order.updated_at,
            fullReturn: !!order.fullReturn,
          };
          return vendorOrderRes;
        })
      );
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
