import { generateCurrentTime, convertLocalExpected, convertLocalStart, convertLocalEnd } from "./../commons/time.util";
import { customerOrderSchema } from "./../dto/requests/customer-order-request.dto";
import { CustomerOrderRequestDto } from "../dto/requests/customer-order-request.dto";
import { OrderStatus } from "../commons/order-status.enum";
import createError  from "http-errors";
import { Prisma } from "@prisma/client";
import { generateOrderCode } from "../commons/order.util";
import { ProductStockChangeReason } from "../commons/product-stock-change-reason.enum";

export const findCustomerOrderByStatus = async (status: string) => {
  try {
    if (!(Object.values(OrderStatus) as string[]).includes(status)) {
      throw `Please don't attack us.`;
    }
    let customerOrders;
    if (status === OrderStatus.DELIVERED) {
      customerOrders = await prisma.customerOrder.findMany({
        where: {
          status: status,
          updated_at: {
            gte: convertLocalStart(),
            lte: convertLocalEnd(),
          }
        },
        include: {
          productCustomerOrders: true,
        },
        orderBy: {
          updated_at: "asc",
        },
      });
    } else {
      customerOrders = await prisma.customerOrder.findMany({
        where: {
          status: status,
          expected_at: {
            gte: convertLocalStart(),
          }
        },
        include: {
          productCustomerOrders: true,
        },
        orderBy: {
          expected_at: "asc",
        },
      });
    }

    return customerOrders;
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot find customer order with the given status.");
  }
}

export const findCustomerOrderByCode = async (code: string) => {
  try {
    const customerOrder = await prisma.customerOrder.findUniqueOrThrow({
      where: {
        code: code,
      },
      include: {
        productCustomerOrders: true,
      }
    })
    return customerOrder;
  } catch (error) {
    throw new createError.BadRequest("Cannot find customer order with the given code.");
  }
}

export const createCustomerOrder = async (customerOrderDto: CustomerOrderRequestDto) => {
  try {
    // Validate customer order
    const customerOrderData: CustomerOrderRequestDto = await customerOrderSchema.validateAsync(customerOrderDto);
    if (!Object.keys(OrderStatus).includes(customerOrderData.status)) {
      throw `Please don't attack us.`;
    }
    const notRemovedList = customerOrderData.productCustomerOrders.filter(po => po.quantity > 0);
    if (notRemovedList.length < 1) {
      throw `Hollow order.`;
    }
    const { code, time } = generateOrderCode();
    const productOrders = customerOrderData.productCustomerOrders.map(
      productOrder => ({
        product_name: productOrder.productName,
        order_code: productOrder.orderCode,
        unit_price: new Prisma.Decimal(productOrder.unitPrice),
        quantity: productOrder.quantity,
        created_at: time,
      })
    );

    return await prisma.$transaction(async (tx) => {
      // 1. create customer order
      const newCustomerOrder = await tx.customerOrder.create({
        data: {
          code: code,
          customer_name: customerOrderData.customerName,
          status: customerOrderData.status,
          created_at: time,
          expected_at: convertLocalExpected(customerOrderData.expectedAt, 22),
          is_test: customerOrderData.isTest,
          is_invoice: (customerOrderData.status === OrderStatus.DELIVERED),
          productCustomerOrders: {
            create: productOrders
          }
        }
      });

      // 2. create stock change history
      const addedProductStockChangeHistory = await tx.productStockChangeHistory.create({
        data: {
          created_at: time,
          reason: ProductStockChangeReason.CUSTOMER_ORDER_CREATE,
        }
      });

      for (const productOrder of productOrders) {
        const currentProductStock = await tx.productStock.findUniqueOrThrow({
          where: {
            product_name: productOrder.product_name,
          },
        });
        
        if (currentProductStock.quantity < productOrder.quantity) 
          throw `${productOrder.product_name}: Only ${currentProductStock.quantity} in stock.`;

        const stockQuantityChange = 0 - productOrder.quantity;

        // update product stock
        const updatedProductStock = await tx.productStock.update({
          where: {
            product_name: productOrder.product_name,
          },
          data: {
            quantity: {
              increment: stockQuantityChange,
            },
            updated_at: time,
          }
        });
        // create stock change
        const addedProductStockChange = await tx.productStockChange.create({
          data: {
            stock_id: updatedProductStock.id,
            change_id: addedProductStockChangeHistory.id,
            quantity_change: stockQuantityChange,
          }
        });
      }
    });
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot create customer order with the given data.");
  }
}

