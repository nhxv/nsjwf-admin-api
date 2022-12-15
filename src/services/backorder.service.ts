import { ProductStockChangeReason } from "../commons/product-stock-change-reason.enum";
import { CustomerOrderRequestDto } from "../dto/requests/customer-order-request.dto";
import { Prisma } from "@prisma/client";
import prisma from "../../prisma/prisma-client";
import createError  from "http-errors";
import { generateCurrentTime, convertLocalExpected, convertLocalStart } from "../commons/time.util";
import { generateOrderCode } from "../commons/order.util";
import { BackorderRequestDto, backorderSchema } from "../dto/requests/backorder-request.dto";
import { customerOrderSchema } from "../dto/requests/customer-order-request.dto";
import { OrderStatus } from "../commons/order-status.enum";
import { BackorderStatus } from "../commons/backorder-status.enum";

export const findBackorderByStatus = async (status: string) => {
  try {
    let isArchived;
    if (status === BackorderStatus.PENDING) {
      isArchived = false;
    } else if (status === BackorderStatus.ARCHIVED) {
      isArchived = true;
    } else {
      throw `Please don't hack us.`;
    }
    const backorders = await prisma.backorder.findMany({
      where: {
        is_archived: isArchived,
        expected_at: {
          gte: convertLocalStart(),
        }
      },
      include: {
        productBackorders: true,
      },
      orderBy: {
        expected_at: "asc",
      }
    });
    return backorders;
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot find backorder.");
  }
};

export const findBackorderById = async (id:number) => {
  try {
    const backorder = await prisma.backorder.findUniqueOrThrow({
      where: {
        id: id,
      },
      include: {
        productBackorders: true,
      }
    });
    return backorder;
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot find backorder with the given data.");
  }
}

export const createBackorder = async (backorderDto: BackorderRequestDto) => {
  try {
    // Validate
    const backorderData: BackorderRequestDto = await backorderSchema.validateAsync(backorderDto);
    if (backorderData.isArchived) {
      throw `Please don't hack us.`;
    }
    const notRemovedList = backorderData.productBackorders.filter(po => po.quantity > 0);
    if (notRemovedList.length < 1) {
      throw `Hollow order.`;
    }
    const time = generateCurrentTime();
    const productOrders = backorderData.productBackorders.map(
      productOrder => ({
        product_name: productOrder.productName,
        unit_price: new Prisma.Decimal(productOrder.unitPrice),
        quantity: productOrder.quantity,
        created_at: time,
      })
    );

    const newBackorder = await prisma.backorder.create({
      data: {
        customer_name: backorderData.customerName,
        created_at: time,
        expected_at: convertLocalExpected(backorderData.expectedAt, 22),
        is_test: backorderData.isTest,
        is_archived: backorderData.isArchived,
        productBackorders: {
          create: productOrders
        }
      }
    });
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot add backorder with the given data.");
  }
};

