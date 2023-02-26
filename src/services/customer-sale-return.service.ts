import createError from "http-errors";

export const findCustomerSaleReturnByCode = async (code: string) => {
  let customerSaleReturn;
  try {
    customerSaleReturn = await prisma.customerSaleReturn.findUnique({
      where: {
        sale_code: code,
      },
      include: {
        productCustomerSaleReturns: {
          orderBy: {
            product_name: "asc",
          },
        },
      },
    });
    if (!customerSaleReturn) {
      // get order sold instead
      const orderSold = await prisma.customerOrder.findUniqueOrThrow({
        where: {
          code: code,
        },
        include: {
          productCustomerOrders: true,
        },
      });
      customerSaleReturn = {
        sale_code: orderSold.code,
        customer_name: orderSold.customer_name,
        sold_at: orderSold.updated_at,
        productCustomerSaleReturns: orderSold.productCustomerOrders.map(
          (p) => ({
            id: p.id,
            product_name: p.product_name,
            quantity: p.quantity,
            unit_code: p.unit_code,
            unit_price: p.unit_price,
          })
        ),
        sale_manual_code: orderSold.manual_code,
      };
    }
    return customerSaleReturn;
  } catch (error) {
    throw new createError.BadRequest(
      "Cannot get customer sale return with the given data."
    );
  }
};
