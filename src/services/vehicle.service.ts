import createError from "http-errors";
import prisma from "../../prisma/prisma-client";
import { VehicleRequestDto, vehicleSchema } from "../dto/requests/vehicle-request.dto";

export const findVehiclesByName = async (keyword: string) => {
  try {
    const vehicles: any[] = await prisma.$queryRaw`
    SELECT * FROM "Vehicle"
    WHERE license_plate iLIKE ${`%${keyword}%`}
    ORDER BY id;
    `;
    return vehicles;
  } catch (error) {
    throw new createError.BadRequest("Cannot find vehicle with the given data.");
  }
}

export const createVehicle = async (vehicleDto: VehicleRequestDto) => {
  try {
    const vehicleData: VehicleRequestDto = await vehicleSchema.validateAsync(vehicleDto);
    const newVehicle = await prisma.vehicle.create({
      data: {
        license_plate: vehicleData.licensePlate,
        available: vehicleData.available,
        discontinued: vehicleData.discontinued,
        nickname: vehicleData.nickname,
        volume: vehicleData.volume,
      }
    });
    return newVehicle;
  } catch (error) {
    throw new createError.BadRequest("Cannot add vehicle with the given data.");
  }
}

export const updateVehicle = async (vehicleDto: VehicleRequestDto, id: number) => {
  try {
    const vehicleData: VehicleRequestDto = await vehicleSchema.validateAsync(vehicleDto);
    const updatedVehicle = await prisma.vehicle.update({
      where: {
        id: id
      },
      data: {
        license_plate: vehicleData.licensePlate,
        available: vehicleData.available,
        discontinued: vehicleData.discontinued,
        nickname: vehicleData.nickname,
        volume: vehicleData.volume,
      }
    });
    return updatedVehicle;
  } catch (error) {
    throw new createError.BadRequest("Cannot update vehicle with the given data.");
  }
}