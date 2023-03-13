import Joi from "joi";
import { GENERAL_TEXT_REGEX } from "../../commons/constant";

export interface EmployeeRequestDto {
  username?: string;
  password?: string;
  nickname?: string;
  active: boolean;
}

export const employeeSchema = Joi.object<EmployeeRequestDto>({
  username: Joi.string()
    .max(32)
    .regex(/[$\(\)<>]/, { invert: true }),
  password: Joi.string().regex(/[$\(\)<>]/, { invert: true }),
  nickname: Joi.string()
    .trim()
    .max(255)
    .regex(GENERAL_TEXT_REGEX, { invert: true }),
  active: Joi.boolean().required(),
});
