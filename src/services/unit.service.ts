import Fraction from "fraction.js";
import createError from "http-errors";
import { handleValidationError } from "../commons/http.exception";
import { generateCurrentTime } from "../commons/utils/time.util";
import { UnitRequestDto, unitSchema } from "../dto/requests/unit-request.dto";

export const createUnit = async (
  productId: number,
  unitRequestDto: UnitRequestDto
) => {
  try {
    const unitData: UnitRequestDto = await unitSchema.validateAsync(
      unitRequestDto
    );
    const unitName = unitData.name.split(" ").join("_").toUpperCase();
    if (unitName === "BOX") {
      throw `Box is the default unit.`;
    }
    if (!unitData.ratio.includes("/")) {
      throw `Incorrect ratio format.`;
    }
    const [numerator, denominator] = unitData.ratio.split("/");
    if (!numerator || !denominator) {
      throw `Incorrect ratio format.`;
    }
    if (parseInt(numerator) > parseInt(denominator)) {
      throw `Box is the largest unit.`;
    }
    if (parseInt(numerator) < 0 || parseInt(denominator) < 0) {
      throw `Ratio cannot be negative.`;
    }
    return await prisma.$transaction(async (tx) => {
      const time = generateCurrentTime();
      const product = await tx.product.findUniqueOrThrow({
        where: {
          id: productId,
        },
      });
      const addedUnit = await tx.unit.create({
        data: {
          code: `${product.id}_${unitName}`,
          name: unitName,
          ratio: new Fraction(unitData.ratio).toFraction(),
          product_name: product.name,
          discontinued: unitData.discontinued,
        },
      });
    });
  } catch (error) {
    if (error.details?.length > 0) {
      handleValidationError(error);
    }
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot add unit with the given data.");
  }
};

export const updateUnit = async (
  id: number,
  unitRequestDto: UnitRequestDto
) => {
  try {
    const unitData: UnitRequestDto = await unitSchema.validateAsync(
      unitRequestDto
    );
    const currentUnit = await prisma.unit.findUniqueOrThrow({
      where: {
        id: id,
      },
      include: {
        product: true,
      },
    });
    const unitName = unitData.name.split(" ").join("_").toUpperCase();
    if (unitName === "BOX") {
      throw `Box is the default unit.`;
    }
    const updatedUnit = await prisma.unit.update({
      where: {
        id: id,
      },
      data: {
        code: `${currentUnit.product.id}_${unitName}`,
        name: unitName,
        discontinued: unitData.discontinued,
      },
    });
    return updatedUnit;
  } catch (error) {
    if (error.details?.length > 0) {
      handleValidationError(error);
    }
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot update unit with the given data.");
  }
};
