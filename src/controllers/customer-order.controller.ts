import { NextFunction, Request, Response, Router } from "express";
import { Role } from "../commons/enums/role.enum";
import { CustomerSaleResponseDto } from "../dto/responses/customer-sale-response.dto";
import { hasAnyRole } from "../services/auth/authorization.service";
import { CustomerOrderResponseDto } from "./../dto/responses/customer-order-response.dto";
import { ProductCustomerOrderResponseDto } from "./../dto/responses/product-customer-order-response.dto";
import { verifyAccessToken } from "./../services/auth/token.service";
import {
  createCustomerOrder,
  findCustomerOrderByCode,
  findCustomerSale,
  findDailyCustomerOrder,
  findEmployeeTask,
  finishTask,
  reportTask,
  revertCustomerOrder,
  startDoingTask,
  stopDoingTask,
  updateCustomerOrder,
  updatePriority,
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
      let [code, start_date, end_date, customerName, productName] = [
        "",
        "",
        "",
        "",
        "",
      ];
      // NOTE: The query is already decoded, so special characters are already turn into special characters.
      // Not entirely sure if there are any issues using these strings directly.
      if (Object.keys(req.query).length === 0) {
        start_date = "";
        end_date = "";
      } else if ("code" in req.query) {
        // code = decodeURIComponent(req.query.code as string);
        code = req.query.code as string;
      } else {
        if ("start_date" in req.query) {
          start_date = req.query.start_date as string;
        }
        if ("end_date" in req.query) {
          end_date = req.query.end_date as string;
        }
        if ("customer" in req.query) {
          // customerName = decodeURIComponent(req.query.customer as string);
          customerName = req.query.customer as string;
        }
        if ("product" in req.query) {
          // productName = decodeURIComponent(req.query.product as string);
          productName = req.query.product as string;
        }
      }
      const response: any = await findCustomerSale({
        code: code,
        start_date: start_date,
        end_date: end_date,
        customer: customerName,
        product: productName,
      });
      res.send(
        response.map((order) => {
          const orderRes: CustomerSaleResponseDto = {
            customerName: order.customer_name,
            isTest: order.is_test,
            orderCode: order.order_code,
            sale: order.sale,
            productCustomerOrders: order.productCustomerOrders.map((po) => {
              const poRes: ProductCustomerOrderResponseDto = {
                productName: po.product_name,
                quantity: po.quantity,
                unitCode: po.unit_code.split("_")[1].toLowerCase(),
                unitPrice: po.unit_price,
              };
              return poRes;
            }),
            invoiceDate: order.expected_at,
            completedAt: order.updated_at,
            manualCode: order.manual_code,
            paymentStatus: order.payment_status,
          };
          return orderRes;
        })
      );
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
  [verifyAccessToken, hasAnyRole([Role.ADMIN, Role.MASTER])],
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
