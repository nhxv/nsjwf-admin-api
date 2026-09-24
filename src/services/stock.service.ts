import Fraction from "fraction.js";
import createError from "http-errors";
import { StockChangeReason } from "../commons/enums/stock-change-reason.enum";
import { handleValidationError } from "../commons/http.exception";
import { generateCurrentTime } from "../commons/utils/time.util";
import { StockRequestDto, stockSchema } from "../dto/requests/stock-request.dto";

export const findStock = async () => {
  try {
    const products = await prisma.product.findMany({
      include: {
        stock: true,
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
      orderBy: {
        name: "asc",
      },
    });
    return products;
  } catch (error) {
    throw new createError.BadRequest("Cannot get stock with the given data.");
  }
};

// change stock manually
export const updateStock = async (stockDto: StockRequestDto[], reason: string) => {
  try {
    const stockData: StockRequestDto[] = [];
    // validate each product stock
    for (const s of stockDto) {
      try {
        const validatedStock = await stockSchema.validateAsync(s);
        stockData.push(validatedStock);
      } catch (error) {
        throw error;
      }
    }

    // validate reason
    if (
      !(Object.values(StockChangeReason) as string[]).includes(reason) ||
      reason === StockChangeReason.CUSTOMER_ORDER_COMPLETED ||
      reason === StockChangeReason.CUSTOMER_RETURN_RECEIVED ||
      reason === StockChangeReason.VENDOR_ORDER_COMPLETED ||
      reason === StockChangeReason.VENDOR_RETURN_RECEIVED ||
      reason === StockChangeReason.EMPLOYEE_BORROW
    ) {
      throw `Please don't hack us.`;
    }
    return await prisma.$transaction(async (tx) => {
      const time = generateCurrentTime();
      // 1. create stock change history
      const addedStockChangeHistory = await tx.stockChangeHistory.create({
        data: {
          created_at: time,
          reason: reason,
        },
      });
      let changeCount = 0;
      for (const stock of stockData) {
        // 2. get current stock
        const currentStock = await tx.stock.findUniqueOrThrow({
          where: {
            product_name: stock.productName,
          },
        });

        // 3. get unit ratio
        const unit = await tx.unit.findUniqueOrThrow({
          where: {
            code: stock.unitCode,
          },
        });
        const newRatio = new Fraction(unit.ratio);
        const newStockQuantity = newRatio.mul(stock.quantity);
        const currentStockQuantity = new Fraction(currentStock.quantity);
        const stockQuantityChange = newStockQuantity.sub(currentStockQuantity);

        // validate if there is change
        if (stockQuantityChange.equals(0)) {
          throw `No stock change in ${stock.productName}`;
        }

        // validate if quantity change make sense
        if (
          (reason === StockChangeReason.SELF_ADD && stockQuantityChange.compare(0) < 0) ||
          (reason === StockChangeReason.DAMAGED && stockQuantityChange.compare(0) > 0) ||
          (reason === StockChangeReason.SELF_USE && stockQuantityChange.compare(0) > 0)
        ) {
          throw `Change doesn't make sense with reason ${reason}.`;
        }
        // count change
        changeCount++;

        // 4. update stock
        const updatedStock = await tx.stock.update({
          where: {
            product_name: stock.productName,
          },
          data: {
            quantity: newStockQuantity.toFraction(),
            updated_at: time,
          },
        });

        // 5. add stock change
        const addedStockChange = await tx.stockChange.create({
          data: {
            stock_id: updatedStock.id,
            change_id: addedStockChangeHistory.id,
            quantity_change: stockQuantityChange.toFraction(),
          },
        });
      }
      if (changeCount === 0) {
        throw `Nothing ever changes.`;
      }
    });
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    if (error.details?.length > 0) {
      handleValidationError(error);
    }
    throw new createError.BadRequest("Cannot update stock with the given data.");
  }
};
