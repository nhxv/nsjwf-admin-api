import { Router } from "express";
import testController from "../controllers/test.controller";
import authController from "../controllers/auth.controller";
import productController from "../controllers/product.controller";
import customerController from "../controllers/customer.controller";
import vendorController from "../controllers/vendor.controller";
import vehicleController from "../controllers/vehicle.controller";
import productStockController from "../controllers/stock.controller";
import vendorOrderController from "../controllers/vendor-order.controller";
import customerOrderController from "../controllers/customer-order.controller";
// import backorderController from "../controllers/backorder.controller";
import customerReturnController from "../controllers/customer-return.controller";
import customerReturnRemainController from "../controllers/customer-return-remain.controller";
import vendorReturnController from "../controllers/vendor-return.controller";
import vendorReturnRemainController from "../controllers/vendor-return-remain.controller";
import accountController from "../controllers/account.controller";
import unitController from "../controllers/unit.controller";
import customerPaymentController from "../controllers/customer-payment.controller";

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
  // .use(backorderController)
  .use(customerReturnController)
  .use(customerReturnRemainController)
  .use(vendorReturnController)
  .use(vendorReturnRemainController)
  .use(accountController)
  .use(unitController)
  .use(customerPaymentController);

export default Router().use("/api", api);