export const updateCustomerOrder = async (code: string, customerOrderDto: CustomerOrderRequestDto) => {
  try {
    // Validate customer order
    const customerOrderData: CustomerOrderRequestDto = await customerOrderSchema.validateAsync(customerOrderDto);
    if (!Object.keys(OrderStatus).includes(customerOrderData.status)) {
      throw `Please don't attack us.`;
    }
    if (customerOrderData.code !== code) {
      throw `Please don't attack us.`;
    }
    const notRemovedList = customerOrderData.productCustomerOrders.filter(po => !po.isRemove && po.quantity > 0);
    if (notRemovedList.length < 1) {
      throw `Hollow order.`;
    }
    const time = generateCurrentTime();
    const productOrders = customerOrderData.productCustomerOrders.map(
      productOrder => ({
        product_name: productOrder.productName,
        order_code: customerOrderData.code,
        unit_price: new Prisma.Decimal(productOrder.unitPrice),
        quantity: productOrder.quantity,
        updated_at: time,
        is_remove: productOrder.isRemove,
      })
    );

    return await prisma.$transaction(async (tx) => {
      // update customer order table if that order IS NOT delivered
      const isDelivered = (customerOrderData.status === OrderStatus.DELIVERED);
      try {
        const updatedOrder = await tx.customerOrder.update({
          where: {
            CustomerOrderInvoice_key: {
              code: customerOrderData.code,
              is_invoice: false,
            }
          },
          data: {
            customer_name: customerOrderData.customerName,
            status: customerOrderData.status,
            updated_at: time,
            is_test: customerOrderData.isTest,
            is_invoice: isDelivered,
            expected_at: convertLocalExpected(customerOrderData.expectedAt, 22),
          }
        });
      } catch (e) {
        throw `This order cannot be changed.`;
      }

      // update product stock change history
      const addedProductStockChangeHistory = await tx.productStockChangeHistory.create({
        data: {
          created_at: time,
          reason: ProductStockChangeReason.CUSTOMER_ORDER_EDIT,
        }
      });

      for (const productOrder of productOrders) {
        let orderQuantityChange = 0;
        let stockQuantityChange = 0;
        
        // find current product order
        const currentProductOrder = await tx.productCustomerOrder.findUnique({
          where: {
            ProductCustomerOrder_product_name_order_code_key: {
              product_name: productOrder.product_name,
              order_code: productOrder.order_code,
            }              
          } 
        });

        if (!currentProductOrder) {
          // 1. insert product order if not exist
          orderQuantityChange = productOrder.quantity;
          stockQuantityChange = 0 - productOrder.quantity;

          // check product stock
          const currentProductStock = await tx.productStock.findUniqueOrThrow({
            where: {
              product_name: productOrder.product_name,
            },
          });
          if (currentProductStock.quantity + stockQuantityChange < 0) {
            throw `${productOrder.product_name}: Only ${currentProductStock.quantity} in stock.`;
          }
          const newProductOrder = await tx.productCustomerOrder.create({
            data: {
              product_name: productOrder.product_name,
              order_code: productOrder.order_code,
              quantity: productOrder.quantity,
              unit_price: productOrder.unit_price,
              created_at: time,
            }
          });
          // update product stock
          const updatedProductStock = await tx.productStock.update({
            where: {
              product_name: productOrder.product_name,
            },
            data: {
              quantity: {
                increment: stockQuantityChange,
              },
              updated_at: time,
            }
          });
          // create stock change
          const addedProductStockChange = await tx.productStockChange.create({
            data: {
              stock_id: updatedProductStock.id,
              change_id: addedProductStockChangeHistory.id,
              quantity_change: stockQuantityChange,
            }
          });
        } else {
          // if product exist
          if (productOrder.is_remove) {
            stockQuantityChange = currentProductOrder.quantity;
            // 2. remove existing product order
            const deletedProductOrder = await tx.productCustomerOrder.delete({
              where: {
                ProductCustomerOrder_product_name_order_code_key: {
                  product_name: productOrder.product_name,
                  order_code: productOrder.order_code,
                }  
              }
            });
            // update product stock
            const updatedProductStock = await tx.productStock.update({
              where: {
                product_name: productOrder.product_name,
              },
              data: {
                quantity: {
                  increment: stockQuantityChange,
                },
                updated_at: time,
              }
            });
            // create stock change
            const addedProductStockChange = await tx.productStockChange.create({
              data: {
                stock_id: updatedProductStock.id,
                change_id: addedProductStockChangeHistory.id,
                quantity_change: stockQuantityChange,
              }
            });            
          } else {
            // 3. update existing product order
            orderQuantityChange = productOrder.quantity - currentProductOrder.quantity;
            stockQuantityChange = currentProductOrder.quantity - productOrder.quantity;

            // check product stock
            const currentProductStock = await tx.productStock.findUniqueOrThrow({
              where: {
                product_name: productOrder.product_name,
              },
            });
            if (currentProductStock.quantity + stockQuantityChange < 0) {
              throw `${productOrder.product_name}: Only ${currentProductStock.quantity} in stock.`;
            }            

            // update product order
            const updatedProductOrder = await tx.productCustomerOrder.update({
              where: {
                ProductCustomerOrder_product_name_order_code_key: {
                  product_name: productOrder.product_name,
                  order_code: productOrder.order_code,
                }                  
              },
              data: {
                quantity: {
                  increment: orderQuantityChange,
                },
                unit_price: productOrder.unit_price,
                updated_at: productOrder.updated_at,
              }
            });
            
            // update product stock
            const updatedProductStock = await tx.productStock.update({
              where: {
                product_name: productOrder.product_name,
              },
              data: {
                quantity: {
                  increment: stockQuantityChange,
                },
                updated_at: time,
              }
            });
            
            // create stock change
            const addedProductStockChange = await tx.productStockChange.create({
              data: {
                stock_id: updatedProductStock.id,
                change_id: addedProductStockChangeHistory.id,
                quantity_change: stockQuantityChange,
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
    throw new createError.BadRequest("Cannot update customer order with the given data.");
  }
}