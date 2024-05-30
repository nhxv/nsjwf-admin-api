import createError from "http-errors";
import { OrderStatus } from "../commons/enums/order-status.enum";
import { convertLocalInterval } from "../commons/utils/time.util";
import {
  CustomerProductRankingDto,
  ProductRankingDto,
  customerProductRankingSchema,
  productRankingSchema,
} from "../dto/requests/analysis-request.dto";
import { Decimal } from "@prisma/client/runtime/library";

export const rankCustomersByProduct = async (
  searchObject: CustomerProductRankingDto
) => {
  try {
    const { start_date, end_date, product } =
      await customerProductRankingSchema.validateAsync(searchObject);

    const { start: start, end: _e } = convertLocalInterval(
      new Date(start_date)
    );
    const { start: _s, end: end } = convertLocalInterval(new Date(end_date));
    const orders = await prisma.customerOrder.findMany({
      where: {
        status: OrderStatus.COMPLETED,
        expected_at: {
          gte: start,
          lte: end,
        },
      },
      select: {
        customer_name: true,
        productCustomerOrders: {
          select: {
            quantity: true,
            unit_code: true,
            unit_price: true,
          },
          where: {
            product_name: {
              contains: product,
              mode: "insensitive",
            },
            quantity: {
              gt: 0,
            },
            unit_price: {
              gt: 0,
            },
          },
          orderBy: {
            product_name: "asc",
          },
        },
      },
    });

    const ordersWithProduct = orders.filter(
      (co) => co.productCustomerOrders.length !== 0
    );

    let customerSales = {};
    for (const co of ordersWithProduct) {
      if (!customerSales.hasOwnProperty(co.customer_name)) {
        customerSales[co.customer_name] = { boxCount: 0, price: 0 };
      }

      for (const productOrder of co.productCustomerOrders) {
        const unit = productOrder.unit_code.split("_")[1];
        if (unit === "BOX") {
          customerSales[co.customer_name].boxCount += productOrder.quantity;
          customerSales[co.customer_name].price +=
            productOrder.unit_price.toNumber() * productOrder.quantity;
        }
      }
    }
    // format result -- there might be a fancy one-liner way of doing this
    const result = [];
    for (const customer in customerSales) {
      if (customerSales[customer].boxCount > 0) {
        result.push({
          customerName: customer,
          boxCount: customerSales[customer].boxCount,
          avgPrice: (
            customerSales[customer].price / customerSales[customer].boxCount
          ).toFixed(2),
        });
      }
    }
    return result;
  } catch (error) {
    console.log(error);
    throw new createError.BadRequest("Bad inputs.");
  }
};

export const rankProductsByCount = async (searchObject: ProductRankingDto) => {
  try {
    const { start_date, end_date } = await productRankingSchema.validateAsync(
      searchObject
    );

    const { start: start, end: _e } = convertLocalInterval(
      new Date(start_date)
    );
    const { start: _s, end: end } = convertLocalInterval(new Date(end_date));

    const result = await prisma.customerOrder.findMany({
      where: {
        status: OrderStatus.COMPLETED,
        expected_at: {
          gte: start,
          lte: end,
        },
      },
      select: {
        productCustomerOrders: {
          select: {
            product_name: true,
            quantity: true,
            unit_code: true,
          },
          orderBy: {
            product_name: "asc",
          },
        },
      },
    });

    let ret = {};
    for (const co of result) {
      for (const pco of co.productCustomerOrders) {
        if (!ret.hasOwnProperty(pco.product_name)) {
          ret[pco.product_name] = [pco.product_name, 0];
        }

        const unit = pco.unit_code.split("_")[1];
        if (unit === "BOX" && pco.quantity > 0) {
          ret[pco.product_name][1] += pco.quantity;
        }
      }
    }

    return ret;
  } catch (error) {
    throw new createError.BadRequest("Bad inputs.");
  }
};
