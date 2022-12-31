import { generateCurrentTime } from "./../commons/time.util";
import { ProductStockChangeReason } from "./../commons/product-stock-change-reason.enum";
import createError from "http-errors";
import { ProductStockRequestDto, productStockSchema } from "./../dto/requests/product-stock-request.dto";
import { ProductStock } from "@prisma/client";

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

// change stock manually
export const updateProductStock = async (productStockDto: ProductStockRequestDto[], reason: string) => {
  try {
    const productStockData = [];
    // validate each product stock
    for (const s of productStockDto) {
      try {
        const validatedStock = await productStockSchema.validateAsync(s);
        productStockData.push(validatedStock);
      } catch (validationError) {
        throw `Funny negativity.`;
      }
    }

    // validate reason
    if (
      !(Object.values(ProductStockChangeReason) as string[]).includes(reason) ||
      reason === ProductStockChangeReason.CUSTOMER_ORDER_CREATE ||
      reason === ProductStockChangeReason.CUSTOMER_ORDER_EDIT ||
      reason === ProductStockChangeReason.CUSTOMER_RETURN_RECEIVED ||
      reason === ProductStockChangeReason.VENDOR_ORDER_COMPLETED ||
      reason === ProductStockChangeReason.VENDOR_RETURN_RECEIVED ||
      reason === ProductStockChangeReason.EMPLOYEE_BORROW
    ) {
      throw `Please don't hack us.`;
    }
    const time = generateCurrentTime();
    return await prisma.$transaction(async (tx) => {
      const updatedResult = [];
      // 1. create product stock change history
      const addedProductStockChangeHistory = await tx.productStockChangeHistory.create({
        data: {
          created_at: time,
          reason: reason,
        }
      });

      for (const stock of productStockData) {
        // 2. compare current stock with new stock
        const currentProductStock = await tx.productStock.findUniqueOrThrow({
          where: {
            id: stock.id
          },
        });
        const stockQuantityChange = stock.quantity - currentProductStock.quantity;
        if (stockQuantityChange === 0) {
          continue;
        }

        // validate if quantity change make sense
        if (
          reason === ProductStockChangeReason.SELF_CREATE && stockQuantityChange < 0 ||
          reason === ProductStockChangeReason.DAMAGED && stockQuantityChange > 0
        ) {
          throw `Change doesn't make sense with reason ${reason}.`;
        }

        // 3. update stock in product stock table
        const updatedProductStock = await tx.productStock.update({
          where: {
            id: stock.id
          },
          data: {
            quantity: {
              increment: stockQuantityChange,
            },
            updated_at: time,
          }
        });
        updatedResult.push(updatedProductStock);

        // 4. add stock change
        const addedProductStockChange = await tx.productStockChange.create({
          data: {
            stock_id: updatedProductStock.id,
            change_id: addedProductStockChangeHistory.id,
            quantity_change: stockQuantityChange,
          }
        });
      }
      return updatedResult;
    });
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot update product stock with the given data.");
  }
}