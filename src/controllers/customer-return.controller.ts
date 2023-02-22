import { ProductCustomerReturnResponseDto } from "./../dto/responses/product-customer-return-response.dto";
import { hasAnyRole } from "./../services/auth/authorization.service";
import { NextFunction, Request, Response, Router } from "express";
import { verifyAccessToken } from "../services/auth/token.service";
import { Role } from "../commons/enums/role.enum";
import {
  createCustomerReturn,
  findCustomerReturns,
} from "../services/customer-return.service";
import { CustomerReturnResponseDto } from "../dto/responses/customer-return-response.dto";

const router = Router();

// find customer returns by status
router.get(
  `/customer-returns`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findCustomerReturns();
      res.send(
        response.map((customerReturn) => {
          const customerReturnRes: CustomerReturnResponseDto = {
            customerName: customerReturn.customer_name,
            orderCode: customerReturn.order_code,
            productCustomerReturns: customerReturn.productCustomerReturns.map(
              (pr) => {
                const prRes: ProductCustomerReturnResponseDto = {
                  productName: pr.product_name,
                  quantity: pr.quantity,
                  unitCode: pr.unit_code.split("_")[1].toLowerCase(),
                  unitPrice: pr.unit_price,
                };
                return prRes;
              }
            ),
            createdAt: customerReturn.created_at,
          };
          return customerReturnRes;
        })
      );
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
