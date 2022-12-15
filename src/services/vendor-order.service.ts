import { generateCurrentTime, convertLocalExpected, convertLocalStart } from "./../commons/time.util";
import { ProductStockChangeReason } from "./../commons/product-stock-change-reason.enum";
import { generateOrderCode } from "./../commons/order.util";
import { VendorOrderRequestDto, vendorOrderSchema } from "./../dto/requests/vendor-order-request.dto";
import createError  from "http-errors";
import prisma from "../../prisma/prisma-client";
import { OrderStatus } from "../commons/order-status.enum";
import { Prisma } from "@prisma/client";

export const findVendorOrderByStatus = async (status: string) => {
  try {
    if (!(Object.values(OrderStatus) as string[]).includes(status)) {
      throw `Please don't attack us.`;
    }
    const vendorOrders = await prisma.vendorOrder.findMany({
      where: {
        status: status,
        expected_at: {
          gte: convertLocalStart(),
        }
      },
      include: {
        productVendorOrders: true,
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
    throw new createError.BadRequest("Cannot find vendor order with the given status.");
  }
}

export const findVendorOrderByCode = async (code: string) => {
  try {
    const vendorOrder = await prisma.vendorOrder.findUniqueOrThrow({
      where: {
        code: code,
      },
      include: {
        productVendorOrders: true,
      }
    })
    return vendorOrder;
  } catch (error) {
    throw new createError.BadRequest("Cannot find vendor order with the given code.");
  }
}

export const createVendorOrder = async (vendorOrderDto: VendorOrderRequestDto) => {
  try {
    const vendorOrderData: VendorOrderRequestDto = await vendorOrderSchema.validateAsync(vendorOrderDto);
    if (!Object.keys(OrderStatus).includes(vendorOrderData.status)) {
      throw `Please don't attack us.`;
    }
    const notRemovedList = vendorOrderData.productVendorOrders.filter(po => po.quantity > 0);
    if (notRemovedList.length < 1) {
      throw `Hollow order.`;
    }
    const { code, time } = generateOrderCode();
    const productOrders = vendorOrderData.productVendorOrders.map(
      productOrder => ({
        product_name: productOrder.productName,
        order_code: productOrder.orderCode,
        unit_price: new Prisma.Decimal(productOrder.unitPrice),
        quantity: productOrder.quantity,
        created_at: time,
      })
    );

    if (vendorOrderData.status === OrderStatus.DELIVERED) {
      // if vendor order is delivered, update stock
      return await prisma.$transaction(async (tx) => {
        // create new order
        const newVendorOrder = await prisma.vendorOrder.create({
          data: {
            code: code,
            vendor_name: vendorOrderData.vendorName,
            status: vendorOrderData.status,
            created_at: time,
            expected_at: convertLocalExpected(vendorOrderData.expectedAt, 22),
            is_test: vendorOrderData.isTest,
            is_invoice: true,
            productVendorOrders: {
              create: productOrders
            }
          }
        });
        // create product stock change history
        const addedProductStockChangeHistory = await tx.productStockChangeHistory.create({
          data: {
            created_at: time,
            reason: ProductStockChangeReason.VENDOR_ORDER_DELIVERED,
          }
        });
        
        for (const productOrder of productOrders) {
           // update product stock
           const updatedProductStock = await tx.productStock.update({
            where: {
              product_name: productOrder.product_name,
            },
            data: {
              quantity: {
                increment: productOrder.quantity,
              },
              updated_at: time,
            }
          });

          // create stock change
          const addedProductStockChange = await tx.productStockChange.create({
            data: {
              stock_id: updatedProductStock.id,
              change_id: addedProductStockChangeHistory.id,
              quantity_change: productOrder.quantity,
            }
          });          
        }
      });
    } else {
      const newVendorOrder = await prisma.vendorOrder.create({
        data: {
          code: code,
          vendor_name: vendorOrderData.vendorName,
          status: vendorOrderData.status,
          created_at: time,
          expected_at: convertLocalExpected(vendorOrderData.expectedAt, 22),
          is_test: vendorOrderData.isTest,
          is_invoice: false,
          productVendorOrders: {
            create: productOrders
          }
        }
      });
      return newVendorOrder;
    }
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot add vendor order with the given data.");
  }
}

export const updateVendorOrder = async (code:string, vendorOrderDto: VendorOrderRequestDto) => {
  try {
    // Validate
    const vendorOrderData: VendorOrderRequestDto = await vendorOrderSchema.validateAsync(vendorOrderDto);
    if (!Object.keys(OrderStatus).includes(vendorOrderData.status)) {
      throw `Please don't attack us.`;
    }
    if (vendorOrderData.code !== code) {
      throw `Please don't attack us.`;
    }
    const notRemovedList = vendorOrderData.productVendorOrders.filter(po => !po.isRemove && po.quantity > 0);
    if (notRemovedList.length < 1) {
      throw `Hollow order.`;
    }

    const time = generateCurrentTime();
    const productOrders = vendorOrderData.productVendorOrders.map(
      productOrder => ({
        product_name: productOrder.productName,
        quantity: productOrder.quantity,
        unit_price: new Prisma.Decimal(productOrder.unitPrice),
        order_code: vendorOrderData.code,
        updated_at: time,
        isRemove: productOrder.isRemove,
      })
    );
    return await prisma.$transaction(async (tx) => {
      const isDelivered = (vendorOrderData.status === OrderStatus.DELIVERED);
      // update vendor order table if that order IS NOT delivered
      try {
        const updatedOrder = await tx.vendorOrder.update({
          where: {
            VendorOrderInvoice_key: {
              code: vendorOrderData.code,
              is_invoice: false,
            }
          },
          data: {
            vendor_name: vendorOrderData.vendorName,
            status: vendorOrderData.status,
            updated_at: time,
            expected_at: convertLocalExpected(vendorOrderData.expectedAt, 22),
            is_test: vendorOrderData.isTest,
            is_invoice: isDelivered
          }
        });
      } catch (e) {
        throw `This order cannot be changed.`;
      }
      let addedProductStockChangeHistory;
      if (isDelivered) {
        // update product stock change history if order is delivered
        addedProductStockChangeHistory = await tx.productStockChangeHistory.create({
          data: {
            created_at: time,
            reason: ProductStockChangeReason.VENDOR_ORDER_DELIVERED,
          }
        });
      }
      for (const productOrder of productOrders) {
        // remove product vendor order
        if (productOrder.isRemove) {
          const deletedProductOrder = await tx.productVendorOrder.delete({
            where: {
              ProductVendorOrder_product_name_order_code_key: {
                product_name: productOrder.product_name,
                order_code: productOrder.order_code,
              }              
            }
          });
        } else {
          // upsert product vendor order
          const updatedProductOrder = await tx.productVendorOrder.upsert({
            where: {
              ProductVendorOrder_product_name_order_code_key: {
                product_name: productOrder.product_name,
                order_code: productOrder.order_code,
              }
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
              unit_price: productOrder.unit_price,
              created_at: time,
            },
          });
          
          if (isDelivered) {
            // update product stock
            const updatedProductStock = await tx.productStock.update({
              where: {
                product_name: productOrder.product_name,
              },
              data: {
                quantity: {
                  increment: productOrder.quantity,
                },
                updated_at: time,
              }
            });
            // create stock change
            const addedProductStockChange = await tx.productStockChange.create({
              data: {
                stock_id: updatedProductStock.id,
                change_id: addedProductStockChangeHistory.id,
                quantity_change: productOrder.quantity,
              }
            });
          }
        }
      }
    });

  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot update vendor order with the given data.")
  }
}