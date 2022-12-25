import { hasAnyRole } from "./../services/auth/authorization.service";
import { NextFunction, Request, Response, Router } from "express";
import { verifyAccessToken } from "../services/auth/token.service";
import { Role } from "../commons/role.enum";
import { createCustomerReturn, findCustomerReturns } from "../services/customer-return.service";
import { CustomerReturnResponseDto } from "../dto/responses/customer-return-response.dto";
import { ProductCustomerReturnResponseDto } from "../dto/responses/product-customer-return-response.dto";

const router = Router();

// find customer returns by status
router.get(
  `/customer-returns`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response: any = await findCustomerReturns();
      res.send(response.map(
        customerReturn => {
        return new CustomerReturnResponseDto(
          customerReturn.customer_name,
          customerReturn.order_code,
          customerReturn.productCustomerReturns.map(productReturn => {
            return new ProductCustomerReturnResponseDto(
              productReturn.product_name,
              productReturn.quantity,
              productReturn.unit_price,
            )
          }),
          customerReturn.created_at,
        );
      }));
    } catch (error) {
      next(error);
    }
  }
);

// create customer return
router.post(
  `/customer-returns`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await createCustomerReturn(req.body);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;