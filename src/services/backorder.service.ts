import { Prisma } from "@prisma/client";
import Fraction from "fraction.js";
import createError from "http-errors";
import prisma from "../../prisma/prisma-client";
import { BackorderStatus } from "../commons/enums/backorder-status.enum";
import { OrderStatus } from "../commons/enums/order-status.enum";
import { handleValidationError } from "../commons/http.exception";
import { generateCode } from "../commons/utils/code.util";
import {
  convertLocalExpected,
  convertLocalStart,
  generateCurrentTime
} from "../commons/utils/time.util";
import {
  BackorderRequestDto,
  backorderSchema
} from "../dto/requests/backorder-request.dto";
import {
  CustomerOrderRequestDto,
  customerOrderSchema
} from "../dto/requests/customer-order-request.dto";
import { StockChangeReason } from "./../commons/enums/stock-change-reason.enum";

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
        },
      },
      include: {
        productBackorders: {
          orderBy: {
            product_name: "asc",
          },
        },
      },
      orderBy: {
        expected_at: "asc",
      },
    });
    return backorders;
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }

    throw new createError.BadRequest("Cannot find backorder.");
  }
};

export const findBackorderById = async (id: number) => {
  try {
    const backorder = await prisma.backorder.findUniqueOrThrow({
      where: {
        id: id,
      },
      include: {
        productBackorders: {
          orderBy: {
            product_name: "asc",
          },
        },
      },
    });
    return backorder;
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest(
      "Cannot find backorder with the given data."
    );
  }
};

export const createBackorder = async (backorderDto: BackorderRequestDto) => {
  try {
    // Validate
    const backorderData: BackorderRequestDto =
      await backorderSchema.validateAsync(backorderDto);
    if (backorderData.isArchived) {
      throw `Please don't hack us.`;
    }
    const time = generateCurrentTime();
    const productOrders = backorderData.productBackorders.map(
      (productOrder) => ({
        product_name: productOrder.productName,
        quantity: productOrder.quantity,
        unit_code: productOrder.unitCode,
        unit_price: new Prisma.Decimal(
          new Prisma.Decimal(productOrder.unitPrice).toPrecision(2)
        ),
        created_at: time,
        updated_at: time,
      })
    );

    const newBackorder = await prisma.backorder.create({
      data: {
        customer_name: backorderData.customerName,
        created_at: time,
        updated_at: time,
        expected_at: convertLocalExpected(backorderData.expectedAt),
        is_test: backorderData.isTest,
        is_archived: backorderData.isArchived,
        assign_to: backorderData.assignTo,
        productBackorders: {
          create: productOrders,
        },
      },
    });
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    if (error.details?.length > 0) {
      handleValidationError(error);
    }
    throw new createError.BadRequest(
      "Cannot add backorder with the given data."
    );
  }
};

