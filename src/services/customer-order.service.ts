import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import Fraction from "fraction.js";
import createError from "http-errors";
import { OrderStatus } from "../commons/enums/order-status.enum";
import { PaymentStatus } from "../commons/enums/payment-status.enum";
import { handleValidationError } from "../commons/http.exception";
import { generateCode } from "../commons/utils/code.util";
import { CustomerOrderRequestDto } from "../dto/requests/customer-order-request.dto";
import { StockChangeReason } from "./../commons/enums/stock-change-reason.enum";
import {
  convertLocalEnd,
  convertLocalExpected,
  convertLocalInterval,
  convertLocalMonthEnd,
  convertLocalMonthStart,
  convertLocalStart,
  convertLocalWeekEnd,
  convertLocalWeekStart,
  generateCurrentTime,
} from "./../commons/utils/time.util";
import { CustomerOrderPriorityRequestDto } from "./../dto/requests/customer-order-priority-request.dto";
import { customerOrderSchema } from "./../dto/requests/customer-order-request.dto";

export const findDailyCustomerOrder = async () => {
  try {
    const customerOrders = await prisma.customerOrder.findMany({
      where: {
        NOT: {
          status: OrderStatus.COMPLETED,
        },
      },
      include: {
        productCustomerOrders: {
          orderBy: {
            product_name: "asc",
          },
        },
      },
      orderBy: {
        manual_code: "desc",
      },
    });
    return customerOrders;
  } catch (error) {
    throw new createError.BadRequest("Cannot find customer order.");
  }
};

export const findCustomerOrderByStatus = async (status: string) => {
  try {
    if (
      !(Object.values(OrderStatus) as string[]).includes(status) ||
      status === OrderStatus.COMPLETED
    ) {
      throw `Please don't hack us.`;
    }
    const customerOrders = await prisma.customerOrder.findMany({
      where: {
        status: status,
      },
      include: {
        productCustomerOrders: {
          orderBy: {
            product_name: "asc",
          },
        },
      },
      orderBy: {
        manual_code: "desc",
      },
    });
    return customerOrders;
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest(
      "Cannot find customer order with the given status."
    );
  }
};

export const findCustomerOrderByCode = async (code: string) => {
  try {
    const customerOrder = await prisma.customerOrder.findUniqueOrThrow({
      where: {
        code: code,
      },
      include: {
        productCustomerOrders: {
          orderBy: {
            product_name: "asc",
          },
        },
      },
    });
    return customerOrder;
  } catch (error) {
    throw new createError.BadRequest(
      "Cannot find customer order with the given code."
    );
  }
};

