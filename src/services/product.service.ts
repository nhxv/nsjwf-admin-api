import createError from "http-errors";
import prisma from "../../prisma/prisma-client";
import { Location } from "../commons/enums/location.enum";
import { handleValidationError } from "../commons/http.exception";
import {
  ProductRequestDto,
  productSchema,
} from "../dto/requests/product-request.dto";
import { generateCurrentTime } from "./../commons/utils/time.util";

export const findAllProducts = async () => {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return products;
  } catch (error) {
    throw new createError.BadRequest("Cannot find products.");
  }
};

export const findActiveProducts = async () => {
  try {
    const products = await prisma.product.findMany({
      where: {
        discontinued: false,
      },
      orderBy: {
        name: "asc",
      },
      include: {
        units: {
          where: {
            discontinued: false,
          },
          select: {
            code: true,
          },
          orderBy: {
            code: "asc",
          },
        },
      },
    });
    return products;
  } catch (error) {
    throw new createError.BadRequest("Cannot find products.");
  }
};

export const findProductById = async (id: number) => {
  try {
    const product = await prisma.product.findUniqueOrThrow({
      where: {
        id: id,
      },
      include: {
        units: {
          where: {
            NOT: {
              name: "BOX",
            },
          },
          orderBy: {
            name: "asc",
          },
        },
      },
    });
    return product;
  } catch (error) {
    throw new createError.BadRequest("Cannot find product with the given id.");
  }
};

export const createProduct = async (productDto: ProductRequestDto) => {
  try {
    const productData: ProductRequestDto = await productSchema.validateAsync(
      productDto
    );
    return await prisma.$transaction(async (tx) => {
      const time = generateCurrentTime();

      // 1. create product
      const addedProduct = await tx.product.create({
        data: {
          name: productData.name,
          location_name: productData.location
            ? productData.location
            : Location.COOLER_1,
          discontinued: productData.discontinued,
        },
      });

      // 2. create box unit
      const defaultUnit = "BOX";
      const defaultRatio = "1/1";
      const addedUnit = await tx.unit.create({
        data: {
          name: defaultUnit,
          code: `${addedProduct.id}_${defaultUnit}`,
          product_name: addedProduct.name,
          ratio: defaultRatio,
          discontinued: false,
        },
      });

      // 3. create stock for box unit
      const addedStock = await tx.stock.create({
        data: {
          product_name: productData.name,
          quantity: "0",
          created_at: time,
          updated_at: time,
        },
      });
    });
  } catch (error) {
    if (error.details?.length > 0) {
      handleValidationError(error);
    }
    throw new createError.BadRequest("Cannot add product with the given data.");
  }
};

export const updateProduct = async (
  productDto: ProductRequestDto,
  id: number
) => {
  try {
    const productData: ProductRequestDto = await productSchema.validateAsync(
      productDto
    );
    const updatedProduct = await prisma.product.update({
      where: {
        id: id,
      },
      data: {
        name: productData.name,
        location_name: productData.location
          ? productData.location
          : Location.COOLER_1,
        discontinued: productData.discontinued,
      },
    });
  } catch (error) {
    if (error.details?.length > 0) {
      handleValidationError(error);
    }
    throw new createError.BadRequest(
      "Cannot update product with the given data."
    );
  }
};
