import { generateCurrentTime, convertLocalExpected, convertLocalStart, convertLocalEnd, convertLocalInterval } from "./../commons/time.util";
import { customerOrderSchema } from "./../dto/requests/customer-order-request.dto";
import { CustomerOrderRequestDto } from "../dto/requests/customer-order-request.dto";
import { OrderStatus } from "../commons/order-status.enum";
import createError  from "http-errors";
import { Prisma } from "@prisma/client";
import { generateCode } from "../commons/code.util";
import { ProductStockChangeReason } from "../commons/product-stock-change-reason.enum";

export const findCustomerOrderByStatus = async (status: string) => {
  try {
    if (!(Object.values(OrderStatus) as string[]).includes(status) || status === OrderStatus.COMPLETED) {
      throw `Please don't hack us.`;
    }
    const customerOrders = await prisma.customerOrder.findMany({
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

export const findCustomerSale = async (customerName: string, date: string) => {
  try {
    const { start, end } = convertLocalInterval(new Date(date));
    const customerSolds = await prisma.customerOrder.findMany({
      where: {
        customer_name: {
          contains: customerName,
          mode: "insensitive",
        },
        status: OrderStatus.COMPLETED,
        updated_at: {
          gte: start,
          lte: end,
        },
      },
      include: {
        productCustomerOrders: true,
      },
      orderBy: {
        updated_at: "asc",
      },
    });
    for (let i = 0; i < customerSolds.length; i++) {
      const saleReturn = await prisma.customerSaleReturn.findUnique({
        where: {
          sale_code: customerSolds[i].code
        },
        include: {
          productCustomerSaleReturns: true,
        }
      });
      if (!saleReturn || saleReturn.productCustomerSaleReturns.find(p => p.quantity !== 0)) {
        customerSolds[i]["fullReturn"] = false;
      } else {
        customerSolds[i]["fullReturn"] = true;
      }
    }
    return customerSolds;
  } catch (error) {
    throw new createError.BadRequest("Cannot find customer sale with the given data.");    
  }
}

export const reportCustomerSale = async () => {
  try {
    // find daily solds
    const customerSolds = await prisma.customerOrder.findMany({
      where: {
        status: OrderStatus.COMPLETED,
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
    // find daily return
    const returns = await prisma.customerReturn.findMany({
      where: {
        created_at: {
          gte: convertLocalStart(),
          lte: convertLocalEnd(),          
        }
      },
      include: {
        productCustomerReturns: true,
      },
      orderBy: {
        created_at: "asc",
      }
    })
    const reports = [];
    for (const sold of customerSolds) {
      reports.push({
        is_test: sold.is_test,
        order_code: sold.code,
        customer_name: sold.customer_name,
        sale: sold.productCustomerOrders.reduce((prev, curr: any) => prev + curr.quantity*curr.unit_price, 0),
        refund: 0,
        refund_order: "",
        date: sold.updated_at,
        productCustomerOrders: sold.productCustomerOrders,
      });
    }
    for (const customerReturn of returns) {
      let found = false;
      for (let i = 0; i < reports.length; i++) {
        if (customerReturn.customer_name === reports[i].customer_name) {
          const newRefund = customerReturn.final_price;
          if (newRefund <= reports[i].sale) {
            found = true;
            reports[i] = {
              ...reports[i], 
              refund: newRefund,
              refund_order: customerReturn.order_code,
            }
            break;
          }
        }
      }
      if (!found) {
        const sum = customerReturn.productCustomerReturns.reduce((prev, curr: any) => prev + curr.quantity*curr.unit_price, 0);
        reports.push({
          is_test: false,
          order_code: "NONE",
          customer_name: customerReturn.customer_name,
          sale: -1,
          refund: customerReturn.final_price,
          refund_order: customerReturn.order_code,
          date: customerReturn.created_at,
          productCustomerOrders: [],
        })
      }
    }
    return reports;
  } catch (error) {
    throw new createError.BadRequest("Cannot report.");
  }
}

export const findEmployeeTask = async (nickname: string, status: string) => {
  try {
    // validate status
    if (status !== OrderStatus.PICKING && status !== OrderStatus.SHIPPING) {
      throw `Please don't hack us.`;
    }
    const tasks = await prisma.customerOrder.findMany({
      where: {
        assign_to: nickname,
        is_sold: false,
        status: status,
      },
      include: {
        productCustomerOrders: true,
      }
    });
    return tasks;
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot find task by the given data");
  }
}

export const createCustomerOrder = async (customerOrderDto: CustomerOrderRequestDto) => {
  try {
    // Validate customer order
    const customerOrderData: CustomerOrderRequestDto = await customerOrderSchema.validateAsync(customerOrderDto);
    if (!(Object.values(OrderStatus) as string[]).includes(customerOrderData.status)) {
      throw `Please don't attack us.`;
    }
    const notZero = customerOrderData.productCustomerOrders.filter(
      po => po.quantity > 0 && new Prisma.Decimal(po.unitPrice).greaterThan(new Prisma.Decimal(0))
    );
    if (notZero.length < 1) {
      throw `Hollow order.`;
    }
    const employee = await prisma.account.findUniqueOrThrow({
      where: {
        nickname: customerOrderData.assignTo,
      }
    });
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

    return await prisma.$transaction(async (tx) => {
      // 1. create customer order
      const newCustomerOrder = await tx.customerOrder.create({
        data: {
          code: code,
          customer_name: customerOrderData.customerName,
          status: customerOrderData.status,
          created_at: time,
          updated_at: time,
          expected_at: convertLocalExpected(customerOrderData.expectedAt),
          is_test: customerOrderData.isTest,
          assign_to: employee.nickname,
          is_sold: (customerOrderData.status === OrderStatus.COMPLETED),
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
    if (!(Object.values(OrderStatus) as string[]).includes(customerOrderData.status)) {
      throw `Please don't attack us.`;
    }
    if (customerOrderData.code !== code) {
      throw `Please don't attack us.`;
    }
    const notZero = customerOrderData.productCustomerOrders.filter(
      po => po.quantity > 0 && new Prisma.Decimal(po.unitPrice).greaterThan(new Prisma.Decimal(0))
    );
    if (notZero.length < 1) {
      throw `Hollow order.`;
    }
    const employee = await prisma.account.findUniqueOrThrow({
      where: {
        nickname: customerOrderData.assignTo,
      }
    });
    const time = generateCurrentTime();
    const productOrders = customerOrderData.productCustomerOrders.map(
      productOrder => ({
        product_name: productOrder.productName,
        order_code: customerOrderData.code,
        unit_price: new Prisma.Decimal(new Prisma.Decimal(productOrder.unitPrice).toPrecision(2)),
        quantity: productOrder.quantity,
        updated_at: time,
      })
    );

    return await prisma.$transaction(async (tx) => {
      // update customer order if that order IS NOT completed
      let existingOrder;
      try {
        existingOrder = await tx.customerOrder.update({
          where: {
            CustomerOrderSold_key: {
              code: customerOrderData.code,
              is_sold: false,
            }
          },
          include: {
            productCustomerOrders: true,
          },
          data: {
            customer_name: customerOrderData.customerName,
            status: customerOrderData.status,
            updated_at: time,
            is_test: customerOrderData.isTest,
            assign_to: employee.nickname,
            is_sold: customerOrderData.status === OrderStatus.COMPLETED,
            expected_at: convertLocalExpected(customerOrderData.expectedAt),
          }
        });
      } catch (e) {
        throw `This order cannot be changed.`;
      }
      const existingProductOrders = new Map();
      for (const product of existingOrder.productCustomerOrders) {
        existingProductOrders.set(product.product_name, {
          product_name: product.product_name,
          quantity: product.quantity,
          unit_price: product.unit_price,
          updated_at: product.updated_at,
        });
      }

      // create stock change history
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
        const currentProductOrder = existingProductOrders.get(productOrder.product_name);

        if (!currentProductOrder) {
          // 1. insert product order. if product not in current order and quantity || price = 0, skip.
          if (productOrder.quantity > 0 && productOrder.unit_price.greaterThan(new Prisma.Decimal(0))) {
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
                updated_at: time,
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
        } else {
          // if product existing in current order
          if (productOrder.quantity === 0 || productOrder.unit_price.equals(new Prisma.Decimal(0))) {
            stockQuantityChange = currentProductOrder.quantity;
            // 2. remove existing product order - auto throw if not exist
            const deletedProductOrder = await tx.productCustomerOrder.delete({
              where: {
                ProductCustomerOrder_key: {
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
                ProductCustomerOrder_key: {
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

export const finishTask = async (code: string) => {
  try {
    const currentOrder = await prisma.customerOrder.findUniqueOrThrow({
      where: {
        code: code,
      },
      include: {
        productCustomerOrders: true,
      }
    });
    if (currentOrder.status !== OrderStatus.PICKING && currentOrder.status !== OrderStatus.SHIPPING) {
      throw `Please don't hack us.`;
    }
    const time = generateCurrentTime();
    return await prisma.$transaction(async (tx) => {
      // update order
      const updatedOrder = await tx.customerOrder.update({
        where: {
          code: code,
        },
        data: {
          status: (currentOrder.status === OrderStatus.PICKING ? OrderStatus.CHECKING : OrderStatus.DELIVERED),
          updated_at: time,
        }
      });

      // register task history
      const createdTask = await tx.orderTaskHistory.create({
        data: {
          order_code: updatedOrder.code,
          employee_name: updatedOrder.assign_to,
          type: currentOrder.status,
          created_at: time,
        }
      });
    });
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot register finished task.");
  }
}