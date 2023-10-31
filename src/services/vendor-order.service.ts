import { Prisma } from "@prisma/client";
import Fraction from "fraction.js";
import createError from "http-errors";
import prisma from "../../prisma/prisma-client";
import { OrderStatus } from "../commons/enums/order-status.enum";
import { handleValidationError } from "../commons/http.exception";
import { generateCode } from "../commons/utils/code.util";
import { StockChangeReason } from "./../commons/enums/stock-change-reason.enum";
import {
  convertLocalExpected,
  convertLocalInterval,
  convertLocalStart,
  generateCurrentTime,
} from "./../commons/utils/time.util";
import {
  VendorOrderRequestDto,
  vendorOrderSchema,
} from "./../dto/requests/vendor-order-request.dto";

export const findVendorOrderByStatus = async (status: string) => {
  try {
    if (!(Object.values(OrderStatus) as string[]).includes(status)) {
      throw `Please don't attack us.`;
    }
    const vendorOrders = await prisma.vendorOrder.findMany({
      where: {
        status: status,
        OR: [
          {
            expected_at: {
              gte: convertLocalStart(),
            },
          },
          {
            NOT: {
              status: OrderStatus.COMPLETED,
            },
          },
        ],
      },
      include: {
        productVendorOrders: {
          orderBy: {
            product_name: "asc",
          },
        },
      },
      orderBy: {
        expected_at: "asc",
      },
    });
    return vendorOrders;
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest(
      "Cannot find vendor order with the given status."
    );
  }
};

export const findVendorOrderByCode = async (code: string) => {
  try {
    const vendorOrder = await prisma.vendorOrder.findUniqueOrThrow({
      where: {
        code: code,
      },
      include: {
        productVendorOrders: {
          orderBy: {
            product_name: "asc",
          },
        },
      },
    });
    return vendorOrder;
  } catch (error) {
    throw new createError.BadRequest(
      "Cannot find vendor order with the given code."
    );
  }
};

export const findVendorSale = async (vendorName: string, date: string) => {
  try {
    const { start, end } = convertLocalInterval(new Date(date));
    const vendorSolds = await prisma.vendorOrder.findMany({
      where: {
        vendor_name: {
          contains: vendorName,
          mode: "insensitive",
        },
        status: OrderStatus.COMPLETED,
        updated_at: {
          gte: start,
          lte: end,
        },
      },
      include: {
        productVendorOrders: {
          orderBy: {
            product_name: "asc",
          },
        },
      },
      orderBy: {
        updated_at: "asc",
      },
    });
    for (let i = 0; i < vendorSolds.length; i++) {
      const returnRemain = await prisma.vendorReturnRemain.findUnique({
        where: {
          order_code: vendorSolds[i].code,
        },
        include: {
          productVendorReturnRemains: true,
        },
      });
      if (
        !returnRemain ||
        returnRemain.productVendorReturnRemains.find(
          (p) => !new Fraction(p.quantity).equals(0)
        )
      ) {
        vendorSolds[i]["fullReturn"] = false;
      } else {
        vendorSolds[i]["fullReturn"] = true;
      }
    }
    return vendorSolds;
  } catch (error) {
    throw new createError.BadRequest(
      "Cannot find vendor sale with the given data."
    );
  }
};

