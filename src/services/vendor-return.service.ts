import { Prisma } from "@prisma/client";
import Fraction from "fraction.js";
import createError from "http-errors";
import { OrderStatus } from "../commons/enums/order-status.enum";
import { handleValidationError } from "../commons/http.exception";
import { generateCurrentTime } from "../commons/utils/time.util";
import {
  VendorReturnRequestDto,
  vendorReturnSchema,
} from "../dto/requests/vendor-return-request.dto";
import { convertLocalStart } from "./../commons/utils/time.util";

export const findVendorReturns = async () => {
  try {
    const vendorReturns = await prisma.vendorReturn.findMany({
      where: {
        created_at: {
          gte: convertLocalStart(),
        },
      },
      include: {
        productVendorReturns: {
          orderBy: {
            product_name: "asc",
          },
        },
      },
      orderBy: {
        created_at: "asc",
      },
    });
    return vendorReturns;
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest(
      "Cannot find vendor return with the given status."
    );
  }
};

export const createVendorReturn = async (
  vendorReturnRequestDto: VendorReturnRequestDto
) => {
  try {
    // validate vendor return
    const vendorReturnData: VendorReturnRequestDto =
      await vendorReturnSchema.validateAsync(vendorReturnRequestDto);
    const notZero = vendorReturnData.productVendorReturns.filter(
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
      const existingReturnRemain = await tx.vendorReturnRemain.findUnique({
        where: {
          order_code: vendorReturnData.orderCode,
        },
        include: {
          productVendorReturnRemains: true,
        },
      });
      if (!existingReturnRemain) {
        // validate with order sold -- this is the first return
        const orderSold = await tx.vendorOrder.findUniqueOrThrow({
          where: {
            VendorOrderSold_key: {
              code: vendorReturnData.orderCode,
              is_sold: true,
            },
          },
          include: {
            productVendorOrders: true,
          },
        });
        if (orderSold.status !== OrderStatus.COMPLETED) {
          return `Please don't hack us.`;
        }
        const newProductReturnRemains = new Map();
        for (const productSold of orderSold.productVendorOrders) {
          newProductReturnRemains.set(productSold.product_name, {
            product_name: productSold.product_name,
            quantity: productSold.quantity,
            unit_code: productSold.unit_code,
            unit_price: productSold.unit_price,
          });
        }
        for (const productReturn of productReturns) {
          const productOrderSold = newProductReturnRemains.get(
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
          newProductReturnRemains.set(productReturn.product_name, {
            ...newProductReturnRemains.get(productReturn.product_name),
            quantity: productSoldChange.toFraction(),
          });
        }
        // create return remain -- since this is the first return
        const newReturnRemain = await tx.vendorReturnRemain.create({
          data: {
            order_code: vendorReturnData.orderCode,
            vendor_name: vendorReturnData.vendorName,
            sold_at: orderSold.updated_at,
            productVendorReturnRemains: {
              create: [...newProductReturnRemains.values()],
            },
          },
        });
      } else {
        // validate with existing return remains -- this is NOT the first return
        const existingProductReturnRemains = new Map();
        for (const productReturnRemain of existingReturnRemain.productVendorReturnRemains) {
          existingProductReturnRemains.set(productReturnRemain.product_name, {
            quantity: productReturnRemain.quantity,
            unit_code: productReturnRemain.unit_code,
            unit_price: productReturnRemain.unit_price,
          });
        }
        for (const productReturn of productReturns) {
          const productReturnRemain = existingProductReturnRemains.get(
            productReturn.product_name
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
          const saleUnit = await tx.unit.findUniqueOrThrow({
            where: {
              code: productReturnRemain.unit_code,
            },
          });
          const returnRatio = new Fraction(returnUnit.ratio);
          const saleRatio = new Fraction(saleUnit.ratio);
          const productReturnQuantity = returnRatio.mul(
            new Fraction(productReturn.quantity)
          );
          const productReturnRemainQuantity = saleRatio.mul(
            new Fraction(productReturnRemain.quantity)
          );
          const productSaleChange = productReturnRemainQuantity
            .sub(productReturnQuantity)
            .div(saleRatio);
          if (productSaleChange.compare(0) < 0) {
            throw `${productReturn.product_name}: Invalid product quantity or price.`;
          }

          // update product return remain quantity
          const updatedProductReturnRemain =
            await tx.productVendorReturnRemain.update({
              where: {
                ProductVendorReturnRemain_key: {
                  vendor_return_remain_code: vendorReturnData.orderCode,
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
      const newVendorReturn = await tx.vendorReturn.create({
        data: {
          vendor_name: vendorReturnData.vendorName,
          order_code: vendorReturnData.orderCode,
          created_at: time,
          refund: new Prisma.Decimal(vendorReturnData.refund.toFixed(2)),
          productVendorReturns: {
            create: productReturns,
          },
        },
      });
    });
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    if (error.details?.length > 0) {
      handleValidationError(error);
    }
    throw new createError.BadRequest(
      "Cannot create vendor return with the given data."
    );
  }
};
