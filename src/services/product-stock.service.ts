import { ProductStockChangeReason } from './../commons/product-stock-change-reason.enum';
import createError from "http-errors";
import { ProductStockRequestDto, productStockSchema } from "./../dto/requests/product-stock-request.dto";
import { ProductStock } from '@prisma/client';

export const findAllProductStock = async () => {
  try {
    const productStock: ProductStock[] = await prisma.$queryRaw`
    SELECT ps.id, ps.product_name, ps.quantity
    FROM "ProductStock" AS ps
    INNER JOIN "Product" AS p
    ON ps.product_name = p.name
    WHERE p.discontinued = false
    ORDER BY ps.product_name
    `;
    return productStock;
  } catch (error) {
    throw new createError.BadRequest("Cannot get product stock with the given data.");
  }
}

export const updateProductStock = async (productStockDto: ProductStockRequestDto[], reason: string) => {
  try {
    const productStockData = [];
    for (const s of productStockDto) {
      try {
        const validatedStock = await productStockSchema.validateAsync(s);
        productStockData.push(validatedStock);
      } catch (validationError) {
        throw new createError.BadRequest(validationError.message);
      }
    }
    if (!Object.keys(ProductStockChangeReason).includes(reason)) {
      throw "Invalid reason";
    }

    return await prisma.$transaction(async (tx) => {
      const updatedResult = [];

      // 1. add change history
      const addedProductStockChangeHistory = await tx.productStockChangeHistory.create({
        data: {
          created_at: new Date(),
          reason: reason,
        }
      });

      // 2. update stock in product stock table
      for (const stock of productStockData) {
        const updatedProductStock = await tx.productStock.update({
          where: {
            id: stock.id
          },
          data: {
            quantity: stock.quantity,
            updated_at: new Date(),
          }
        });
        updatedResult.push(updatedProductStock);

        // 3. add stock change
        const addedProductStockChange = await tx.productStockChange.create({
          data: {
            stock_id: updatedProductStock.id,
            change_id: addedProductStockChangeHistory.id,
          }
        });
      }
      return updatedResult;
    });
  } catch (error) {
    throw new createError.BadRequest("Cannot update product stock with the given data.");
  }
}