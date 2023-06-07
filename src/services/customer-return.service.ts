import { Prisma } from "@prisma/client";
import Fraction from "fraction.js";
import createError from "http-errors";
import { OrderStatus } from "../commons/enums/order-status.enum";
import { StockChangeReason } from "../commons/enums/stock-change-reason.enum";
import { handleValidationError } from "../commons/http.exception";
import { generateCurrentTime } from "../commons/utils/time.util";
import {
  CustomerReturnRequestDto,
  customerReturnSchema,
} from "../dto/requests/customer-return-request.dto";
import { convertLocalStart } from "./../commons/utils/time.util";

export const findCustomerReturns = async () => {
  try {
    const customerReturns = await prisma.customerReturn.findMany({
      where: {
        created_at: {
          gte: convertLocalStart(),
        },
      },
      include: {
        productCustomerReturns: {
          orderBy: {
            product_name: "asc",
          },
        },
      },
      orderBy: {
        created_at: "asc",
      },
    });
    return customerReturns;
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest(
      "Cannot find customer return with the given status."
    );
  }
};

export const createCustomerReturn = async (
  customerReturnRequestDto: CustomerReturnRequestDto
) => {
  try {
    // Validate customer return
    const customerReturnData: CustomerReturnRequestDto =
      await customerReturnSchema.validateAsync(customerReturnRequestDto);
    const notZero = customerReturnData.productCustomerReturns.filter(
      (pr) => pr.quantity > 0
    );
    if (notZero.length < 1) {
      throw `Hollow return.`;
    }
    // Validate unique unit code
    const unitCodes = new Set();
    for (const pr of customerReturnData.productCustomerReturns) {
      if (unitCodes.has(pr.unitCode)) {
        throw `Duplicated ${pr.unitCode}`;
      } else {
        unitCodes.add(pr.unitCode);
      }
    }
    const time = generateCurrentTime();
    const productReturns = notZero.map((productReturn) => ({
      product_name: productReturn.productName,
      return_id: productReturn.returnId,
      quantity: productReturn.quantity,
      unit_code: productReturn.unitCode,
      created_at: time,
    }));

    return await prisma.$transaction(async (tx) => {
      const existingReturnRemain = await tx.customerReturnRemain.findUnique({
        where: {
          order_code: customerReturnData.orderCode,
        },
        include: {
          productCustomerReturnRemains: true,
        },
      });
      if (!existingReturnRemain) {
        // validate with order sold -- this is the first return
        const orderSold = await tx.customerOrder.findUniqueOrThrow({
          where: {
            CustomerOrderSold_key: {
              code: customerReturnData.orderCode,
              is_sold: true,
            },
          },
          include: {
            productCustomerOrders: true,
          },
        });
        if (orderSold.status !== OrderStatus.COMPLETED) {
          return `Please don't hack us.`;
        }
        const newProductReturnRemains = new Map();
        for (const productSold of orderSold.productCustomerOrders) {
          // In the for loop after this, we iterate over productReturns to convert this qty field into a fraction/string field.
          // However, productReturns only contains products that are being returned, while productCustomerOrders
          // has ALL products in an order. So it is possible that a return doesn't return all products, 
          // maybe just one out of 2 different products. This will remain Integer so can't insert to return table.
          // The fix here is to convert qty to String by default.
          newProductReturnRemains.set(productSold.unit_code, {
            product_name: productSold.product_name,
            quantity: productSold.quantity.toString(),
            unit_code: productSold.unit_code,
            unit_price: productSold.unit_price,
          });
        }
        for (const productReturn of productReturns) {
          const productOrderSold = newProductReturnRemains.get(
            productReturn.unit_code
          );
          if (!productOrderSold) {
            throw `Invalid product data.`;
          }
          // find product return unit ratio
          const returnUnit = await tx.unit.findUniqueOrThrow({
            where: {
              code: productReturn.unit_code,
            },
          });
          // find product order sold unit ratio
          const soldUnit = await tx.unit.findUniqueOrThrow({
            where: {
              code: productOrderSold.unit_code,
            },
          });
          const returnRatio = new Fraction(returnUnit.ratio);
          const soldRatio = new Fraction(soldUnit.ratio);
          const productReturnQuantity = returnRatio.mul(
            new Fraction(productReturn.quantity)
          );
          const productOrderSoldQuantity = soldRatio.mul(
            new Fraction(productOrderSold.quantity)
          );
          const productSoldChange = productOrderSoldQuantity
            .sub(productReturnQuantity)
            .div(soldRatio);
          if (productSoldChange.compare(0) < 0) {
            throw `${productReturn.product_name}: Invalid product quantity or price.`;
          }
          newProductReturnRemains.set(productReturn.unit_code, {
            ...newProductReturnRemains.get(productReturn.unit_code),
            quantity: productSoldChange.toFraction(),
          });
        }
        // create return remain -- since this is the first return
        const newReturnRemain = await tx.customerReturnRemain.create({
          data: {
            order_code: customerReturnData.orderCode,
            customer_name: customerReturnData.customerName,
            sold_at: orderSold.updated_at,
            productCustomerReturnRemains: {
              create: [...newProductReturnRemains.values()],
            },
          },
        });
      } else {
        // validate with existing return remain -- this is not the first return
        const existingProductReturnRemains = new Map();
        for (const productReturnRemain of existingReturnRemain.productCustomerReturnRemains) {
          existingProductReturnRemains.set(productReturnRemain.unit_code, {
            quantity: productReturnRemain.quantity,
            unit_code: productReturnRemain.unit_code,
            unit_price: productReturnRemain.unit_price,
          });
        }
        for (const productReturn of productReturns) {
          const productReturnRemain = existingProductReturnRemains.get(
            productReturn.unit_code
          );
          if (!productReturnRemain) {
            throw `Invalid product data.`;
          }
          // find product return unit ratio
          const returnUnit = await tx.unit.findUniqueOrThrow({
            where: {
              code: productReturn.unit_code,
            },
          });
          // find product return remain unit ratio
          const remainUnit = await tx.unit.findUniqueOrThrow({
            where: {
              code: productReturnRemain.unit_code,
            },
          });
          const returnRatio = new Fraction(returnUnit.ratio);
          const remainRatio = new Fraction(remainUnit.ratio);
          const productReturnQuantity = returnRatio.mul(
            new Fraction(productReturn.quantity)
          );
          const productReturnRemainQuantity = remainRatio.mul(
            new Fraction(productReturnRemain.quantity)
          );
          const productSaleChange = productReturnRemainQuantity
            .sub(productReturnQuantity)
            .div(remainRatio);
          if (productSaleChange.compare(0) < 0) {
            throw `${productReturn.product_name}: Invalid product quantity or price.`;
          }

          // update product return remain quantity
          const updatedProductReturnRemain =
            await tx.productCustomerReturnRemain.update({
              where: {
                ProductCustomerReturnRemain_key: {
                  customer_return_remain_code: customerReturnData.orderCode,
                  unit_code: productReturn.unit_code,
                },
              },
              data: {
                quantity: productSaleChange.toFraction(),
              },
            });
        }
      }

      // create return
      const newCustomerReturn = await tx.customerReturn.create({
        data: {
          customer_name: customerReturnData.customerName,
          order_code: customerReturnData.orderCode,
          created_at: time,
          refund: new Prisma.Decimal(customerReturnData.refund.toFixed(2)),
          productCustomerReturns: {
            create: productReturns,
          },
        },
      });

      // 1. create stock change history
      const addedStockChangeHistory = await tx.stockChangeHistory.create({
        data: {
          created_at: time,
          reason: StockChangeReason.CUSTOMER_RETURN_RECEIVED,
        },
      });

      for (const productReturn of productReturns) {
        // 2. get current stock
        const currentStock = await tx.stock.findUniqueOrThrow({
          where: {
            product_name: productReturn.product_name,
          },
        });

        // 3. get unit ratio
        const unit = await tx.unit.findUniqueOrThrow({
          where: {
            code: productReturn.unit_code,
          },
        });
        const newRatio = new Fraction(unit.ratio);
        const productReturnQuantity = newRatio.mul(
          new Fraction(productReturn.quantity)
        );
        const currentStockQuantity = new Fraction(currentStock.quantity);
        const newStockQuantity = currentStockQuantity.add(
          productReturnQuantity
        );
        const stockQuantityChange = newStockQuantity.sub(currentStockQuantity);

        // 4. update stock
        const updatedStock = await tx.stock.update({
          where: {
            product_name: productReturn.product_name,
          },
          data: {
            quantity: newStockQuantity.toFraction(),
            updated_at: time,
          },
        });

        // 5. create stock change
        const addedStockChange = await tx.stockChange.create({
          data: {
            stock_id: updatedStock.id,
            change_id: addedStockChangeHistory.id,
            quantity_change: stockQuantityChange.toFraction(),
          },
        });
      }
    });
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    if (error.details?.length > 0) {
      handleValidationError(error);
    }
    throw new createError.BadRequest(
      "Cannot create customer return with the given data."
    );
  }
};