export const findCustomerSale = async (
  code: string,
  date: string,
  customerName: string,
  productName: string
) => {
  try {
    // Construct dynamic query for prisma.
    // Note that there's no known way to not select an entry based on a condition on a relation
    // we'll have to manually filter out later on.
    const whereClause = new Map();
    whereClause.set("status", OrderStatus.COMPLETED);

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
      if (date) {
        const { start, end } = convertLocalInterval(new Date(date));
        whereClause.set("updated_at", { gte: start, lte: end });
      }
      if (customerName)
        whereClause.set("customer_name", {
          contains: customerName,
          mode: "insensitive",
        });
    }
    let result = await prisma.customerOrder.findMany({
      where: Object.fromEntries(whereClause),
      include: {
        productCustomerOrders: {
          orderBy: {
            product_name: "asc",
          },
        },
        customerPayment: true,
      },
      orderBy: {
        updated_at: "desc",
      },
      // Limit this because it's very possible to take all completed orders.
      take: 100,
    });
    const customerSolds = result.filter((co) =>
      co.productCustomerOrders.some((pco) =>
        pco.product_name.includes(productName)
      )
    );

    // Apparently .map() won't work cuz TS is BS :)
    const reports = [];
    for (const sold of customerSolds) {
      reports.push({
        is_test: sold.is_test,
        order_code: sold.code,
        manual_code: sold.manual_code ? sold.manual_code : "",
        customer_name: sold.customer_name,
        sale: sold.productCustomerOrders.reduce(
          (prev, curr: any) => prev + curr.quantity * curr.unit_price,
          0
        ),
        refund: 0,
        fullReturn: false,
        date: sold.updated_at,
        payment_status: sold.customerPayment.status,
        productCustomerOrders: sold.productCustomerOrders,
      });
    }

    const returns = await prisma.customerReturn.findMany({
      // TODO: Need to change this condition to match with report query.
      where: {
        created_at: {
          gte: convertLocalStart(),
          lte: convertLocalEnd(),
        },
      },
      include: {
        productCustomerReturns: {
          orderBy: {
            product_name: "asc",
          },
        },
      },
      orderBy: {
        created_at: "asc",
      },
    });

    for (const customerReturn of returns) {
      const matchingIndex = reports.findIndex((r) => {
        return r.customer_name === customerReturn.customer_name;
      });
      if (matchingIndex !== -1) {
        const newRefund = customerReturn.refund;
        if (newRefund <= reports[matchingIndex].sale) {
          reports[matchingIndex] = {
            ...reports[matchingIndex],
            refund: Decimal.sum(reports[matchingIndex].refund, newRefund),
          };
        }
      }
      // This else is Debug only, this can be removed or raised to frontend somehow.
      else {
        console.log("No matching completed order despite having returns.");
        console.log(
          `Can't find '${customerReturn.customer_name}' inside reports.`
        );
        console.log(reports);
        // I choose not to break here cuz we'll try to pretend to user that everything is alright.
        //break;
      }
    }

    // Check whether the order is fully returned (can't return if there's nothing to return left)
    // This check might be redundant since we can just throw error if, when user create a return, the qty remaining is all 0.
    // But it's here for now!
    for (let i = 0; i < reports.length; i++) {
      const returnRemain = await prisma.customerReturnRemain.findUnique({
        where: {
          order_code: customerSolds[i].code,
        },
        include: {
          productCustomerReturnRemains: true,
        },
      });
      if (
        !returnRemain ||
        returnRemain.productCustomerReturnRemains.find(
          (p) => !new Fraction(p.quantity).equals(0)
        )
      ) {
        reports[i].fullReturn = false;
      } else {
        reports[i].fullReturn = true;
      }
    }

    return reports;
  } catch (error) {
    console.log(error);
    throw new createError.BadRequest(
      "Cannot find customer sale with the given data."
    );
  }
};

// DEPRECATED
export const reportCustomerSale = async () => {
  try {
    // find daily solds
    const customerSolds = await prisma.customerOrder.findMany({
      where: {
        status: OrderStatus.COMPLETED,
        updated_at: {
          gte: convertLocalStart(),
          lte: convertLocalEnd(),
        },
      },
      include: {
        productCustomerOrders: {
          orderBy: {
            product_name: "asc",
          },
        },
        customerPayment: true,
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
        },
      },
      include: {
        productCustomerReturns: {
          orderBy: {
            product_name: "asc",
          },
        },
      },
      orderBy: {
        created_at: "asc",
      },
    });
    const reports = [];
    for (const sold of customerSolds) {
      reports.push({
        is_test: sold.is_test,
        order_code: sold.code,
        manual_code: sold.manual_code ? sold.manual_code : "",
        customer_name: sold.customer_name,
        sale: sold.productCustomerOrders.reduce(
          (prev, curr: any) => prev + curr.quantity * curr.unit_price,
          0
        ),
        refund: 0,
        date: sold.updated_at,
        payment_status: sold.customerPayment.status,
        productCustomerOrders: sold.productCustomerOrders,
      });
    }
    for (const customerReturn of returns) {
      const matchingIndex = reports.findIndex(
        (r) => r.customer_name === customerReturn.customer_name
      );
      if (matchingIndex !== -1) {
        const newRefund = customerReturn.refund;
        if (newRefund <= reports[matchingIndex].sale) {
          reports[matchingIndex] = {
            ...reports[matchingIndex],
            refund: Decimal.sum(reports[matchingIndex].refund, newRefund),
          };
        }
      }
      // This else is Debug only, this can be removed or raised to frontend somehow.
      else {
        console.log(
          "No matching completed order despite having returns. This is a bug."
        );
        console.log(
          `Can't find '${customerReturn.customer_name}' inside reports.`
        );
        console.log(reports);
        // I choose not to break here cuz we'll try to pretend to user that everything is alright.
        //break;
      }
    }
    return reports;
  } catch (error) {
    throw new createError.BadRequest("Cannot report.");
  }
};

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
        expected_at: {
          gte: convertLocalStart(),
        },
      },
      orderBy: [{ priority: "asc" }, { created_at: "asc" }],
      include: {
        productCustomerOrders: {
          orderBy: {
            product_name: "asc",
          },
        },
      },
    });
    return tasks;
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot find task by the given data.");
  }
};

