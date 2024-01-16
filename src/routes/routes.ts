import { Router } from "express";
import accountController from "../controllers/account.controller";
import authController from "../controllers/auth.controller";
import customerOrderController from "../controllers/customer-order.controller";
import customerPaymentController from "../controllers/customer-payment.controller";
import customerController from "../controllers/customer.controller";
import productController from "../controllers/product.controller";
import productStockController from "../controllers/stock.controller";
import testController from "../controllers/test.controller";
import unitController from "../controllers/unit.controller";
import vehicleController from "../controllers/vehicle.controller";
import vendorOrderController from "../controllers/vendor-order.controller";
import vendorReturnRemainController from "../controllers/vendor-return-remain.controller";
import vendorReturnController from "../controllers/vendor-return.controller";
import vendorController from "../controllers/vendor.controller";

const api = Router()
  .use(testController)
  .use(authController)
  .use(productController)
  .use(customerController)
  .use(vendorController)
  .use(vehicleController)
  .use(productStockController)
  .use(vendorOrderController)
  .use(customerOrderController)
  .use(vendorReturnController)
  .use(vendorReturnRemainController)
  .use(accountController)
  .use(unitController)
  .use(customerPaymentController);

export default Router().use("/api", api);
