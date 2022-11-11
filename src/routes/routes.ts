import { Router } from "express";
import testController from "../controllers/test.controller";
import productController from "../controllers/product.controller";

const api = Router()
.use(testController)
.use(productController);

export default Router().use("/api", api);