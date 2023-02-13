import {
  findBackorderByStatus,
  findBackorderById,
  createBackorder,
  updateBackorder,
  convertBackorder,
} from "./../services/backorder.service";
import { NextFunction, Request, Response, Router } from "express";
import { hasAnyRole } from "../services/auth/authorization.service";
import { Role } from "../commons/role.enum";
import { verifyAccessToken } from "./../services/auth/token.service";
import { BackorderResponseDto } from "../dto/responses/backorder-response.dto";
import { ProductBackorderResponseDto } from "../dto/responses/product-backorder-response.dto";

const router = Router();

// find backorders that is not archived
router.get(
  `/backorders/basic-list/:status`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findBackorderByStatus(req.params.status);
      res.send(
        response.map((order) => {
          const backorderRes: BackorderResponseDto = {
            customerName: order.customer_name,
            isTest: order.is_test,
            productBackorders: order.productBackorders.map((po) => {
              const poRes: ProductBackorderResponseDto = {
                productName: po.product_name,
                quantity: po.quantity,
              };
              return poRes;
            }),
            isArchived: order.is_archived,
            createdAt: order.created_at,
            expectedAt: order.expected_at,
            id: order.id,
          };
          return backorderRes;
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

// find customer order by code
router.get(
  `/backorders/:id`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findBackorderById(+req.params.id);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// create backorder
router.post(
  `/backorders`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await createBackorder(req.body);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// update backorder by id
router.put(
  `/backorders/:id`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await updateBackorder(+req.params.id, req.body);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// update backorder by id
router.put(
  `/backorders/convert/:id`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await convertBackorder(+req.params.id, req.body);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
