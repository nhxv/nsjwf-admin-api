import { NextFunction, Request, Response, Router } from "express";
import { Role } from "../commons/role.enum";
import { hasAnyRole } from "../services/auth/authorization.service";
import { createCustomerOrder, updateCustomerOrder } from "../services/customer-order.service";
import { CustomerOrderResponseDto } from "./../dto/responses/customer-order-response.dto";
import { ProductCustomerOrderResponseDto } from "./../dto/responses/product-customer-order-response.dto";
import { verifyAccessToken } from "./../services/auth/token.service";
import { findCustomerOrderByCode, findCustomerOrderByStatus, findCustomerSale, findEmployeeTask, finishTask, reportCustomerSale, reportTask, updatePriority, startDoingTask, stopDoingTask } from "./../services/customer-order.service";

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
            )
          }),
          order.expected_at,
          order.assign_to,
          order.is_doing,
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
          order.assign_to,
          order.is_doing,
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
);

router.get(
  `/customer-orders/tasks/search`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN, Role.OPERATOR])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findEmployeeTask(
        req.query.nickname as string,
        req.query.status as string, 
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
          order.assign_to,
          order.is_doing,
          order.created_at,
          order.updated_at,
        );
      }));
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  `/customer-orders/tasks/report/:nickname`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN, Role.OPERATOR])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await reportTask(req.params.nickname);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

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

// when employee start doing task assigned to them
router.put(
  `/customer-orders/tasks/start-doing/:code`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN, Role.OPERATOR])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await startDoingTask(req.params.code);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// when employee stop doing task assigned to them
router.put(
  `/customer-orders/tasks/stop-doing/:code`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN, Role.OPERATOR])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await stopDoingTask(req.params.code);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// when employee finish task assigned to them
router.put(
  `/customer-orders/tasks/finish/:code`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN, Role.OPERATOR])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await finishTask(req.params.code);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// when update employee task priority
router.put(
  `/customer-orders/tasks/priority`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await updatePriority(req.body);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;