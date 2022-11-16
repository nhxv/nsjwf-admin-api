import { Router } from "express";
import testController from "../controllers/test.controller";
import authController from "../controllers/auth.controller";

const api = Router()
.use(testController)
.use(authController);

export default Router().use("/api", api);