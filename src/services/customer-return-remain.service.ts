import createError from "http-errors";

export const findCustomerReturnRemainByCode = async (code: string) => {
  let customerReturnRemain;
  try {
    customerReturnRemain = await prisma.customerReturnRemain.findUnique({
      where: {
        order_code: code,
      },
      include: {
        productCustomerReturnRemains: {
          orderBy: {
            product_name: "asc",
          },
        },
      },
    });
    if (!customerReturnRemain) {
      // get order sold instead
      const orderSold = await prisma.customerOrder.findUniqueOrThrow({
        where: {
          code: code,
        },
        include: {
          productCustomerOrders: true,
        },
      });
      customerReturnRemain = {
        order_code: orderSold.code,
        customer_name: orderSold.customer_name,
        sold_at: orderSold.updated_at,
        productCustomerReturnRemains: orderSold.productCustomerOrders.map(
          (p) => ({
            id: p.id,
            product_name: p.product_name,
            quantity: p.quantity,
            unit_code: p.unit_code,
            unit_price: p.unit_price,
          })
        ),
        order_manual_code: orderSold.manual_code,
      };
    }
    return customerReturnRemain;
  } catch (error) {
    throw new createError.BadRequest(
      "Cannot get customer sale return with the given data."
    );
  }
};
