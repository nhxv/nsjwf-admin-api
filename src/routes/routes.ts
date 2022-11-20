import { Router } from "express";
import testController from "../controllers/test.controller";
import authController from "../controllers/auth.controller";
import productController from "../controllers/product.controller"

const api = Router()
.use(testController)
.use(authController)
.use(productController);

export default Router().use("/api", api);