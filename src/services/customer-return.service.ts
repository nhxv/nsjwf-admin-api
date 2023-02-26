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
    const time = generateCurrentTime();
    const productReturns = notZero.map((productReturn) => ({
      product_name: productReturn.productName,
      return_id: productReturn.returnId,
      quantity: productReturn.quantity,
      unit_code: productReturn.unitCode,
      created_at: time,
    }));

    return await prisma.$transaction(async (tx) => {
      const existingSaleReturn = await tx.customerSaleReturn.findUnique({
        where: {
          sale_code: customerReturnData.orderCode,
        },
        include: {
          productCustomerSaleReturns: true,
        },
      });
      if (!existingSaleReturn) {
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
        const newProductSaleReturns = new Map();
        for (const productSold of orderSold.productCustomerOrders) {
          newProductSaleReturns.set(productSold.product_name, {
            product_name: productSold.product_name,
            quantity: productSold.quantity,
            unit_code: productSold.unit_code,
            unit_price: productSold.unit_price,
          });
        }
        for (const productReturn of productReturns) {
          const productOrderSold = newProductSaleReturns.get(
            productReturn.product_name
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
          newProductSaleReturns.set(productReturn.product_name, {
            ...newProductSaleReturns.get(productReturn.product_name),
            quantity: productSoldChange.toFraction(),
          });
        }
        // create sale return -- since this is the first return
        const newSaleReturn = await tx.customerSaleReturn.create({
          data: {
            sale_code: customerReturnData.orderCode,
            customer_name: customerReturnData.customerName,
            sold_at: orderSold.updated_at,
            productCustomerSaleReturns: {
              create: [...newProductSaleReturns.values()],
            },
          },
        });
      } else {
        // validate with existing sale returns -- this is not the first return
        const existingProductSaleReturns = new Map();
        for (const productSaleReturn of existingSaleReturn.productCustomerSaleReturns) {
          existingProductSaleReturns.set(productSaleReturn.product_name, {
            quantity: productSaleReturn.quantity,
            unit_code: productSaleReturn.unit_code,
            unit_price: productSaleReturn.unit_price,
          });
        }
        for (const productReturn of productReturns) {
          const productSaleReturn = existingProductSaleReturns.get(
            productReturn.product_name
          );
          if (!productSaleReturn) {
            throw `Invalid product data.`;
          }
          // find product return unit ratio
          const returnUnit = await tx.unit.findUniqueOrThrow({
            where: {
              code: productReturn.unit_code,
            },
          });
          // find product sale return unit ratio
          const saleUnit = await tx.unit.findUniqueOrThrow({
            where: {
              code: productSaleReturn.unit_code,
            },
          });
          const returnRatio = new Fraction(returnUnit.ratio);
          const saleRatio = new Fraction(saleUnit.ratio);
          const productReturnQuantity = returnRatio.mul(
            new Fraction(productReturn.quantity)
          );
          const productSaleReturnQuantity = saleRatio.mul(
            new Fraction(productSaleReturn.quantity)
          );
          const productSaleChange = productSaleReturnQuantity
            .sub(productReturnQuantity)
            .div(saleRatio);
          if (productSaleChange.compare(0) < 0) {
            throw `${productReturn.product_name}: Invalid product quantity or price.`;
          }

          // update product sale return quantity
          const updatedProductSaleReturn =
            await tx.productCustomerSaleReturn.update({
              where: {
                ProductCustomerSaleReturn_key: {
                  customer_sale_return_code: customerReturnData.orderCode,
                  product_name: productReturn.product_name,
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
          refund: new Prisma.Decimal(customerReturnData.refund).toPrecision(2),
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
