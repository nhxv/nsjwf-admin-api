import { generateCurrentTime, convertLocalExpected, convertLocalStart, convertLocalInterval } from "./../commons/time.util";
import { ProductStockChangeReason } from "./../commons/product-stock-change-reason.enum";
import { generateCode } from "../commons/code.util";
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
        productVendorOrders: true,
      },
      orderBy: {
        updated_at: "asc",
      },
    });
    for (let i = 0; i < vendorSolds.length; i++) {
      const saleReturn = await prisma.vendorSaleReturn.findUnique({
        where: {
          sale_code: vendorSolds[i].code
        },
        include: {
          productVendorSaleReturns: true,
        }
      });
      if (!saleReturn || saleReturn.productVendorSaleReturns.find(p => p.quantity !== 0)) {
        vendorSolds[i]["fullReturn"] = false;
      } else {
        vendorSolds[i]["fullReturn"] = true;
      }
    }
    return vendorSolds;
  } catch (error) {
    throw new createError.BadRequest("Cannot find vendor sale with the given data.");    
  }
}

export const createVendorOrder = async (vendorOrderDto: VendorOrderRequestDto) => {
  try {
    const vendorOrderData: VendorOrderRequestDto = await vendorOrderSchema.validateAsync(vendorOrderDto);
    if (!(Object.values(OrderStatus) as string[]).includes(vendorOrderData.status)) {
      throw `Please don't attack us.`;
    }
    const notZero = vendorOrderData.productVendorOrders.filter(
      po => po.quantity > 0 && new Prisma.Decimal(po.unitPrice).greaterThan(new Prisma.Decimal(0))
    );
    if (notZero.length < 1) {
      throw `Hollow order.`;
    }
    const { code, time } = generateCode();
    const productOrders = notZero.map(
      productOrder => ({
        product_name: productOrder.productName,
        order_code: productOrder.orderCode,
        unit_price: new Prisma.Decimal(new Prisma.Decimal(productOrder.unitPrice).toPrecision(2)),
        quantity: productOrder.quantity,
        created_at: time,
        updated_at: time,
      })
    );

    if (vendorOrderData.status === OrderStatus.COMPLETED) {
      // if vendor order is completed, update stock
      return await prisma.$transaction(async (tx) => {
        // create new order
        const newVendorOrder = await prisma.vendorOrder.create({
          data: {
            code: code,
            vendor_name: vendorOrderData.vendorName,
            status: vendorOrderData.status,
            created_at: time,
            updated_at: time,
            expected_at: convertLocalExpected(vendorOrderData.expectedAt),
            is_test: vendorOrderData.isTest,
            is_sold: true,
            productVendorOrders: {
              create: productOrders
            }
          }
        });
        // create product stock change history
        const addedProductStockChangeHistory = await tx.productStockChangeHistory.create({
          data: {
            created_at: time,
            reason: ProductStockChangeReason.VENDOR_ORDER_COMPLETED,
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
          updated_at: time,
          expected_at: convertLocalExpected(vendorOrderData.expectedAt),
          is_test: vendorOrderData.isTest,
          is_sold: false,
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
    if (!(Object.values(OrderStatus) as string[]).includes(vendorOrderData.status)) {
      throw `Please don't attack us.`;
    }
    if (vendorOrderData.code !== code) {
      throw `Please don't attack us.`;
    }
    const notZero = vendorOrderData.productVendorOrders.filter(
      po => po.quantity > 0 && new Prisma.Decimal(po.unitPrice).greaterThan(new Prisma.Decimal(0))
    );
    if (notZero.length < 1) {
      throw `Hollow order.`;
    }

    const time = generateCurrentTime();
    const productOrders = vendorOrderData.productVendorOrders.map(
      productOrder => ({
        product_name: productOrder.productName,
        quantity: productOrder.quantity,
        unit_price: new Prisma.Decimal(new Prisma.Decimal(productOrder.unitPrice).toPrecision(2)),
        order_code: vendorOrderData.code,
        updated_at: time,
      })
    );
    return await prisma.$transaction(async (tx) => {
      const isCompleted = (vendorOrderData.status === OrderStatus.COMPLETED);
      // update vendor order table if that order IS NOT completed
      let existingOrder;
      try {
        existingOrder = await tx.vendorOrder.update({
          where: {
            VendorOrderSold_key: {
              code: vendorOrderData.code,
              is_sold: false,
            }
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
            is_sold: isCompleted
          }
        });
      } catch (e) {
        throw `This order cannot be changed.`;
      }

      const existingProductOrders = new Map();
      for (const product of existingOrder.productVendorOrders) {
        existingProductOrders.set(product.product_name, {
          product_name: product.product_name,
          quantity: product.quantity,
          unit_price: product.unit_price,
          updated_at: product.updated_at,
        });
      }

      let addedProductStockChangeHistory;
      if (isCompleted) {
        // create stock change history only if order is completed
        addedProductStockChangeHistory = await tx.productStockChangeHistory.create({
          data: {
            created_at: time,
            reason: ProductStockChangeReason.VENDOR_ORDER_COMPLETED,
          }
        });
      }
      for (const productOrder of productOrders) {
        // remove product order. when quantity || price = 0 & product is not in existing order, skip.
        if (productOrder.quantity === 0 || productOrder.unit_price.equals(new Prisma.Decimal(0))) {
          const existingProductOrder = existingProductOrders.get(productOrder.product_name);
          if (existingProductOrder) {
            const deletedProductOrder = await tx.productVendorOrder.delete({
              where: {
                ProductVendorOrder_key: {
                  product_name: productOrder.product_name,
                  order_code: productOrder.order_code,
                }              
              }
            });
          }
        } else {
          // upsert product vendor order
          const updatedProductOrder = await tx.productVendorOrder.upsert({
            where: {
              ProductVendorOrder_key: {
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
              updated_at: time,
            },
          });
          
          if (isCompleted) {
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
    console.log(error);
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot update vendor order with the given data.");
  }
}