export const createCustomerOrder = async (
  customerOrderDto: CustomerOrderRequestDto
) => {
  try {
    // Validate customer order
    const customerOrderData: CustomerOrderRequestDto =
      await customerOrderSchema.validateAsync(customerOrderDto);
    if (
      !(Object.values(OrderStatus) as string[]).includes(
        customerOrderData.status
      )
    ) {
      throw `Please don't attack us.`;
    }
    // Validate unique unit code
    const unitCodes = new Set();
    for (const po of customerOrderData.productCustomerOrders) {
      if (unitCodes.has(po.unitCode)) {
        throw `Duplicated ${po.unitCode}.`;
      } else {
        unitCodes.add(po.unitCode);
      }
    }
    const employee = await prisma.account.findUniqueOrThrow({
      where: {
        nickname: customerOrderData.assignTo,
      },
    });
    const { code, time } = generateCode();
    const productOrders = customerOrderData.productCustomerOrders.map(
      (productOrder) => ({
        product_name: productOrder.productName,
        order_code: productOrder.orderCode,
        unit_code: productOrder.unitCode,
        quantity: productOrder.quantity,
        unit_price: new Prisma.Decimal(productOrder.unitPrice.toFixed(2)),
        created_at: time,
        updated_at: time,
      })
    );

    if (customerOrderData.status === OrderStatus.COMPLETED) {
      return await prisma.$transaction(async (tx) => {
        // create customer payment
        let newCustomerPayment;
        if (!customerOrderData.isTest) {
          newCustomerPayment = await tx.customerPayment.create({
            data: {
              code: code,
              status: PaymentStatus.RECEIVABLE,
              created_at: time,
              updated_at: time,
            },
          });
        } else {
          newCustomerPayment = await tx.customerPayment.create({
            data: {
              code: code,
              status: PaymentStatus.CASH,
              created_at: time,
              updated_at: time,
            },
          });
        }

        // check for valid unit price when complete order
        for (const po of productOrders) {
          if (po.unit_price.comparedTo(0) < 0) {
            throw `Price needs to be at least 0.`;
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
            is_test: customerOrderData.isTest,
            assign_to: employee.nickname,
            priority: 0,
            is_sold: true,
            manual_code: customerOrderData.manualCode
              ? customerOrderData.manualCode
              : null,
            note: customerOrderData.note,
            payment_code: code,
            productCustomerOrders: {
              create: productOrders,
            },
          },
        });

        // 1. create stock change history
        const addedStockChangeHistory = await tx.stockChangeHistory.create({
          data: {
            created_at: time,
            reason: StockChangeReason.CUSTOMER_ORDER_COMPLETED,
            order_code: code,
          },
        });

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
            currentStockQuantity.sub(productOrderQuantity);
          const stockQuantityChange =
            newStockQuantity.sub(currentStockQuantity);

          if (newStockQuantity.compare(0) < 0) {
            throw `${productOrder.product_name}: Only ${currentStock.quantity} box in stock.`;
          }

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
              change_id: addedStockChangeHistory.id,
              quantity_change: stockQuantityChange.toFraction(),
            },
          });
        }
        return newCustomerOrder;
      });
    } else {
      // create customer order
      const newCustomerOrder = await prisma.customerOrder.create({
        data: {
          code: code,
          customer_name: customerOrderData.customerName,
          status: customerOrderData.status,
          created_at: time,
          updated_at: time,
          expected_at: convertLocalExpected(customerOrderData.expectedAt),
          is_test: customerOrderData.isTest,
          assign_to: employee.nickname,
          priority: 0,
          is_sold: false,
          manual_code: customerOrderData.manualCode
            ? customerOrderData.manualCode
            : null,
          note: customerOrderData.note,
          productCustomerOrders: {
            create: productOrders,
          },
        },
      });
      return newCustomerOrder;
    }
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    if (error.details?.length > 0) {
      handleValidationError(error);
    }
    throw new createError.BadRequest(
      "Cannot create customer order with the given data."
    );
  }
};

