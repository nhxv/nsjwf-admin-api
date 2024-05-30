import { NextFunction, Request, Response, Router } from "express";
import { verifyAccessToken } from "../services/auth/token.service";
import { hasAnyRole } from "../services/auth/authorization.service";
import { Role } from "../commons/enums/role.enum";
import {
  rankCustomersByProduct,
  rankProductsByCount,
} from "../services/analysis.service";

const router = Router();

router.get(
  "/analysis/analyze-customer-sale",
  [verifyAccessToken, hasAnyRole([Role.ADMIN, Role.MASTER])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let [start_date, end_date, product] = [
        req.query.start_date as string,
        req.query.end_date as string,
        req.query?.product as string | undefined,
      ];
      if (!product) {
        product = "";
      }

      const result = await rankCustomersByProduct({
        start_date: start_date,
        end_date: end_date,
        product: product,
      });
      res.send(result);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/analysis/customer-margin",
  [verifyAccessToken, hasAnyRole([Role.ADMIN, Role.MASTER])],
  async (req: Request, res: Response, next: NextFunction) => {
    const mockResp = {
      "Customer 1": ["Customer 1", 15],
      "Customer 2": ["Customer 2", 12.36],
    };
    res.send({
      columns: ["Customer", "Gross Margin"],
      entries: mockResp,
    });
  }
);

router.get(
  "/analysis/analyze-product-sale",
  [verifyAccessToken, hasAnyRole([Role.ADMIN, Role.MASTER])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let [start_date, end_date] = [
        req.query.start_date as string,
        req.query.end_date as string,
      ];
      const result = await rankProductsByCount({
        start_date: start_date,
        end_date: end_date,
      });

      res.send(Object.values(result));
    } catch (error) {
      next(error);
    }
  }
);

export default router;
