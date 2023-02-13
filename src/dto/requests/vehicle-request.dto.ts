import Joi from "joi";
import { GENERAL_TEXT_REGEX } from "../../commons/constant";

export interface VehicleRequestDto {
  licensePlate: string;
  available: boolean;
  discontinued: boolean;
  nickname?: string;
  volume?: number;
}

export const vehicleSchema = Joi.object<VehicleRequestDto>({
  licensePlate: Joi.string()
    .trim()
    .required()
    .max(20)
    .regex(GENERAL_TEXT_REGEX, { invert: true }),
  available: Joi.boolean().required(),
  discontinued: Joi.boolean().required(),
  nickname: Joi.string()
    .allow("")
    .max(255)
    .regex(GENERAL_TEXT_REGEX, { invert: true }),
  volume: Joi.number().min(0),
});
