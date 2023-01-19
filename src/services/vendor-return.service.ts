import { convertLocalStart } from "./../commons/time.util";
import { VendorReturnRequestDto, vendorReturnSchema } from "../dto/requests/vendor-return-request.dto";
import { Prisma } from "@prisma/client";
import createError  from "http-errors";
import { generateCurrentTime } from "../commons/time.util";
import { OrderStatus } from "../commons/order-status.enum";
import { handleValidationError } from "../commons/http.exception";

export const findVendorReturns = async () => {
  try {
    const vendorReturns = await prisma.vendorReturn.findMany({
      where: {
        created_at: {
          gte: convertLocalStart(),
        }
      },
      include: {
        productVendorReturns: {
          orderBy: {
            product_name: "asc",
          }
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
    throw new createError.BadRequest("Cannot find vendor return with the given status.");
  }
}

export const createVendorReturn = async (vendorReturnRequestDto: VendorReturnRequestDto) => {
  try {
    // Validate vendor return
    const vendorReturnData: VendorReturnRequestDto = await vendorReturnSchema.validateAsync(vendorReturnRequestDto);
    const notZero = vendorReturnData.productVendorReturns.filter(
      pr => pr.quantity > 0 && new Prisma.Decimal(pr.unitPrice).greaterThan(new Prisma.Decimal(0))
    );
    if (notZero.length < 1) {
      throw `Hollow order.`;
    }
    const time = generateCurrentTime();
    const productReturns = notZero.map(
      productReturn => ({
        product_name: productReturn.productName,
        return_id: productReturn.returnId,
        unit_price: new Prisma.Decimal(productReturn.unitPrice),
        quantity: productReturn.quantity,
        created_at: time,
      })
    );

    return await prisma.$transaction(async (tx) => {
      const existingSaleReturn = await tx.vendorSaleReturn.findUnique({
        where: {
          sale_code: vendorReturnData.orderCode,
        },
        include: {
          productVendorSaleReturns: true,
        }
      });
      if (!existingSaleReturn) {
        // validate with order sold
        const orderSold = await tx.vendorOrder.findUniqueOrThrow({
          where: {
            VendorOrderSold_key: {
              code: vendorReturnData.orderCode,
              is_sold: true,
            }
          },
          include: {
            productVendorOrders: true,
          }
        });
        if (orderSold.status !== OrderStatus.COMPLETED) {
          return `Please don't hack us.`;
        }
        const newProductSaleReturns = new Map();
        for (const productSold of orderSold.productVendorOrders) {
          newProductSaleReturns.set(productSold.product_name, {
            product_name: productSold.product_name,
            quantity: productSold.quantity,
            unit_price: productSold.unit_price,
          });
        }
        for (const productReturn of productReturns) {
          const productOrderSold = newProductSaleReturns.get(productReturn.product_name);
          if (
            !productOrderSold ||
            productOrderSold.quantity - productReturn.quantity < 0 ||
            !productReturn.unit_price.equals(productOrderSold.unit_price)
          ) {
            throw `${productReturn.product_name}: Invalid product data.`;
          }
          newProductSaleReturns.set(productReturn.product_name, {
            ...newProductSaleReturns.get(productReturn.product_name),
            quantity: productOrderSold.quantity - productReturn.quantity,
          });
        }
        // create sale return -- since this is the first return
        const newSaleReturn = await tx.vendorSaleReturn.create({
          data: {
            sale_code: vendorReturnData.orderCode,
            vendor_name: vendorReturnData.vendorName,
            sold_at: orderSold.updated_at,
            productVendorSaleReturns: {
              create: Array.from(newProductSaleReturns.values()),
            }
          }
        }); 
      } else {
        // validate with existing sale returns -- this is NOT the first return
        const existingProductSaleReturns = new Map();
        for (const productSaleReturn of existingSaleReturn.productVendorSaleReturns) {
          existingProductSaleReturns.set(
            productSaleReturn.product_name, 
            {"quantity": productSaleReturn.quantity, "unit_price": productSaleReturn.unit_price}
          );
        }
        for (const productReturn of productReturns) {
          const productSaleReturn = existingProductSaleReturns.get(productReturn.product_name);
          if (
            !productSaleReturn || 
            productSaleReturn.quantity - productReturn.quantity < 0 ||
            !productReturn.unit_price.equals(productSaleReturn.unit_price)
          ) {
            throw `${productReturn.product_name}: Invalid product data.`;
          }          
          // update product sale return quantity
          const updatedProductSaleReturn = await tx.productVendorSaleReturn.update({
            where: {
              ProductVendorSaleReturn_key: {
                vendor_sale_return_code: vendorReturnData.orderCode,
                product_name: productReturn.product_name,
              }
            },
            data: {
              quantity: {
                increment: 0 - productReturn.quantity,
              }
            }
          });
        }
      }

      // create return
      const newVendorReturn = await tx.vendorReturn.create({
        data: {
          vendor_name: vendorReturnData.vendorName,
          order_code: vendorReturnData.orderCode, 
          created_at: time,
          recommended_price: vendorReturnData.recommendedPrice,
          final_price: vendorReturnData.finalPrice,
          productVendorReturns: {
            create: productReturns
          }
        }
      }); 
    });    
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    if (error.details?.length > 0) {
      handleValidationError(error);
    }
    throw new createError.BadRequest("Cannot create vendor return with the given data.");
  }
}