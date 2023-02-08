import createError from "http-errors";
import prisma from "../../prisma/prisma-client";
import { ProductRequestDto, productSchema } from "../dto/requests/product-request.dto";
import { generateCurrentTime } from "./../commons/time.util";
import { handleValidationError } from "../commons/http.exception";

export const findActiveProducts = async () => {
  try {
    const products = await prisma.product.findMany({
      where: {
        discontinued: false,
      },
      orderBy: {
        name: "asc"
      }
    });
    return products;
  } catch (error) {
    throw new createError.BadRequest("Cannot find products.");
  }
}

export const findProductsByName = async (keyword: string) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        name: {
          contains: keyword,
          mode: "insensitive",
        }
      },
      orderBy: {
        name: "asc",
      }
    });
    return products;
  } catch (error) {
    throw new createError.BadRequest("Cannot find product with the given data.");
  }
}

export const createProduct = async (productDto: ProductRequestDto) => {
  try {
    const productData: ProductRequestDto = await productSchema.validateAsync(productDto);
    return await prisma.$transaction(async (tx) => {
      const time = generateCurrentTime();
      
      // 1. create product
      const addedProduct = await tx.product.create({
        data: {
          name: productData.name,
          discontinued: productData.discontinued
        }
      });

      // 2. create product stock
      const addedProductStock = await tx.productStock.create({
        data: {
          product_name: productData.name,
          quantity: 0,
          created_at: time,
          updated_at: time,
        }
      });
    })
  } catch (error) {
    if (error.details?.length > 0) {
      handleValidationError(error);
    }
    throw new createError.BadRequest("Cannot add product with the given data.");
  }
}

export const updateProduct = async (productDto: ProductRequestDto, id: number) => {
  try {
    const productData: ProductRequestDto = await productSchema.validateAsync(productDto);
    const updatedProduct = await prisma.product.update({
      where: {
        id: id
      },
      data: {
        name: productData.name,
        discontinued: productData.discontinued
      }
    });
    return updatedProduct;
  } catch (error) {
    if (error.details?.length > 0) {
      handleValidationError(error);
    }
    throw new createError.BadRequest("Cannot update product with the given data.");
  }
}