import { NextFunction, Request, Response, Router } from "express";
import { hasAnyRole } from "../services/auth/authorization.service";
import { verifyAccessToken } from "./../services/auth/token.service";
import { Role } from "../commons/role.enum";
import { findVehiclesByName, createVehicle, updateVehicle } from "../services/vehicle.service";
import { VehicleResponseDto } from "../dto/responses/vehicle-response.dto";

const router = Router();

// find vehicles with data from vehicle table
router.get(
  `/vehicles/basic-search`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findVehiclesByName(req.query.keyword as string);
      res.send(response.map((vehicle) => {
        return new VehicleResponseDto(
          vehicle.license_plate,
          vehicle.available,
          vehicle.discontinued,
          vehicle.id,
          vehicle.nickname,
          vehicle.volume,
        )
      }));
    } catch (error) {
      next(error);
    }
  }
);

// add vehicle
router.post(
  `/vehicles`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await createVehicle(req.body);
      res.send(new VehicleResponseDto(
        response.license_plate,
        response.available,
        response.discontinued,
        response.id,
        response.nickname,
        response.volume,
      ));
    } catch (error) {
      next(error);
    }
  } 
);

// update vehicle by id
router.put(
  `/vehicles/:id`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await updateVehicle(req.body, +req.params.id);
      res.send(new VehicleResponseDto(
        response.license_plate,
        response.available,
        response.discontinued,
        response.id,
        response.nickname,
        response.volume,
      ));
    } catch (error) {
      next(error);
    }
  } 
);

export default router;