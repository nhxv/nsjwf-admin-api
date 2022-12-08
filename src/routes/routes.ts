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
.use(backorderController);

export default Router().use("/api", api);