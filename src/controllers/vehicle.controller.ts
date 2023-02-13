import { VehicleResponseDto } from "./../dto/responses/vehicle-response.dto";
import { NextFunction, Request, Response, Router } from "express";
import { hasAnyRole } from "../services/auth/authorization.service";
import { verifyAccessToken } from "./../services/auth/token.service";
import { Role } from "../commons/role.enum";
import {
  findVehiclesByName,
  createVehicle,
  updateVehicle,
} from "../services/vehicle.service";

const router = Router();

// find vehicles with data from vehicle table
router.get(
  `/vehicles/basic-search`,
  [verifyAccessToken, hasAnyRole([Role.MASTER, Role.ADMIN])],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await findVehiclesByName(req.query.keyword as string);
      res.send(
        response.map((vehicle) => {
          const vehicleRes: VehicleResponseDto = {
            licensePlate: vehicle.license_plate,
            available: vehicle.available,
            discontinued: vehicle.discontinued,
            id: vehicle.id,
            nickname: vehicle.nickname,
            volume: vehicle.volume,
          };
          return vehicleRes;
        })
      );
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
      res.send(response);
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
      res.send(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
