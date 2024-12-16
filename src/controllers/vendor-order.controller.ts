import { NextFunction, Request, Response, Router } from "express";
import { Role } from "../commons/enums/role.enum";
import { hasAnyRole } from "../services/auth/authorization.service";
import {
  createVendorOrder,
  revertVendorOrder,
  updateVendorOrder,
} from "../services/vendor-order.service";
import { ProductVendorOrderResponseDto } from "./../dto/responses/product-vendor-order-response.dto";
import { VendorSaleResponseDto } from "./../dto/responses/vendor-sale-response.dto";
import { verifyAccessToken } from "./../services/auth/token.service";
import {
  findDailyVendorOrder,
  findVendorOrderByCode,
  findVendorSale,
} from "./../services/vendor-order.service";
import { imageReceiver } from "../commons/file";

const router = Router();

router.get(
  `/vendor-orders/daily`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response: any = await findDailyVendorOrder();
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// find vendor order by code
router.get(
  `/vendor-orders/:code`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findVendorOrderByCode(req.params.code);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// search vendor sale
router.get(
  `/vendor-orders/sold/search`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let [code, start_date, end_date, vendorName, productName] = [
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
        if ("vendor" in req.query) {
          // vendorName = decodeURIComponent(req.query.vendor as string);
          vendorName = req.query.vendor as string;
        }
        if ("product" in req.query) {
          // productName = decodeURIComponent(req.query.product as string);
          productName = req.query.product as string;
        }
      }
      const response: any = await findVendorSale({
        code: code,
        start_date: start_date,
        end_date: end_date,
        vendor: vendorName,
        product: productName,
      });
      res.send(
        response.map((order) => {
          const orderRes: VendorSaleResponseDto = {
            vendorName: order.vendor_name,
            isTest: order.is_test,
            orderCode: order.order_code,
            manualCode: order.manual_code,
            sale: order.sale,
            productVendorOrders: order.productVendorOrders.map((po) => {
              const poRes: ProductVendorOrderResponseDto = {
                productName: po.product_name,
                quantity: po.quantity,
                unitCode: po.unit_code.split("_")[1].toLowerCase(),
                unitPrice: po.unit_price,
              };
              return poRes;
            }),
            // For now we don't need to provide returns detail, but maybe later.
            //createdAt: order.created_at,
            expectedAt: order.expected_at,
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

// create order to vendor
router.post(
  `/vendor-orders`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  imageReceiver.single("attachment"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body.attachment = req.file;
      const response = await createVendorOrder(req.body);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// update order to vendor by order code
router.put(
  `/vendor-orders/:code`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  imageReceiver.single("attachment"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body.attachment = req.file;
      const response = await updateVendorOrder(req.params.code, req.body);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// revert vendor order by code
router.put(
  `/vendor-orders/revert/:code`,
  [verifyAccessToken, hasAnyRole([Role.ADMIN, Role.MASTER])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await revertVendorOrder(req.params.code);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
