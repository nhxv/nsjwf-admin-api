import createError  from "http-errors";

export const findVendorSaleReturnByCode = async (code: string) => {
  let vendorSaleReturn;
  try {
    vendorSaleReturn = await prisma.vendorSaleReturn.findUnique({
      where: {
        sale_code: code,
      },
      include: {
        productVendorSaleReturns: {
          orderBy: {
            product_name: "asc",
          }
        },
      }
    });
    if (!vendorSaleReturn) {
      // get order sold instead
      const orderSold = await prisma.vendorOrder.findUniqueOrThrow({
        where: {
          code: code,
        },
        include: {
          productVendorOrders: {
            orderBy: {
              product_name: "asc",
            }
          },
        }
      });
      vendorSaleReturn = {
        sale_code: orderSold.code,
        vendor_name: orderSold.vendor_name,
        sold_at: orderSold.updated_at,
        productVendorSaleReturns: orderSold.productVendorOrders.map(p => ({
          product_name: p.product_name,
          quantity: p.quantity,
          unit_price: p.unit_price,
        })),
      }
    }
    return vendorSaleReturn;
  } catch (error) {
    throw new createError.BadRequest("Cannot get vendor sale return with the given data.");
  }
}