export const updateBackorder = async (
  id: number,
  backorderDto: BackorderRequestDto
) => {
  try {
    // Validate
    const backorderData: BackorderRequestDto =
      await backorderSchema.validateAsync(backorderDto);
    if (backorderData.isArchived) {
      throw `Please don't hack us.`;
    }
    if (backorderData.id !== id) {
      throw `Please don't hack us.`;
    }

    const time = generateCurrentTime();
    const productOrders = backorderData.productBackorders.map(
      (productOrder) => ({
        product_name: productOrder.productName,
        backorder_id: backorderData.id,
        quantity: productOrder.quantity,
        unit_code: productOrder.unitCode,
        unit_price: new Prisma.Decimal(
          new Prisma.Decimal(productOrder.unitPrice).toPrecision(2)
        ),
        updated_at: time,
      })
    );

    return await prisma.$transaction(async (tx) => {
      // update backorder if backorder is not archived
      let existingOrder;
      try {
        existingOrder = await tx.backorder.update({
          where: {
            BackorderArchive_key: {
              id: backorderData.id,
              is_archived: false,
            },
          },
          include: {
            productBackorders: true,
          },
          data: {
            customer_name: backorderData.customerName,
            updated_at: time,
            expected_at: convertLocalExpected(backorderData.expectedAt),
            is_test: backorderData.isTest,
            assign_to: backorderData.assignTo,
          },
        });
      } catch (e) {
        throw `This backorder cannot be changed.`;
      }

      const existingProductOrders = new Map();
      for (const productOrder of existingOrder.productBackorders) {
        existingProductOrders.set(productOrder.product_name, {
          product_name: productOrder.product_name,
          quantity: productOrder.quantity,
          unit_code: productOrder.unitCode,
          unit_price: productOrder.unit_price,
          updated_at: productOrder.updated_at,
        });
        const found = productOrders.find(
          (po) => po.product_name === productOrder.product_name
        );
        if (!found) {
          // remove existing product order
          const deletedProductOrder = await tx.productBackorder.delete({
            where: {
              ProductBackorder_key: {
                product_name: productOrder.product_name,
                backorder_id: productOrder.backorder_id,
              },
            },
          });
        }
      }

      for (const productOrder of productOrders) {
        // find current product order
        const currentProductOrder = existingProductOrders.get(
          productOrder.product_name
        );

        if (!currentProductOrder) {
          // create product backorder
          const createdProductOrder = await tx.productBackorder.create({
            data: {
              product_name: productOrder.product_name,
              backorder_id: productOrder.backorder_id,
              quantity: productOrder.quantity,
              unit_code: productOrder.unit_code,
              unit_price: productOrder.unit_price,
              created_at: time,
              updated_at: time,
            },
          });
        } else {
          // update existing product backorder
          const updatedProductOrder = await tx.productBackorder.update({
            where: {
              ProductBackorder_key: {
                product_name: productOrder.product_name,
                backorder_id: productOrder.backorder_id,
              },
            },
            data: {
              quantity: productOrder.quantity,
              unit_code: productOrder.unit_code,
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
    if (error.details?.length > 0) {
      handleValidationError(error);
    }
    throw new createError.BadRequest(
      "Cannot update backorder with the given data."
    );
  }
};

export const convertBackorder = async (
  id: number,
  backorderDto: BackorderRequestDto
) => {
  try {
    // Validate backorder data
    if (backorderDto.id !== id) {
      throw `Please don't hack us.`;
    }
    const backorderData: BackorderRequestDto =
      await backorderSchema.validateAsync(backorderDto);
    if (!backorderData.isArchived) {
      throw `Please don't hack us.`;
    }

    const { code, time } = generateCode();

    const productBackorders = backorderData.productBackorders.map(
      (productOrder) => ({
        product_name: productOrder.productName,
        backorder_id: backorderData.id,
        quantity: productOrder.quantity,
        unit_code: productOrder.unitCode,
        unit_price: new Prisma.Decimal(productOrder.unitPrice),
        updated_at: time,
      })
    );

    // convert backorder to a newly created customer order
    const customerOrderDto: CustomerOrderRequestDto = {
      customerName: backorderData.customerName,
      productCustomerOrders: backorderData.productBackorders,
      isTest: backorderData.isTest,
      expectedAt: backorderData.expectedAt,
      assignTo: backorderData.assignTo,
      code: code,
      status: OrderStatus.PICKING,
    };

    // validate customer order
    const customerOrderData: CustomerOrderRequestDto =
      await customerOrderSchema.validateAsync(customerOrderDto);
    if (!Object.keys(OrderStatus).includes(customerOrderData.status)) {
      throw `Please don't attack us.`;
    }
    const productOrders = customerOrderData.productCustomerOrders.map(
      (productOrder) => ({
        product_name: productOrder.productName,
        order_code: productOrder.orderCode,
        quantity: productOrder.quantity,
        unit_code: productOrder.unitCode,
        unit_price: new Prisma.Decimal(
          new Prisma.Decimal(productOrder.unitPrice).toPrecision(2)
        ),
        created_at: time,
        updated_at: time,
      })
    );

    return await prisma.$transaction(async (tx) => {
      // update backorder if backorder is not archived
      let existingOrder;
      try {
        existingOrder = await tx.backorder.update({
          where: {
            BackorderArchive_key: {
              id: backorderData.id,
              is_archived: false,
            },
          },
          include: {
            productBackorders: true,
          },
          data: {
            customer_name: backorderData.customerName,
            updated_at: time,
            expected_at: convertLocalExpected(backorderData.expectedAt),
            is_test: backorderData.isTest,
            is_archived: true,
          },
        });
      } catch (e) {
        throw `This backorder cannot be changed.`;
      }

      const existingProductOrders = new Map();
      for (const productOrder of existingOrder.productBackorders) {
        existingProductOrders.set(productOrder.product_name, {
          product_name: productOrder.product_name,
          quantity: productOrder.quantity,
          unit_code: productOrder.unit_code,
          unit_price: productOrder.unit_price,
          updated_at: productOrder.updated_at,
        });
        const found = productOrders.find(
          (po) => po.product_name === productOrder.product_name
        );
        if (!found) {
          // remove existing product order
          const deletedProductOrder = await tx.productBackorder.delete({
            where: {
              ProductBackorder_key: {
                product_name: productOrder.product_name,
                backorder_id: productOrder.backorder_id,
              },
            },
          });
        }
      }

      for (const productOrder of productBackorders) {
        // find current order quantity
        const currentProductOrder = existingProductOrders.get(
          productOrder.product_name
        );

        if (!currentProductOrder) {
          // create product backorder
          const createdProductOrder = await tx.productBackorder.create({
            data: {
              product_name: productOrder.product_name,
              backorder_id: productOrder.backorder_id,
              quantity: productOrder.quantity,
              unit_code: productOrder.unit_code,
              unit_price: productOrder.unit_price,
              created_at: time,
              updated_at: time,
            },
          });
        } else {
          // update existing product backorder
          const updatedProductOrder = await tx.productBackorder.update({
            where: {
              ProductBackorder_key: {
                product_name: productOrder.product_name,
                backorder_id: productOrder.backorder_id,
              },
            },
            data: {
              quantity: productOrder.quantity,
              unit_code: productOrder.unit_code,
              unit_price: productOrder.unit_price,
              updated_at: productOrder.updated_at,
            },
          });
        }
      }

      // create customer order
      const newCustomerOrder = await tx.customerOrder.create({
        data: {
          code: code,
          customer_name: customerOrderData.customerName,
          status: customerOrderData.status,
          created_at: time,
          updated_at: time,
          expected_at: convertLocalExpected(customerOrderData.expectedAt),
          assign_to: customerOrderData.assignTo,
          priority: 0,
          is_test: customerOrderData.isTest,
          is_sold: false,
          productCustomerOrders: {
            create: productOrders,
          },
        },
      });

      // create stock change history
      const addedStockChangeHistory =
        await tx.stockChangeHistory.create({
          data: {
            created_at: time,
            reason: StockChangeReason.CUSTOMER_ORDER_CREATE,
          },
        });

      for (const productOrder of productOrders) {
        const currentStock = await tx.stock.findUniqueOrThrow({
          where: {
            product_name: productOrder.product_name,
          },
        });

        // get unit ratio
        const unit = await tx.unit.findUniqueOrThrow({
          where: {
            code: productOrder.unit_code,
          }
        });
        const newRatio = new Fraction(unit.ratio);
        const productOrderQuantity = newRatio.mul(new Fraction(productOrder.quantity));
        const currentStockQuantity = new Fraction(currentStock.quantity);
        const newStockQuantity = currentStockQuantity.sub(productOrderQuantity);
        const stockQuantityChange = newStockQuantity.sub(currentStockQuantity);        

        if (newStockQuantity.compare(0) < 0)
          throw `${productOrder.product_name}: Only ${currentStock.quantity} box in stock.`;

        // update stock
        const updatedStock = await tx.stock.update({
          where: {
            product_name: productOrder.product_name,
          },
          data: {
            quantity: newStockQuantity.toFraction(),
            updated_at: time,
          },
        });

        // create stock change
        const addedStockChange = await tx.stockChange.create({
          data: {
            stock_id: updatedStock.id,
            change_id: addedStockChangeHistory.id,
            quantity_change: stockQuantityChange.toFraction(),
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
    console.log(error);
    throw new createError.BadRequest(
      "Cannot convert backorder with the given data."
    );
  }
};
