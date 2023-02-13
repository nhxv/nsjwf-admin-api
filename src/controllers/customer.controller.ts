import { NextFunction, Request, Response, Router } from "express";
import { Role } from "../commons/role.enum";
import { hasAnyRole } from "../services/auth/authorization.service";
import { createCustomer, findActiveCustomers, findAllCustomers, findCustomerById, findCustomersByName, findCustomerTendencyByName, updateCustomer } from "../services/customer.service";
import { verifyAccessToken } from "./../services/auth/token.service";

const router = Router();

// find all customers
router.get(
  `/customers/all`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findAllCustomers();
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// find active customers
router.get(
  `/customers/active`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findActiveCustomers();
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// find active by id
router.get(
  `/customers/active/:id`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findCustomerById(+req.params.id);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// find customers with data from customer table
router.get(
  `/customers/basic-search`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findCustomersByName(req.query.keyword as string);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  `/customers/tendency/:name`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findCustomerTendencyByName(req.params.name);
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

// add customer
router.post(
  `/customers`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await createCustomer(req.body);
      res.send(response);
    } catch (error) {
      next(error);
    }
  } 
);

// update customer by id
router.put(
  `/customers/:id`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await updateCustomer(req.body, +req.params.id);
      res.send(response);
    } catch (error) {
      next(error);
    }
  } 
);

export default router;