export const updateBackorder = async (id: number, backorderDto: BackorderRequestDto) => {
  try {
    // Validate
    const backorderData: BackorderRequestDto = await backorderSchema.validateAsync(backorderDto);
    if (backorderData.isArchived) {
      throw `Please don't hack us.`;
    }
    if (backorderData.id !== id) {
      throw `Please don't hack us.`;
    }
    const notRemovedList = backorderData.productBackorders.filter(po => !po.isRemove && po.quantity > 0);
    if (notRemovedList.length < 1)  {
      throw `Hollow order.`;
    }

    const time = generateCurrentTime();
    const productOrders = backorderData.productBackorders.map(
      productOrder => ({
        product_name: productOrder.productName,
        backorder_id: backorderData.id,
        quantity: productOrder.quantity,
        unit_price: new Prisma.Decimal(productOrder.unitPrice),
        updated_at: time,
        isRemove: productOrder.isRemove,
      })
    );

    return await prisma.$transaction(async (tx) => {
      // update backorder if backorder is not archived
      try {
        const updatedOrder = await tx.backorder.update({
          where: {
            BackorderArchive_key: {
              id: backorderData.id,
              is_archived: false,
            }
          },
          data: {
            customer_name: backorderData.customerName,
            updated_at: time,
            expected_at: backorderData.expectedAt,
            is_test: backorderData.isTest,
          }
        });
      } catch (e) {
        throw `This backorder cannot be changed.`;
      }

      for (const productOrder of productOrders) {
        let orderQuantityChange = 0;

        // find current order quantity
        const currentProductOrder = await tx.productBackorder.findUnique({
          where: {
            ProductBackorder_product_name_backorder_id_key: {
              product_name: productOrder.product_name,
              backorder_id: productOrder.backorder_id,
            }
          },
        });
        if (!currentProductOrder) {
          // 1. insert new product order
          orderQuantityChange = productOrder.quantity;

          // create product backorder
          const createdProductOrder = await tx.productBackorder.create({
            data: {
              product_name: productOrder.product_name,
              backorder_id: productOrder.backorder_id,
              quantity: orderQuantityChange,
              unit_price: productOrder.unit_price,
              created_at: time,
            },
          });
        } else if (productOrder.isRemove) {
          // 2. remove existing product order
          const deletedProductOrder = await tx.productBackorder.delete({
            where: {
              ProductBackorder_product_name_backorder_id_key: {
                product_name: productOrder.product_name,
                backorder_id: productOrder.backorder_id,
              }
            },
          });
          orderQuantityChange = productOrder.quantity - deletedProductOrder.quantity;       
        } else {
          // 3. update existing order
          orderQuantityChange = productOrder.quantity - currentProductOrder.quantity;

          // update product backorder
          const updatedProductOrder = await tx.productBackorder.update({
            where: {
              ProductBackorder_product_name_backorder_id_key: {
                product_name: productOrder.product_name,
                backorder_id: productOrder.backorder_id,
              }
            },
            data: {
              quantity: {
                increment: orderQuantityChange,
              },
              unit_price: productOrder.unit_price,
              updated_at: productOrder.updated_at,
            },
          });       
        }          
      }
    });    
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot update backorder with the given data.");
  }
};

export const convertBackorder = async (id: number, backorderDto: BackorderRequestDto) => {
  try {
    // Validate backorder data
    const backorderData: BackorderRequestDto = await backorderSchema.validateAsync(backorderDto);
    if (backorderDto.id !== id) {
      throw `Please don't hack us.`;
    }
    if (!backorderData.isArchived) {
      throw `Please don't hack us.`;
    }

    const { code, time } = generateOrderCode();

    // convert backorder to a newly created customer order
    const customerOrderDto = new CustomerOrderRequestDto(
      backorderData.customerName,
      backorderData.productBackorders,
      backorderData.isTest,
      backorderData.expectedAt,
      code,
      OrderStatus.PICKING,
      time,
    );

    // Validate customer order
    const customerOrderData: CustomerOrderRequestDto = await customerOrderSchema.validateAsync(customerOrderDto);
    if (!Object.keys(OrderStatus).includes(customerOrderData.status)) {
      throw `Please don't attack us.`;
    }
    const notRemovedList = customerOrderData.productCustomerOrders.filter(po => po.quantity > 0);
    if (notRemovedList.length < 1) {
      throw `Hollow order.`;
    }
    
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
      // archive backorder
      try {
        const archiveBackorder = await tx.backorder.update({
          where: {
            BackorderArchive_key: {
              id: backorderData.id,
              is_archived: false,
            }
          },
          data: {
            is_archived: true,
          }
        });
      } catch (error) {
        throw `This order cannot be changed.`;
      }

      // final update to product backorder
      for (const productOrder of backorderData.productBackorders) {
        // update product backorder
        const updatedProductOrder = await tx.productBackorder.update({
          where: {
            ProductBackorder_product_name_backorder_id_key: {
              product_name: productOrder.productName,
              backorder_id: id,
            }
          },
          data: {
            quantity: productOrder.quantity,
            unit_price: productOrder.unitPrice,
            updated_at: time,
          },
        });  
      }

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
        const stockQuantityChange = 0 - productOrder.quantity;

        if (currentProductStock.quantity + stockQuantityChange < 0) 
          throw `${productOrder.product_name}: Only ${currentProductStock.quantity} in stock.`;

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

        // create product stock change
        const addedProductStockChange = await tx.productStockChange.create({
          data: {
            stock_id: updatedProductStock.id,
            change_id: addedProductStockChangeHistory.id,
            quantity_change: stockQuantityChange,
          }
        });    
      }
    })
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot convert backorder with the given data.");    
  }
}