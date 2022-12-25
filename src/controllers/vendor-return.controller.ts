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
      const response: any = await findVendorReturns();
      res.send(response.map(
        vendorReturn => {
        return new VendorReturnResponseDto(
          vendorReturn.vendor_name,
          vendorReturn.order_code,
          vendorReturn.productVendorReturns.map(productReturn => {
            return new ProductVendorReturnResponseDto(
              productReturn.product_name,
              productReturn.quantity,
              productReturn.unit_price,
            )
          }),
          vendorReturn.created_at,
        );
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