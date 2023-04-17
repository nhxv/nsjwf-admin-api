import createError from "http-errors";

export const findVendorReturnRemainByCode = async (code: string) => {
  let vendorReturnRemain;
  try {
    vendorReturnRemain = await prisma.vendorReturnRemain.findUnique({
      where: {
        order_code: code,
      },
      include: {
        productVendorReturnRemains: {
          orderBy: {
            product_name: "asc",
          },
        },
      },
    });
    if (!vendorReturnRemain) {
      // get order sold instead
      const orderSold = await prisma.vendorOrder.findUniqueOrThrow({
        where: {
          code: code,
        },
        include: {
          productVendorOrders: {
            orderBy: {
              product_name: "asc",
            },
          },
        },
      });
      vendorReturnRemain = {
        sale_code: orderSold.code,
        vendor_name: orderSold.vendor_name,
        sold_at: orderSold.updated_at,
        productVendorReturnRemains: orderSold.productVendorOrders.map((p) => ({
          product_name: p.product_name,
          quantity: p.quantity,
          unit_code: p.unit_code,
          unit_price: p.unit_price,
        })),
      };
    }
    return vendorReturnRemain;
  } catch (error) {
    throw new createError.BadRequest(
      "Cannot get vendor return remain with the given data."
    );
  }
};
