import createError from "http-errors";
import { OrderStatus } from "../commons/enums/order-status.enum";
import { convertLocalInterval } from "../commons/utils/time.util";
import {
  CustomerProductRankingDto,
  ProductRankingDto,
  customerProductRankingSchema,
  productRankingSchema,
} from "../dto/requests/analytic-request.dto";

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
    const result = await prisma.customerOrder.findMany({
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
          },
          where: {
            product_name: {
              contains: product,
              mode: "insensitive",
            },
          },
          orderBy: {
            product_name: "asc",
          },
        },
      },
    });

    const ordersWithProduct = result.filter(
      (co) => co.productCustomerOrders.length !== 0
    );

    let ret = {};
    for (const co of ordersWithProduct) {
      if (!ret.hasOwnProperty(co.customer_name)) {
        ret[co.customer_name] = [co.customer_name, 0];
      }

      const [_, unit] = co.productCustomerOrders[0].unit_code.split("_");
      if (unit === "BOX") {
        ret[co.customer_name][1] += co.productCustomerOrders[0].quantity;
      }
    }

    return ret;
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

        const [_, unit] = pco.unit_code.split("_");
        if (unit === "BOX") {
          ret[pco.product_name][1] += pco.quantity;
        }
      }
    }

    return ret;
  } catch (error) {
    throw new createError.BadRequest("Bad inputs.");
  }
};
