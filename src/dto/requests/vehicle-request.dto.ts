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
  licensePlate: Joi.string().trim().required().max(20).regex(/[$\(\)<>]/, { invert: true }),
  available: Joi.boolean().required(),
  discontinued: Joi.boolean().required(),
  nickname: Joi.string().allow("").max(255).regex(/[$\(\)<>]/, { invert: true }),
  volume: Joi.number().min(0),
});