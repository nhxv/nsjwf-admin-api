import Joi from "joi";

export class VehicleRequestDto {
  constructor(
    public licensePlate: string,
    public available: boolean,
    public discontinued: boolean,
    public nickname?: string,
    public volume?: number,
  ) {}
}

export const vehicleSchema = Joi.object<VehicleRequestDto>({
  licensePlate: Joi.string().trim().required().max(20).regex(/[^A-Za-z0-9 &\-'()]/, { invert: true }),
  available: Joi.boolean().required(),
  discontinued: Joi.boolean().required(),
  nickname: Joi.string().allow("").max(255).regex(/[^A-Za-z0-9 &\-'()]/, { invert: true }),
  volume: Joi.number().min(0),
});