export const createVendorOrder = async (
  vendorOrderDto: VendorOrderRequestDto
) => {
  try {
    const vendorOrderData: VendorOrderRequestDto =
      await vendorOrderSchema.validateAsync(vendorOrderDto);
    if (
      !(Object.values(OrderStatus) as string[]).includes(vendorOrderData.status)
    ) {
      throw `Please don't attack us.`;
    }
    // Validate unique unit code
    const unitCodes = new Set();
    for (const po of vendorOrderData.productVendorOrders) {
      if (unitCodes.has(po.unitCode)) {
        throw `Duplicated ${po.unitCode}.`;
      } else {
        unitCodes.add(po.unitCode);
      }
    }
    const { code, time } = generateCode();
    const productOrders = vendorOrderData.productVendorOrders.map(
      (productOrder) => ({
        product_name: productOrder.productName,
        order_code: productOrder.orderCode,
        quantity: productOrder.quantity,
        unit_code: productOrder.unitCode,
        unit_price: new Prisma.Decimal(productOrder.unitPrice.toFixed(2)),
        created_at: time,
        updated_at: time,
      })
    );

    return await prisma.$transaction(async (tx) => {
      const isCompleted = vendorOrderData.status === OrderStatus.COMPLETED;

      if (isCompleted) {
        // check for valid unit price when complete order
        for (const po of productOrders) {
          if (po.unit_price.comparedTo(0) < 0) {
            throw `Price needs to be at least 0.`;
          }
        }

        // 1. create stock change history
        const addedStockChangeHistory = await tx.stockChangeHistory.create({
          data: {
            created_at: time,
            reason: StockChangeReason.VENDOR_ORDER_COMPLETED,
            order_code: code,
          },
        });

        for (const productOrder of productOrders) {
          // 2. get current stock
          const currentStock = await tx.stock.findUniqueOrThrow({
            where: {
              product_name: productOrder.product_name,
            },
          });

          // 3. get unit ratio
          const unit = await tx.unit.findUniqueOrThrow({
            where: {
              code: productOrder.unit_code,
            },
          });
          const newRatio = new Fraction(unit.ratio);
          const productOrderQuantity = newRatio.mul(
            new Fraction(productOrder.quantity)
          );
          const currentStockQuantity = new Fraction(currentStock.quantity);
          const newStockQuantity =
            currentStockQuantity.add(productOrderQuantity);
          const stockQuantityChange =
            newStockQuantity.sub(currentStockQuantity);

          // 4. update stock
          const updatedStock = await tx.stock.update({
            where: {
              product_name: productOrder.product_name,
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

          // update product recent cost reminder
          const updatedProductRecentCost = await tx.product.update({
            where: {
              name: productOrder.product_name,
            },
            data: {
              recent_cost: productOrder.unit_price,
            },
          });
        }
      }

      // create new order
      const newVendorOrder = await tx.vendorOrder.create({
        data: {
          code: code,
          vendor_name: vendorOrderData.vendorName,
          status: vendorOrderData.status,
          created_at: time,
          updated_at: time,
          expected_at: convertLocalExpected(vendorOrderData.expectedAt),
          is_test: vendorOrderData.isTest,
          is_sold: isCompleted,
          productVendorOrders: {
            create: productOrders,
          },
        },
      });
      return newVendorOrder;
    });
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    if (error.details?.length > 0) {
      handleValidationError(error);
    }
    throw new createError.BadRequest(
      "Cannot add vendor order with the given data."
    );
  }
};

export const updateVendorOrder = async (
  code: string,
  vendorOrderDto: VendorOrderRequestDto
) => {
  try {
    // Validate
    const vendorOrderData: VendorOrderRequestDto =
      await vendorOrderSchema.validateAsync(vendorOrderDto);
    if (
      !(Object.values(OrderStatus) as string[]).includes(vendorOrderData.status)
    ) {
      throw `Please don't attack us.`;
    }
    if (vendorOrderData.code !== code) {
      throw `Please don't attack us.`;
    }
    // Validate unique unit code
    const unitCodes = new Set();
    for (const po of vendorOrderData.productVendorOrders) {
      if (unitCodes.has(po.unitCode)) {
        throw `Duplicated ${po.unitCode}.`;
      } else {
        unitCodes.add(po.unitCode);
      }
    }
    const time = generateCurrentTime();
    const productOrders = vendorOrderData.productVendorOrders.map(
      (productOrder) => ({
        product_name: productOrder.productName,
        quantity: productOrder.quantity,
        unit_code: productOrder.unitCode,
        unit_price: new Prisma.Decimal(productOrder.unitPrice.toFixed(2)),
        order_code: vendorOrderData.code,
        updated_at: time,
      })
    );
    return await prisma.$transaction(async (tx) => {
      const isCompleted = vendorOrderData.status === OrderStatus.COMPLETED;

      // update vendor order table if that order IS NOT completed already
      let existingOrder;
      try {
        existingOrder = await tx.vendorOrder.update({
          where: {
            VendorOrderSold_key: {
              code: vendorOrderData.code,
              is_sold: false,
            },
          },
          include: {
            productVendorOrders: true,
          },
          data: {
            vendor_name: vendorOrderData.vendorName,
            status: vendorOrderData.status,
            updated_at: time,
            expected_at: convertLocalExpected(vendorOrderData.expectedAt),
            is_test: vendorOrderData.isTest,
            is_sold: isCompleted,
          },
        });
      } catch (e) {
        throw `This order cannot be changed.`;
      }

      // delete product order not found in request
      for (const productOrder of existingOrder.productVendorOrders) {
        const found = productOrders.find(
          (po) => po.product_name === productOrder.product_name
        );
        if (!found) {
          const deletedProductOrder = await tx.productVendorOrder.delete({
            where: {
              ProductVendorOrder_key: {
                product_name: productOrder.product_name,
                order_code: productOrder.order_code,
              },
            },
          });
        }
      }

      let addedStockChangeHistory;
      if (isCompleted) {
        // 1. create stock change history only if order is completed
        addedStockChangeHistory = await tx.stockChangeHistory.create({
          data: {
            created_at: time,
            reason: StockChangeReason.VENDOR_ORDER_COMPLETED,
            order_code: code,
          },
        });
      }

      for (const productOrder of productOrders) {
        if (isCompleted) {
          // validate unit price when completing order
          if (productOrder.unit_price.comparedTo(0) < 0) {
            throw `Price needs to be at least 0.`;
          }

          // 2. get current stock
          const currentStock = await tx.stock.findUniqueOrThrow({
            where: {
              product_name: productOrder.product_name,
            },
          });

          // 3. get unit ratio
          const unit = await tx.unit.findUniqueOrThrow({
            where: {
              code: productOrder.unit_code,
            },
          });
          const newRatio = new Fraction(unit.ratio);
          const productOrderQuantity = newRatio.mul(
            new Fraction(productOrder.quantity)
          );
          const currentStockQuantity = new Fraction(currentStock.quantity);
          const newStockQuantity =
            currentStockQuantity.add(productOrderQuantity);
          const stockQuantityChange =
            newStockQuantity.sub(currentStockQuantity);

          // 4. update stock
          const updatedStock = await tx.stock.update({
            where: {
              product_name: productOrder.product_name,
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

          // update product recent cost reminder
          const updatedProductRecentCost = await tx.product.update({
            where: {
              name: productOrder.product_name,
            },
            data: {
              recent_cost: productOrder.unit_price,
            },
          });
        }

        // upsert product vendor order
        const updatedProductOrder = await tx.productVendorOrder.upsert({
          where: {
            ProductVendorOrder_key: {
              product_name: productOrder.product_name,
              order_code: productOrder.order_code,
            },
          },
          update: {
            quantity: productOrder.quantity,
            unit_price: productOrder.unit_price,
            updated_at: productOrder.updated_at,
          },
          create: {
            product_name: productOrder.product_name,
            order_code: productOrder.order_code,
            quantity: productOrder.quantity,
            unit_code: productOrder.unit_code,
            unit_price: productOrder.unit_price,
            created_at: time,
            updated_at: time,
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
      "Cannot update vendor order with the given data."
    );
  }
};
