import { Router } from "express";
import testController from "../controllers/test.controller";
import authController from "../controllers/auth.controller";
import productController from "../controllers/product.controller";
import customerController from "../controllers/customer.controller";
import vendorController from "../controllers/vendor.controller";
import vehicleController from "../controllers/vehicle.controller";
import productStockController from "../controllers/product-stock.controller";
import vendorOrderController from "../controllers/vendor-order.controller";
import customerOrderController from "../controllers/customer-order.controller";
import backorderController from "../controllers/backorder.controller";
import customerReturnController from "../controllers/customer-return.controller";
import customerSaleReturnController from "../controllers/customer-sale-return.controller";
import vendorReturnController from "../controllers/vendor-return.controller";
import vendorSaleReturnController from "../controllers/vendor-sale-return.controller";
import accountController from "../controllers/account.controller";

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
.use(backorderController)
.use(customerReturnController)
.use(customerSaleReturnController)
.use(vendorReturnController)
.use(vendorSaleReturnController)
.use(accountController);

export default Router().use("/api", api);