export const updateCustomerOrder = async (
  code: string,
  customerOrderDto: CustomerOrderRequestDto
) => {
  try {
    // Validate customer order
    const customerOrderData: CustomerOrderRequestDto =
      await customerOrderSchema.validateAsync(customerOrderDto);
    if (
      !(Object.values(OrderStatus) as string[]).includes(
        customerOrderData.status
      )
    ) {
      throw `Please don't attack us.`;
    }
    if (customerOrderData.code !== code) {
      throw `Please don't attack us.`;
    }
    // Validate unique unit code
    const unitCodes = new Set();
    for (const po of customerOrderData.productCustomerOrders) {
      if (unitCodes.has(po.unitCode)) {
        throw `Duplicated ${po.unitCode}.`;
      } else {
        unitCodes.add(po.unitCode);
      }
    }
    const employee = await prisma.account.findUniqueOrThrow({
      where: {
        nickname: customerOrderData.assignTo,
      },
    });
    const time = generateCurrentTime();
    const productOrders = customerOrderData.productCustomerOrders.map(
      (productOrder) => ({
        product_name: productOrder.productName,
        order_code: customerOrderData.code,
        quantity: productOrder.quantity,
        unit_code: productOrder.unitCode,
        unit_price: new Prisma.Decimal(productOrder.unitPrice.toFixed(2)),
        updated_at: time,
      })
    );
    if (customerOrderData.status === OrderStatus.COMPLETED) {
      return await prisma.$transaction(async (tx) => {
        // create customer payment
        let newCustomerPayment;
        if (!customerOrderData.isTest) {
          newCustomerPayment = await tx.customerPayment.create({
            data: {
              code: code,
              status: PaymentStatus.RECEIVABLE,
              created_at: time,
              updated_at: time,
            },
          });
        } else {
          newCustomerPayment = await tx.customerPayment.create({
            data: {
              code: code,
              status: PaymentStatus.CASH,
              created_at: time,
              updated_at: time,
            },
          });
        }

        // update customer order if that order IS NOT completed
        let existingOrder;
        try {
          existingOrder = await tx.customerOrder.update({
            where: {
              CustomerOrderSold_key: {
                code: customerOrderData.code,
                is_sold: false,
              },
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
              is_sold: true,
              manual_code: customerOrderData.manualCode
                ? customerOrderData.manualCode
                : null,
              note: customerOrderData.note,
              expected_at: convertLocalExpected(customerOrderData.expectedAt),
              payment_code: customerOrderData.code,
            },
          });
        } catch (e) {
          throw `This order cannot be changed.`;
        }

        // create stock change history
        const addedStockChangeHistory = await tx.stockChangeHistory.create({
          data: {
            created_at: time,
            reason: StockChangeReason.CUSTOMER_ORDER_COMPLETED,
            order_code: code,
          },
        });

        const existingProductOrders = new Map();

        // delete product order not in request
        for (const productOrder of existingOrder.productCustomerOrders) {
          existingProductOrders.set(productOrder.unit_code, {
            product_name: productOrder.product_name,
            quantity: productOrder.quantity,
            unit_code: productOrder.unit_code,
            unit_price: productOrder.unit_price,
            updated_at: productOrder.updated_at,
          });
          const found = productOrders.find(
            (po) => po.unit_code === productOrder.unit_code
          );
          if (!found) {
            const deletedProductOrder = await tx.productCustomerOrder.delete({
              where: {
                ProductCustomerOrder_key: {
                  order_code: productOrder.order_code,
                  unit_code: productOrder.unit_code,
                },
              },
            });
          }
        }

        for (const productOrder of productOrders) {
          // validate unit price when completing order
          if (productOrder.unit_price.comparedTo(0) < 0) {
            throw `Price needs to be at least 0.`;
          }

          // get current stock
          const currentStock = await tx.stock.findUniqueOrThrow({
            where: {
              product_name: productOrder.product_name,
            },
          });

          // get new unit ratio
          const unit = await tx.unit.findUniqueOrThrow({
            where: {
              code: productOrder.unit_code,
            },
          });
          const newRatio = new Fraction(unit.ratio);
          const newProductOrderQuantity = newRatio.mul(
            new Fraction(productOrder.quantity)
          );
          const currentStockQuantity = new Fraction(currentStock.quantity);
          const newStockQuantity = currentStockQuantity.sub(
            newProductOrderQuantity
          );
          const stockQuantityChange =
            newStockQuantity.sub(currentStockQuantity);

          if (newStockQuantity.compare(0) < 0) {
            throw `${productOrder.product_name}: Only ${currentStock.quantity} box in stock.`;
          }

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

          // find current product order
          const currentProductOrder = existingProductOrders.get(
            productOrder.unit_code
          );

          if (!currentProductOrder) {
            // create new product order
            const newProductOrder = await tx.productCustomerOrder.create({
              data: {
                product_name: productOrder.product_name,
                order_code: productOrder.order_code,
                quantity: productOrder.quantity,
                unit_code: productOrder.unit_code,
                unit_price: productOrder.unit_price,
                created_at: time,
                updated_at: time,
              },
            });
          } else {
            // update product order
            const updatedProductOrder = await tx.productCustomerOrder.update({
              where: {
                ProductCustomerOrder_key: {
                  order_code: productOrder.order_code,
                  unit_code: productOrder.unit_code,
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
    } else {
      // update customer order if that order IS NOT completed
      return await prisma.$transaction(async (tx) => {
        let existingOrder;
        try {
          existingOrder = await tx.customerOrder.update({
            where: {
              CustomerOrderSold_key: {
                code: customerOrderData.code,
                is_sold: false,
              },
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
              is_sold: false,
              manual_code: customerOrderData.manualCode
                ? customerOrderData.manualCode
                : null,
              note: customerOrderData.note,
              expected_at: convertLocalExpected(customerOrderData.expectedAt),
            },
          });
        } catch (e) {
          throw `This order cannot be changed.`;
        }

        const existingProductOrders = new Map();

        // delete product order not in request
        for (const productOrder of existingOrder.productCustomerOrders) {
          existingProductOrders.set(productOrder.unit_code, {
            product_name: productOrder.product_name,
            quantity: productOrder.quantity,
            unit_code: productOrder.unit_code,
            unit_price: productOrder.unit_price,
            updated_at: productOrder.updated_at,
          });
          const found = productOrders.find(
            (po) => po.unit_code === productOrder.unit_code
          );
          if (!found) {
            const deletedProductOrder = await tx.productCustomerOrder.delete({
              where: {
                ProductCustomerOrder_key: {
                  order_code: productOrder.order_code,
                  unit_code: productOrder.unit_code,
                },
              },
            });
          }
        }

        for (const productOrder of productOrders) {
          // find current product order
          const currentProductOrder = existingProductOrders.get(
            productOrder.unit_code
          );

          if (!currentProductOrder) {
            // create new product order
            const newProductOrder = await tx.productCustomerOrder.create({
              data: {
                product_name: productOrder.product_name,
                order_code: productOrder.order_code,
                quantity: productOrder.quantity,
                unit_code: productOrder.unit_code,
                unit_price: productOrder.unit_price,
                created_at: time,
                updated_at: time,
              },
            });
          } else {
            // update product order
            const updatedProductOrder = await tx.productCustomerOrder.update({
              where: {
                ProductCustomerOrder_key: {
                  order_code: productOrder.order_code,
                  unit_code: productOrder.unit_code,
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
    }
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    if (error.details?.length > 0) {
      handleValidationError(error);
    }
    throw new createError.BadRequest(
      "Cannot update customer order with the given data."
    );
  }
};

export const reportTask = async (nickname: string) => {
  try {
    const daily = await prisma.orderTaskHistory.findMany({
      where: {
        updated_at: {
          gte: convertLocalStart(),
          lte: convertLocalEnd(),
        },
      },
    });
    const weekly = await prisma.orderTaskHistory.findMany({
      where: {
        updated_at: {
          gte: convertLocalWeekStart(),
          lte: convertLocalWeekEnd(),
        },
      },
    });
    const monthly = await prisma.orderTaskHistory.findMany({
      where: {
        updated_at: {
          gte: convertLocalMonthStart(),
          lte: convertLocalMonthEnd(),
        },
      },
    });
    const pickingDaily = daily.filter(
      (task) => task.type === OrderStatus.PICKING
    );
    const pickingWeekly = weekly.filter(
      (task) => task.type === OrderStatus.PICKING
    );
    const pickingMonthly = monthly.filter(
      (task) => task.type === OrderStatus.PICKING
    );

    const shippingDaily = daily.filter(
      (task) => task.type === OrderStatus.SHIPPING
    );
    const shippingWeekly = weekly.filter(
      (task) => task.type === OrderStatus.SHIPPING
    );
    const shippingMonthly = monthly.filter(
      (task) => task.type === OrderStatus.SHIPPING
    );

    const employeePickingDaily = pickingDaily.filter(
      (task) => task.employee_name !== nickname
    );
    const employeeShippingDaily = shippingDaily.filter(
      (task) => task.employee_name !== nickname
    );
    const employeePickingWeekly = pickingWeekly.filter(
      (task) => task.employee_name !== nickname
    );
    const employeeShippingWeekly = shippingWeekly.filter(
      (task) => task.employee_name !== nickname
    );
    const employeePickingMonthly = pickingMonthly.filter(
      (task) => task.employee_name !== nickname
    );
    const employeeShippingMonthly = shippingMonthly.filter(
      (task) => task.employee_name !== nickname
    );
    return {
      employeePickingDaily: employeePickingDaily.length,
      employeeShippingDaily: employeeShippingDaily.length,
      employeePickingWeekly: employeePickingWeekly.length,
      employeeShippingWeekly: employeeShippingWeekly.length,
      employeePickingMonthly: employeePickingMonthly.length,
      employeeShippingMonthly: employeeShippingMonthly.length,
      pickingDaily: pickingDaily.length,
      pickingWeekly: pickingWeekly.length,
      pickingMonthly: pickingMonthly.length,
      shippingDaily: shippingDaily.length,
      shippingWeekly: shippingWeekly.length,
      shippingMonthly: shippingMonthly.length,
    };
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot find task report.");
  }
};

export const updatePriority = async (
  customerOrderPriorityRequestDto: CustomerOrderPriorityRequestDto[]
) => {
  try {
    return await prisma.$transaction(async (tx) => {
      for (const employee of customerOrderPriorityRequestDto) {
        if (employee.customerOrders?.length > 0) {
          for (let i = 0; i < employee.customerOrders.length; i++) {
            const currentTask = await tx.customerOrder.findUniqueOrThrow({
              where: {
                code: employee.customerOrders[i].code,
              },
            });
            if (currentTask.is_doing) {
              if (currentTask.assign_to !== employee.nickname) {
                throw `Cannot re-assign on-doing task to someone else.`;
              }
              const updated = await tx.customerOrder.update({
                where: {
                  code: employee.customerOrders[i].code,
                },
                data: {
                  priority: i + 1,
                },
              });
            } else {
              const updated = await tx.customerOrder.update({
                where: {
                  code: employee.customerOrders[i].code,
                },
                data: {
                  assign_to: employee.nickname,
                  priority: i + 1,
                },
              });
            }
          }
        }
      }
    });
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot update order priority.");
  }
};

export const startDoingTask = async (code: string, nickname: string) => {
  try {
    const currentOrder = await prisma.customerOrder.findUniqueOrThrow({
      where: {
        code: code,
      },
    });
    if (
      currentOrder.status !== OrderStatus.PICKING &&
      currentOrder.status !== OrderStatus.SHIPPING
    ) {
      throw `Please don't hack us.`;
    }
    if (currentOrder.assign_to !== nickname) {
      throw `This is no longer your task.`;
    }
    const time = generateCurrentTime();
    const updated = await prisma.customerOrder.update({
      where: {
        code: code,
      },
      data: {
        is_doing: true,
        updated_at: time,
      },
    });
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot register finished task.");
  }
};

export const stopDoingTask = async (code: string) => {
  try {
    const currentOrder = await prisma.customerOrder.findUniqueOrThrow({
      where: {
        code: code,
      },
    });
    if (
      currentOrder.status !== OrderStatus.PICKING &&
      currentOrder.status !== OrderStatus.SHIPPING
    ) {
      throw `Please don't hack us.`;
    }
    const time = generateCurrentTime();
    const updated = await prisma.customerOrder.update({
      where: {
        code: code,
      },
      data: {
        is_doing: false,
        updated_at: time,
      },
    });
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot register finished task.");
  }
};

export const finishTask = async (code: string) => {
  try {
    const currentOrder = await prisma.customerOrder.findUniqueOrThrow({
      where: {
        code: code,
      },
    });
    if (
      currentOrder.status !== OrderStatus.PICKING &&
      currentOrder.status !== OrderStatus.SHIPPING
    ) {
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
          status:
            currentOrder.status === OrderStatus.PICKING
              ? OrderStatus.CHECKING
              : OrderStatus.DELIVERED,
          is_doing: false,
          updated_at: time,
        },
      });

      // register task history
      const createdTask = await tx.orderTaskHistory.upsert({
        where: {
          OrderTask_key: {
            order_code: updatedOrder.code,
            type: currentOrder.status,
          },
        },
        update: {
          updated_at: time,
        },
        create: {
          order_code: updatedOrder.code,
          employee_name: updatedOrder.assign_to,
          type: currentOrder.status,
          created_at: time,
          updated_at: time,
        },
      });
    });
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot register finished task.");
  }
};

export const revertCustomerOrder = async (code: string) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const isReturned = await prisma.customerReturn.findFirst({
        where: {
          order_code: code,
        },
      });
      if (isReturned) {
        throw "Can't revert order because it has at least one return.";
      }
      // revert payment
      const deletedCustomerPayment = await prisma.customerPayment.delete({
        where: {
          code: code,
        },
      });

      // revert customer order
      const updatedCustomerOrder = await prisma.customerOrder.update({
        where: {
          code: code,
        },
        data: {
          status: OrderStatus.DELIVERED,
          is_sold: false,
          payment_code: null,
        },
      });

      // revert stock
      const stockChangeHistory = await tx.stockChangeHistory.findUniqueOrThrow({
        where: {
          OrderStockChangeHistory_key: {
            reason: StockChangeReason.CUSTOMER_ORDER_COMPLETED,
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
            reason: StockChangeReason.CUSTOMER_ORDER_COMPLETED,
            order_code: code,
          },
        },
      });
    });
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot revert customer order.");
  }
};
