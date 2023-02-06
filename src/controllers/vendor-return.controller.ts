import { hasAnyRole } from "./../services/auth/authorization.service";
import { NextFunction, Request, Response, Router } from "express";
import { verifyAccessToken } from "../services/auth/token.service";
import { Role } from "../commons/role.enum";
import { createVendorReturn, findVendorReturns } from "../services/vendor-return.service";
import { VendorReturnResponseDto } from "../dto/responses/vendor-return-response.dto";
import { ProductVendorReturnResponseDto } from "../dto/responses/product-vendor-return-response.dto";

const router = Router();

// find vendor returns by status
router.get(
  `/vendor-returns`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findVendorReturns();
      res.send(response.map(vendorReturn => {
        const vendorReturnRes: VendorReturnResponseDto = {
          vendorName: vendorReturn.vendor_name,
          orderCode: vendorReturn.order_code,
          productVendorReturns: vendorReturn.productVendorReturns.map(pr => {
            const prRes: ProductVendorReturnResponseDto = {
              productName: pr.product_name,
              quantity: pr.quantity,
              unitPrice: pr.unit_price,
            };
            return prRes;
          }),
          createdAt: vendorReturn.created_at,
        };
        return vendorReturnRes;
      }));
    } catch (error) {
      next(error);
    }
  }
);

// create vendor return
router.post(
  `/vendor-returns`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await createVendorReturn(req.body);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;