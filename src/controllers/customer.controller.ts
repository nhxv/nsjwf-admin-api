import { NextFunction, Request, Response, Router } from "express";
import { hasAnyRole } from "../services/auth/authorization.service";
import { verifyAccessToken } from "./../services/auth/token.service";
import { Role } from "../commons/role.enum";
import { findCustomersByName, createCustomer, updateCustomer } from "../services/customer.service";
import { CustomerResponseDto } from "../dto/responses/customer-response.dto";

const router = Router();

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

// add customer
router.post(
  `/customers`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await createCustomer(req.body);
      res.send(new CustomerResponseDto(
        response.name,
        response.discontinued,
        response.id,
        response.address,
        response.phone,
        response.email,
        response.presentative,
      ));
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
      res.send(new CustomerResponseDto(
        response.name,
        response.discontinued,
        response.id,
        response.address,
        response.phone,
        response.email,
        response.presentative,
      ));
    } catch (error) {
      next(error);
    }
  } 
);

export default router;