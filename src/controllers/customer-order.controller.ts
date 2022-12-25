import { ProductCustomerOrderResponseDto } from "./../dto/responses/product-customer-order-response.dto";
import { CustomerOrderResponseDto } from "./../dto/responses/customer-order-response.dto";
import { findCustomerOrderByStatus, findCustomerOrderByCode, findCustomerSale, reportCustomerSale } from "./../services/customer-order.service";
import { verifyAccessToken } from "./../services/auth/token.service";
import { NextFunction, Request, Response, Router } from "express";
import { hasAnyRole } from "../services/auth/authorization.service";
import { Role } from "../commons/role.enum";
import { createCustomerOrder, updateCustomerOrder } from "../services/customer-order.service";

const router = Router();

// find customer orders by status
router.get(
  `/customer-orders/basic-list/:status`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN, Role.OPERATOR])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response: any = await findCustomerOrderByStatus(req.params.status);
      res.send(response.map(
        order => {
        return new CustomerOrderResponseDto(
          order.customer_name,
          order.is_test,
          order.code,
          order.status,
          order.productCustomerOrders.map(productOrder => {
            return new ProductCustomerOrderResponseDto(
              productOrder.product_name,
              productOrder.quantity,
              productOrder.unit_price,
            )
          }),
          order.expected_at,
          order.created_at,
          order.updated_at,
        );
      }));
    } catch (error) {
      next(error);
    }
  }
);

// find customer order by code
router.get(
  `/customer-orders/:code`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findCustomerOrderByCode(req.params.code);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// search customer sale
router.get(
  `/customer-orders/sold/search`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response: any = await findCustomerSale(
        req.query.keyword as string, 
        req.query.date as string
      );
      res.send(response.map(
        order => {
        return new CustomerOrderResponseDto(
          order.customer_name,
          order.is_test,
          order.code,
          order.status,
          order.productCustomerOrders.map(productOrder => {
            return new ProductCustomerOrderResponseDto(
              productOrder.product_name,
              productOrder.quantity,
              productOrder.unit_price,
            )
          }),
          order.expected_at,
          order.created_at,
          order.updated_at,
          !!order.fullReturn,
        );
      }));
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  `/customer-orders/sold/report`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await reportCustomerSale();
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
)

// create order to customer
router.post(
  `/customer-orders`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await createCustomerOrder(req.body);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// update order to customer by order code
router.put(
  `/customer-orders/:code`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await updateCustomerOrder(req.params.code, req.body);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;