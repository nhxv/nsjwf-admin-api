import { NextFunction, Request, Response, Router } from "express";
import { Role } from "../commons/enums/role.enum";
import { hasAnyRole } from "../services/auth/authorization.service";
import { CustomerOrderResponseDto } from "./../dto/responses/customer-order-response.dto";
import { ProductCustomerOrderResponseDto } from "./../dto/responses/product-customer-order-response.dto";
import { verifyAccessToken } from "./../services/auth/token.service";
import {
  createCustomerOrder, findCustomerOrderByCode,
  findCustomerOrderByStatus,
  findCustomerSale,
  findDailyCustomerOrder,
  findEmployeeTask,
  finishTask,
  reportCustomerSale,
  reportTask, revertCustomerOrder, startDoingTask,
  stopDoingTask, updateCustomerOrder, updatePriority
} from "./../services/customer-order.service";

const router = Router();

router.get(
  `/customer-orders/daily`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response: any = await findDailyCustomerOrder();
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// find customer orders by status
router.get(
  `/customer-orders/basic-list/:status`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN, Role.OPERATOR])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findCustomerOrderByStatus(req.params.status);
      res.send(
        response.map((order) => {
          const orderRes: CustomerOrderResponseDto = {
            customerName: order.customer_name,
            isTest: order.is_test,
            code: order.code,
            status: order.status,
            productCustomerOrders: order.productCustomerOrders.map((po) => {
              const poRes: ProductCustomerOrderResponseDto = {
                productName: po.product_name,
                quantity: po.quantity,
                unitCode: po.unit_code.split("_")[1].toLowerCase(),
              };
              return poRes;
            }),
            expectedAt: order.expected_at,
            assignTo: order.assign_to,
            isDoing: order.is_doing,
            createdAt: order.created_at,
            updatedAt: order.updated_at,
            manualCode: order.manual_code,
          };
          return orderRes;
        })
      );
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
        decodeURIComponent(req.query.keyword as string),
        req.query.date as string
      );
      res.send(
        response.map((order) => {
          const orderRes: CustomerOrderResponseDto = {
            customerName: order.customer_name,
            isTest: order.is_test,
            code: order.code,
            status: order.status,
            productCustomerOrders: order.productCustomerOrders.map((po) => {
              const poRes: ProductCustomerOrderResponseDto = {
                productName: po.product_name,
                quantity: po.quantity,
                unitCode: po.unit_code.split("_")[1].toLowerCase(),
                unitPrice: po.unit_price,
              };
              return poRes;
            }),
            expectedAt: order.expected_at,
            assignTo: order.assign_to,
            isDoing: order.is_doing,
            createdAt: order.created_at,
            updatedAt: order.updated_at,
            fullReturn: !!order.fullReturn,
            manualCode: order.manual_code,
            paymentStatus: order.customerPayment.status,
          };
          return orderRes;
        })
      );
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

// find employee task
router.get(
  `/customer-orders/tasks/search`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN, Role.OPERATOR])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findEmployeeTask(
        req.query.nickname as string,
        req.query.status as string
      );
      res.send(
        response.map((order) => {
          const orderRes: CustomerOrderResponseDto = {
            customerName: order.customer_name,
            isTest: order.is_test,
            code: order.code,
            status: order.status,
            productCustomerOrders: order.productCustomerOrders.map((po) => {
              const poRes: ProductCustomerOrderResponseDto = {
                productName: po.product_name,
                quantity: po.quantity,
                unitCode: po.unit_code.split("_")[1].toLowerCase(),
                unitPrice: po.unit_price,
              };
              return poRes;
            }),
            expectedAt: order.expected_at,
            assignTo: order.assign_to,
            isDoing: order.is_doing,
            createdAt: order.created_at,
            updatedAt: order.updated_at,
            manualCode: order.manual_code,
          };
          return orderRes;
        })
      );
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

// create customer order
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

// update customer order by order code
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
  `/customer-orders/tasks/start-doing`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN, Role.OPERATOR])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await startDoingTask(
        req.query.code as string,
        req.query.nickname as string
      );
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

// revert customer order by code
router.put(
  `/customer-orders/revert/:code`,
  [verifyAccessToken, hasAnyRole([Role.MASTER])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await revertCustomerOrder(req.params.code);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
