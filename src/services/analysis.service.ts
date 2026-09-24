import createError from "http-errors";
import { OrderStatus } from "../commons/enums/order-status.enum";
import { convertLocalInterval } from "../commons/utils/time.util";
import { CustomerProductRankingDto, ProductRankingDto, customerProductRankingSchema, productRankingSchema } from "../dto/requests/analysis-request.dto";

export const rankCustomersByProduct = async (searchObject: CustomerProductRankingDto) => {
  try {
    const { start_date, end_date, product } = await customerProductRankingSchema.validateAsync(searchObject);

    const { start: start, end: _e } = convertLocalInterval(new Date(start_date));
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
              startsWith: product,
              mode: "insensitive",
            },
          },
          orderBy: {
            product_name: "asc",
          },
        },
      },
    });

    const ordersWithProduct = orders.filter((co) => co.productCustomerOrders.length !== 0);

    let customerSales = {};
    for (const co of ordersWithProduct) {
      if (!customerSales.hasOwnProperty(co.customer_name)) {
        customerSales[co.customer_name] = { boxCount: 0, avgPrice: 0 };
      }

      for (const productOrder of co.productCustomerOrders) {
        const unit = productOrder.unit_code.split("_")[1];
        if (unit === "BOX") {
          customerSales[co.customer_name].boxCount += productOrder.quantity;
          customerSales[co.customer_name].avgPrice += productOrder.unit_price.toNumber() * productOrder.quantity;
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
          avgPrice: (customerSales[customer].avgPrice / customerSales[customer].boxCount).toFixed(2),
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
    const { start_date, end_date } = await productRankingSchema.validateAsync(searchObject);

    const { start: start, end: _e } = convertLocalInterval(new Date(start_date));
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
        productCustomerOrders: {
          select: {
            product_name: true,
            quantity: true,
            unit_code: true,
            unit_price: true,
          },
          orderBy: {
            product_name: "asc",
          },
        },
      },
    });

    let productSales = {};
    for (const co of orders) {
      for (const productOrder of co.productCustomerOrders) {
        if (!productSales.hasOwnProperty(productOrder.product_name)) {
          productSales[productOrder.product_name] = {
            boxCount: 0,
            avgPrice: 0,
          };
        }

        const unit = productOrder.unit_code.split("_")[1];
        if (unit === "BOX") {
          productSales[productOrder.product_name].boxCount += productOrder.quantity;
          productSales[productOrder.product_name].avgPrice += productOrder.unit_price.toNumber() * productOrder.quantity;
        }
      }
    }

    // format analysis result
    const result = [];
    for (const product in productSales) {
      if (productSales[product].boxCount > 0) {
        result.push({
          productName: product,
          boxCount: productSales[product].boxCount,
          avgPrice: (productSales[product].avgPrice / productSales[product].boxCount).toFixed(2),
        });
      }
    }
    return result;
  } catch (error) {
    throw new createError.BadRequest("Bad inputs.");
  }
};
