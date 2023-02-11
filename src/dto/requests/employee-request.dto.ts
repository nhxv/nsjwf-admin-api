import Joi from "joi";
import { GENERAL_TEXT_REGEX } from "../../commons/constant";

export interface EmployeeRequestDto {
  nickname: string,
  active: boolean,
}

export const employeeSchema = Joi.object<EmployeeRequestDto>({
  nickname: Joi.string().trim().required().max(255).regex(GENERAL_TEXT_REGEX, { invert: true }),
  active: Joi.boolean().required(),
});