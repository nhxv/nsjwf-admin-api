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
import {
  createPartFromUri,
  createUserContent,
  GoogleGenAI,
} from "@google/genai";
import { findActiveVendors } from "./vendor.service";
import { findAllProducts } from "./product.service";
import { closestMatch } from "../commons/utils/string.util";

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

      if (existingOrder.attachment || vendorOrderData.attachment) {
        let vendorID = "" + existingOrder.vendor.id;
        try {
          let deleteOld = !!existingOrder.attachment;
          let diffVendor = false;
          if (
            existingOrder.attachment &&
            vendorOrderData.vendorName !== existingOrder.vendor_name
          ) {
            diffVendor = true;
          }

          if (deleteOld) {
            try {
              const removePath = path.resolve(existingOrder.attachment);
              await fsPromise.rm(removePath, { force: true });
              attachmentPath = null;
            } catch (error) {
              console.log(error);
              throw "Unable to remove previous attachment.";
            }
          }

          // If just delete old attachment then don't query.
          if (diffVendor && vendorOrderData.attachment) {
            const newVendor = await tx.vendor.findUniqueOrThrow({
              where: {
                name: vendorOrderData.vendorName,
              },
              select: {
                id: true,
              },
            });
            vendorID = "" + newVendor.id;
          }

          if (vendorOrderData.attachment) {
            try {
              attachmentPath = path.join(
                process.env.FILE_STORAGE,
                vendorID,
                vendorOrderData.code
              );
            } catch (error) {
              console.log(error);
              throw "Unable to construct file path. Contact server admin.";
            }

            try {
              await fsPromise.rename(
                vendorOrderData.attachment.path,
                path.resolve(attachmentPath)
              );
            } catch (error) {
              console.log(error);
              throw "Unable to save attachment.";
            }
          }
        } catch (error) {
          await fsPromise.rm(vendorOrderData.attachment.path, { force: true });
          throw error;
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
          status: OrderStatus.CHECKING,
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

export const autofillVendorOrder = async (image: Express.Multer.File) => {
  try {
    const attachmentPath = path.resolve(image.path);

    const API_KEY = process.env.GEMINI_KEY;
    const PROMPT =
      'This is a vendor receipt. Each product line contain only one product and one quantity. Give me vendor name (trim to less than 3 words), receipt number, product names, quantity, date received. Organize these info into JSON with no Markdown. Follow this format: {"vendor_name": "string", "receipt_number": "string", "date_received": "mm/dd/yyyy", "products": [{"name": "string", "quantity": "string"}]}. If fail to or if products contain more than 10 items, respond with "Unable to extract info"';
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const file = await ai.files.upload({
      file: attachmentPath,
      config: { mimeType: "image/jpeg" },
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite-preview-06-17",
      contents: createUserContent([
        createPartFromUri(file.uri, file.mimeType),
        PROMPT,
      ]),
    });

    // throw "AHHHHH";

    const candidates = response.candidates;
    let test3 = null;
    if (candidates?.length) {
      const content = candidates[0].content;
      if (content?.parts?.length) {
        const resp = content.parts[0].text;
        if (resp === "Unable to extract info") {
          throw response;
        }
        test3 = JSON.parse(resp);
      } else {
        throw response;
      }
    } else {
      throw response;
    }

    const testobj = test3;
    console.log("LLM response: ", testobj);

    const vendors = await findActiveVendors();
    let products = await findAllProducts();

    let bestVendorGuess = vendors[0];
    let brandGuess = "";
    const targetVendorName = testobj.vendor_name.toLowerCase();
    const vendorMatches = closestMatch(targetVendorName, vendors, (vendor) =>
      vendor.name.toLowerCase()
    );

    console.log("Preliminary match: ", vendorMatches);

    // Custom rules.
    let customVendorGuess = null;
    if (
      targetVendorName.includes("field fresh") ||
      targetVendorName.includes("hollano") ||
      targetVendorName.includes("freshkist") ||
      targetVendorName.includes("beachside") ||
      targetVendorName.includes("amaral")
    ) {
      customVendorGuess = vendorMatches.filter((v) =>
        v.name.toLowerCase().includes("holland")
      )[0];
      if (targetVendorName.includes("freshkist")) {
        brandGuess = "fk";
      } else if (targetVendorName.includes("beachside")) {
        brandGuess = "beachside";
      } else {
        brandGuess = "field fresh";
      }
    } else if (targetVendorName.includes("beast express")) {
      customVendorGuess = vendorMatches.filter((v) =>
        v.name.toLowerCase().includes("interfresh")
      )[0];
      brandGuess = "los pinos";
    } else if (targetVendorName.includes("s & w")) {
      customVendorGuess = vendorMatches.filter((v) =>
        v.name.toLowerCase().includes("redwood")
      )[0];
    } else {
      customVendorGuess = vendorMatches[0];
      brandGuess = bestVendorGuess.name;
    }

    if (customVendorGuess) {
      bestVendorGuess = customVendorGuess;
    }

    console.log("Best vendor guess: ", bestVendorGuess);

    if (bestVendorGuess.name.includes("Gaia")) {
      const productPallet = products.find((p) =>
        p.name.includes("Transportation")
      );
      const quantity = testobj.products.reduce(
        (total, val) => total + +val.quantity,
        0
      );
      if (productPallet) {
        return {
          vendor_name: bestVendorGuess.name,
          products: [
            {
              name: productPallet.name,
              quantity: quantity,
              unit_code: `${productPallet.id}_BOX`,
            },
          ],
          date_received: new Date(testobj.date_received),
          manualCode: testobj.receipt_number,
        };
      }
    }

    const productMatches = [];
    for (const product of testobj.products) {
      const target = product.name.toLowerCase();
      console.log("Evaluating: ", target);

      // 1. Fuzzy match the product only; no brand or type whatsoever.
      const targetFirstFewWords = target.split(" ", 3).join(" ");
      let matches = closestMatch(targetFirstFewWords, products, (p) => {
        const splits = p.name.split(" ", 3);
        return splits.map((word) => word.toLowerCase()).join(" ");
      });

      // 2. Start matching brand name.
      const productWithVendor = `${targetFirstFewWords} ${brandGuess.toLowerCase()}`;
      const brandMatches = closestMatch(productWithVendor, matches, (p) =>
        p.name.toLowerCase()
      );

      if (brandMatches.length > 1) {
        // 3. Give priority for strings that has the vendor's name in its name.
        let first = 0;
        for (let i = 0; i < brandMatches.length; ++i) {
          if (
            brandMatches[i].name
              .toLowerCase()
              .includes(brandGuess.toLowerCase())
          ) {
            let temp = brandMatches[first];
            brandMatches[first] = brandMatches[i];
            brandMatches[i] = temp;
            ++first;
          }
        }

        // 4. Custom rules
        // TODO: to be implemented
      }

      productMatches.push(brandMatches[0]);
      // brandMatches are references so we can soft compare with !=
      products = products.filter((p) => p != brandMatches[0]);
    }

    const bestProductGuesses = [];
    for (let i = 0; i < testobj.products.length; ++i) {
      bestProductGuesses.push({
        name: productMatches[i].name,
        quantity: +testobj.products[i].quantity,
        unit_code: `${productMatches[i].id}_BOX`,
      });
    }

    const autofillGuess = {
      vendor_name: bestVendorGuess.name,
      products: bestProductGuesses,
      date_received: new Date(testobj.date_received),
      manualCode: testobj.receipt_number,
    };

    // Cleanup
    await ai.files.delete({
      name: file.name,
    });
    await fsPromise.rm(attachmentPath, { force: true });

    return autofillGuess;
  } catch (error) {
    console.error(error);
    throw createError.BadRequest("Unable to extract info");
  }
};
