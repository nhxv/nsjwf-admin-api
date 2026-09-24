import Joi from "joi";
import { GENERAL_TEXT_REGEX, FRACTION_REGEX } from "../../commons/constant";

export interface UnitRequestDto {
  name: string;
  ratio?: string;
  discontinued: boolean;
}

export const unitSchema = Joi.object<UnitRequestDto>({
  name: Joi.string().trim().required().max(10).regex(GENERAL_TEXT_REGEX, { invert: true }),
  ratio: Joi.string().trim().max(6).regex(FRACTION_REGEX),
  discontinued: Joi.boolean().required(),
});
