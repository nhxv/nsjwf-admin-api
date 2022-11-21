import createError from "http-errors";
import { ProductRequestDto, productSchema } from "../dto/requests/product-request.dto";
import prisma from "../../prisma/prisma-client";

export const findProductsByName = async (keyword: string) => {
  try {
    const products = await prisma.$queryRaw`
    SELECT * FROM "Product"
    WHERE name iLIKE ${`%${keyword}%`}
    ORDER BY id;
    `;
    return products;
  } catch (error) {
    throw new createError.BadRequest("Cannot find product with the given data");
  }
}

export const createProduct = async (productDto: ProductRequestDto) => {
  try {
    const productData: ProductRequestDto = await productSchema.validateAsync(productDto);
    const newProduct = await prisma.product.create({
      data: {
        name: productData.name,
        discontinued: productData.discontinued
      }
    });
    return newProduct;
  } catch (error) {
    throw new createError.BadRequest("Cannot add product with the given data");
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
    throw new createError.BadRequest("Cannot update product with the given data");
  }
}