import { Prisma } from "@prisma/client";
import Fraction from "fraction.js";
import createError from "http-errors";
import prisma from "../../prisma/prisma-client";
import { OrderStatus } from "../commons/enums/order-status.enum";
import { PaymentStatus } from "../commons/enums/payment-status.enum";
import { handleValidationError } from "../commons/http.exception";
import { generateCode } from "../commons/utils/code.util";
import {
  VendorSaleRequestDto,
  vendorSaleSchema,
} from "../dto/requests/vendor-sale-request.dto";
import { StockChangeReason } from "./../commons/enums/stock-change-reason.enum";
import {
  convertLocalExpected,
  convertLocalInterval,
  generateCurrentTime,
} from "./../commons/utils/time.util";
import {
  VendorOrderRequestDto,
  vendorOrderSchema,
} from "./../dto/requests/vendor-order-request.dto";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import fsPromise from "fs/promises";
import path from "node:path";

// There are roughly 50 orders a week.
// 50 (order/week) * 52 (week/yr) = 2500. Round to 3000 just in case.
// If we somehow need further than 1 year, at that point, just go to db itself and find it.
const MAX_ORDER_COUNT = 3000;

export const findDailyVendorOrder = async () => {
  try {
    const vendorOrders = await prisma.vendorOrder.findMany({
      where: {
        NOT: {
          OR: [
            {
              status: OrderStatus.DELIVERED,
            },
            {
              status: OrderStatus.COMPLETED,
            },
          ],
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
        code: "desc",
      },
    });
    return vendorOrders;
  } catch (error) {
    throw new createError.BadRequest("Cannot find vendor order.");
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
    if (vendorOrder.attachment) {
      vendorOrder.attachment = `/images/vendor-orders/${vendorOrder.code}`;
    }
    return vendorOrder;
  } catch (error) {
    throw new createError.BadRequest(
      "Cannot find vendor order with the given code."
    );
  }
};

export const findVendorSale = async (searchObject: VendorSaleRequestDto) => {
  try {
    const { code, start_date, end_date, vendor, product } =
      await vendorSaleSchema.validateAsync(searchObject);

    // Construct dynamic query for prisma.
    // Note that there's no known way to not select an entry based on a condition on a relation
    // we'll have to manually filter out later on.
    const whereClause = new Map();
    whereClause.set("OR", [
      {
        status: OrderStatus.COMPLETED,
      },
      {
        status: OrderStatus.DELIVERED,
      },
    ]);

    if (code) {
      whereClause.set("OR", [
        {
          code: code,
        },
        // This might be useful to check for continuity of the code.
        {
          manual_code: {
            contains: code,
          },
        },
      ]);
    } else {
      if (start_date && end_date) {
        const { start: start, end: _e } = convertLocalInterval(
          new Date(start_date)
        );
        const { start: _s, end: end } = convertLocalInterval(
          new Date(end_date)
        );
        whereClause.set("expected_at", { gte: start, lte: end });
      } else if (start_date || end_date) {
        const date = start_date ? start_date : end_date;
        const { start, end } = convertLocalInterval(new Date(date));
        whereClause.set("expected_at", { gte: start, lte: end });
      }

      if (vendor)
        whereClause.set("vendor_name", {
          equals: vendor,
          mode: "insensitive",
        });
    }
    let result = await prisma.vendorOrder.findMany({
      where: Object.fromEntries(whereClause),
      include: {
        productVendorOrders: {
          orderBy: {
            product_name: "asc",
          },
        },
        vendorPayment: true,
      },
      orderBy: {
        updated_at: "desc",
      },
      // Limit this because it's very possible to take all completed orders.
      take: MAX_ORDER_COUNT,
    });
    const vendorSolds = result.filter((co) =>
      co.productVendorOrders.some((pco) =>
        pco.product_name.toLowerCase().includes(product.toLowerCase())
      )
    );
    // Truncate array in a fast way.
    vendorSolds.length = Math.min(vendorSolds.length, 100);

    // Apparently .map() won't work cuz TS is BS :)
    const reports = [];

    for (const sold of vendorSolds) {
      reports.push({
        is_test: sold.is_test,
        order_code: sold.code,
        manual_code: sold.manual_code,
        vendor_name: sold.vendor_name,
        sale: sold.productVendorOrders.reduce(
          (prev, curr: any) => prev + curr.quantity * curr.unit_price,
          0
        ),
        expected_at: sold.expected_at,
        payment_status: sold.vendorPayment?.status, // Delivered VO doesn't have payment.
        productVendorOrders: sold.productVendorOrders,
      });
    }
    return reports;
  } catch (error) {
    console.log(error);
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
    const { code, time } = generateCode();

    // Validate unique unit code
    const unitCodes = new Set();

    let productOrders = [];
    // if not array => return undefined => false
    // if is array => return array length. If length = 0 => false
    if (vendorOrderData.productVendorOrders?.length) {
      for (const po of vendorOrderData.productVendorOrders) {
        if (unitCodes.has(po.unitCode)) {
          throw `Duplicated ${po.unitCode}.`;
        } else {
          unitCodes.add(po.unitCode);
        }
      }
      productOrders = vendorOrderData.productVendorOrders.map(
        (productOrder) => ({
          product_name: productOrder.productName,
          order_code: productOrder.orderCode,
          quantity: productOrder.quantity,
          unit_code: productOrder.unitCode,
          unit_price: !productOrder.unitPrice
            ? null
            : new Prisma.Decimal(productOrder.unitPrice),
          created_at: time,
          updated_at: time,
        })
      );
    }

    return await prisma.$transaction(async (tx) => {
      const isItemArrived = vendorOrderData.status === OrderStatus.DELIVERED;
      const isInvoiceReceived =
        vendorOrderData.status === OrderStatus.COMPLETED;

      // Not possible for both of these to be true,
      // so no need to check if the stock is already changed.
      let newVendorPayment;
      if (isItemArrived || isInvoiceReceived) {
        if (isInvoiceReceived) {
          // create vendor payment
          newVendorPayment = await tx.vendorPayment.create({
            data: {
              code: code,
              status: vendorOrderData.isTest
                ? PaymentStatus.CASH
                : PaymentStatus.RECEIVABLE,
              created_at: time,
              updated_at: time,
            },
          });

          // check for valid unit price when complete order
          for (const po of productOrders) {
            // !po for empty order.
            if (!po || !po.unit_price || po.unit_price.comparedTo(0) < 0) {
              throw `Price needs to be at least 0.`;
            }
          }
        }

        // Add stock change if delivered.
        let addedStockChangeHistory = null;
        if (isItemArrived || isInvoiceReceived) {
          addedStockChangeHistory = await tx.stockChangeHistory.create({
            data: {
              created_at: time,
              reason: StockChangeReason.VENDOR_ORDER_COMPLETED,
              order_code: code,
            },
          });
        }

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

          if (isItemArrived || isInvoiceReceived) {
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
                // addedStockChangeHistory shouldn't be null
                // cuz of isItemArrived || isInvoiceReceived check
                // that set addedStockChangeHistory to db.
                change_id: addedStockChangeHistory?.id,
                quantity_change: stockQuantityChange.toFraction(),
              },
            });
          }

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

      let attachmentPath = null;
      if (vendorOrderData.attachment) {
        const vendor = await tx.vendor.findUniqueOrThrow({
          select: {
            id: true,
          },
          where: {
            name: vendorOrderData.vendorName,
          },
        });

        try {
          attachmentPath = path.join(
            process.env.FILE_STORAGE,
            `${vendor.id}`,
            code
          );
        } catch (error) {
          console.log(error);
          throw "Unable to construct file path. Contact server admin.";
        }
      }

      // create new order
      const newVendorOrder = await tx.vendorOrder.create({
        data: {
          code: code,
          manual_code: vendorOrderData.manualCode,
          vendor_name: vendorOrderData.vendorName,
          status: vendorOrderData.status,
          created_at: time,
          updated_at: time,
          expected_at: convertLocalExpected(vendorOrderData.expectedAt),
          is_test: vendorOrderData.isTest,
          is_sold: isItemArrived || isInvoiceReceived,
          attachment: attachmentPath,
          payment_code: isInvoiceReceived ? newVendorPayment.code : undefined,
          productVendorOrders: {
            create: productOrders,
          },
        },
      });

      if (attachmentPath !== null) {
        try {
          await fsPromise.rename(
            vendorOrderData.attachment.path,
            path.resolve(attachmentPath)
          );
        } catch (error) {
          console.log(error);
          console.log(attachmentPath);
          await fsPromise.rm(vendorOrderData.attachment.path, { force: true });
          throw "Unable to save file. Remove attachment and try again.";
        }
      }
      return newVendorOrder;
    });
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    console.log(error);
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
    const time = generateCurrentTime();
    let productOrders = [];
    if (vendorOrderData.productVendorOrders?.length) {
      const unitCodes = new Set();
      for (const po of vendorOrderData.productVendorOrders) {
        if (unitCodes.has(po.unitCode)) {
          throw `Duplicated ${po.unitCode}.`;
        } else {
          unitCodes.add(po.unitCode);
        }
      }
      productOrders = vendorOrderData.productVendorOrders.map(
        (productOrder) => ({
          product_name: productOrder.productName,
          quantity: productOrder.quantity,
          unit_code: productOrder.unitCode,
          unit_price: !productOrder.unitPrice
            ? null
            : new Prisma.Decimal(productOrder.unitPrice),
          order_code: vendorOrderData.code,
          updated_at: time,
        })
      );
    }

    const isItemArrived = vendorOrderData.status === OrderStatus.DELIVERED;
    const isInvoiceReceived = vendorOrderData.status === OrderStatus.COMPLETED;

    // Get this out of the way asap to avoid messing with attachments.
    // And to avoid spaghetti.
    if (productOrders.length === 0 && (isInvoiceReceived || isItemArrived)) {
      throw "At least one product is required.";
    }

    return await prisma.$transaction(async (tx) => {
      // NOTE: Temporary fix.
      let newVendorPayment;
      if (isInvoiceReceived) {
        newVendorPayment = await tx.vendorPayment.create({
          data: {
            code: code,
            status: vendorOrderData.isTest
              ? PaymentStatus.CASH
              : PaymentStatus.RECEIVABLE,
            created_at: time,
            updated_at: time,
          },
        });
      }

      let existingOrder;
      let attachmentPath = null;

      try {
        existingOrder = await tx.vendorOrder.findUniqueOrThrow({
          where: {
            VendorOrderSold_key: {
              code: vendorOrderData.code,
              is_sold: false,
            },
          },
          select: {
            vendor_name: true,
            attachment: true,
            vendor: {
              select: {
                id: true,
              },
            },
          },
        });
      } catch {
        throw "This order cannot be changed.";
      }

      if (vendorOrderData.attachment) {
        // Rename /tmp/file to uploads/vendorID/code
        // If there's already uploads/vendorID/code then it gets overwritten, no need to delete.
        // This is not the case if vendorID is different so we need to handle that.
        let vendorID: string = "" + existingOrder.vendor.id;
        if (vendorOrderData.vendorName !== existingOrder.vendor_name) {
          const vendor = await tx.vendor.findUniqueOrThrow({
            where: {
              name: vendorOrderData.vendorName,
            },
            select: {
              id: true,
            },
          });
          vendorID = "" + vendor.id;

          try {
            const removePath = path.resolve(existingOrder.attachment);
            await fsPromise.rm(removePath, { force: true });
          } catch (error) {
            console.log(error);
            await fsPromise.rm(vendorOrderData.attachment.path, {
              force: true,
            });
            throw "Unable to remove previous attachment.";
          }
        }

        try {
          attachmentPath = path.join(
            process.env.FILE_STORAGE,
            vendorID,
            vendorOrderData.code
          );
        } catch (error) {
          console.log(error);
          await fsPromise.rm(vendorOrderData.attachment.path, { force: true });
          throw "Unable to construct file path. Contact server admin.";
        }

        try {
          await fsPromise.rename(
            vendorOrderData.attachment.path,
            path.resolve(attachmentPath)
          );
        } catch (error) {
          console.log(error);
          await fsPromise.rm(vendorOrderData.attachment.path, { force: true });
          throw "Unable to save attachment.";
        }
      } else if (existingOrder.attachment) {
        attachmentPath = null;
        try {
          await fsPromise.rm(path.resolve(existingOrder.attachment), {
            force: true, // Silent exception if path doesn't exist.
          });
        } catch {
          // Mostly due to it being opened or lack of permission or ill-formed resolve.
          // Although I'm pretty sure if the file is being opened,
          // it'll be deleted once it's closed and so no exceptions
          // will be thrown.
          throw "Unable to remove attachment.";
        }
      }

      // update vendor order table if that order IS NOT completed already
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
          is_sold: isItemArrived || isInvoiceReceived,
          manual_code: vendorOrderData.manualCode,
          payment_code: isInvoiceReceived ? newVendorPayment.code : undefined,
          attachment: attachmentPath,
        },
      });

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

      // Add stock change if delivered.
      let addedStockChangeHistory = null;
      if (isItemArrived || isInvoiceReceived) {
        addedStockChangeHistory = await tx.stockChangeHistory.create({
          data: {
            created_at: time,
            reason: StockChangeReason.VENDOR_ORDER_COMPLETED,
            order_code: code,
          },
        });
      }

      for (const productOrder of productOrders) {
        if (isInvoiceReceived) {
          // validate unit price when completing order
          if (
            !productOrder ||
            !productOrder.unit_price ||
            productOrder.unit_price.comparedTo(0) < 0
          ) {
            throw `Price needs to be at least 0.`;
          }

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
        const newStockQuantity = currentStockQuantity.add(productOrderQuantity);
        const stockQuantityChange = newStockQuantity.sub(currentStockQuantity);

        // 1. create stock change history only if order is completed
        if (isItemArrived || isInvoiceReceived) {
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
              // addedStockChangeHistory shouldn't be null
              // cuz of isItemArrived || isInvoiceReceived check
              // that set addedStockChangeHistory to db.
              change_id: addedStockChangeHistory?.id,
              quantity_change: stockQuantityChange.toFraction(),
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
    console.log(error);
    if (error.details?.length > 0) {
      handleValidationError(error);
    }
    throw new createError.BadRequest(
      "Cannot update vendor order with the given data."
    );
  }
};

export const revertVendorOrder = async (code: string) => {
  try {
    return await prisma.$transaction(async (tx) => {
      // NOTE: Legacy code, may remove due to vendorReturn has no meaning.
      const isReturned = await tx.vendorReturn.findFirst({
        where: {
          order_code: code,
        },
      });
      if (isReturned) {
        throw "Can't revert order because it has at least one return.";
      }
      // revert payment if possible; DELIVERED vo doesn't have payment.
      try {
        const deletedVendorPayment = await tx.vendorPayment.delete({
          where: {
            code: code,
          },
        });
      } catch (error) {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === "P2025"
        ) {
          // Intentionally skip.
        } else {
          throw error;
        }
      }

      // revert vendor order
      const updatedVendorOrder = await tx.vendorOrder.update({
        where: {
          code: code,
        },
        data: {
          status: OrderStatus.SHIPPING,
          is_sold: false,
          payment_code: null,
        },
      });

      // revert stock
      const stockChangeHistory = await tx.stockChangeHistory.findUniqueOrThrow({
        where: {
          OrderStockChangeHistory_key: {
            reason: StockChangeReason.VENDOR_ORDER_COMPLETED,
            order_code: code,
          },
        },
        include: {
          stockChanges: true,
        },
      });

      for (const stockChange of stockChangeHistory.stockChanges) {
        const stock = await tx.stock.findUniqueOrThrow({
          where: {
            id: stockChange.stock_id,
          },
        });
        const currentStockQuantity = new Fraction(stock.quantity);
        const stockQuantityChange = new Fraction(stockChange.quantity_change);
        const revertedStockQuantity =
          currentStockQuantity.sub(stockQuantityChange);
        if (revertedStockQuantity.compare(0) < 0) {
          throw `Unable to revert due to negative stock for ${stock.product_name}.`;
        }

        const updatedStock = await tx.stock.update({
          where: {
            id: stockChange.stock_id,
          },
          data: {
            quantity: revertedStockQuantity.toFraction(),
          },
        });
      }

      const deletedStockChangeHistory = await tx.stockChangeHistory.delete({
        where: {
          OrderStockChangeHistory_key: {
            reason: StockChangeReason.VENDOR_ORDER_COMPLETED,
            order_code: code,
          },
        },
      });
    });
  } catch (error) {
    console.log(error);
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot revert vendor order.");
  }
};
