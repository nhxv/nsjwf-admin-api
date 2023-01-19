import { convertLocalStart } from "./../commons/time.util";
import { CustomerReturnRequestDto, customerReturnSchema } from "../dto/requests/customer-return-request.dto";
import { Prisma } from "@prisma/client";
import createError  from "http-errors";
import { ProductStockChangeReason } from "../commons/product-stock-change-reason.enum";
import { generateCurrentTime } from "../commons/time.util";
import { OrderStatus } from "../commons/order-status.enum";
import { handleValidationError } from "../commons/http.exception";

export const findCustomerReturns = async () => {
  try {
    const customerReturns = await prisma.customerReturn.findMany({
      where: {
        created_at: {
          gte: convertLocalStart(),
        }
      },
      include: {
        productCustomerReturns: {
          orderBy: {
            product_name: "asc",
          }
        },
      },
      orderBy: {
        created_at: "asc",
      },
    }); 
    return customerReturns;
  } catch (error) {
    if (typeof error === "string") {
      throw new createError.BadRequest(error);
    }
    throw new createError.BadRequest("Cannot find customer return with the given status.");
  }
}

export const createCustomerReturn = async (customerReturnRequestDto: CustomerReturnRequestDto) => {
  try {
    // Validate customer return
    const customerReturnData: CustomerReturnRequestDto = await customerReturnSchema.validateAsync(customerReturnRequestDto);
    const notZero = customerReturnData.productCustomerReturns.filter(
      pr => pr.quantity > 0 && new Prisma.Decimal(pr.unitPrice).greaterThan(new Prisma.Decimal(0))
    );
    if (notZero.length < 1) {
      throw `Hollow order.`;
    }
    const time = generateCurrentTime();
    const productReturns = notZero.map(
      productReturn => ({
        product_name: productReturn.productName,
        return_id: productReturn.returnId,
        unit_price: new Prisma.Decimal(new Prisma.Decimal(productReturn.unitPrice).toPrecision(2)),
        quantity: productReturn.quantity,
        created_at: time,
      })
    );

    return await prisma.$transaction(async (tx) => {
      const existingSaleReturn = await tx.customerSaleReturn.findUnique({
        where: {
          sale_code: customerReturnData.orderCode,
        },
        include: {
          productCustomerSaleReturns: true,
        }
      });
      if (!existingSaleReturn) {
        // validate with order sold
        const orderSold = await tx.customerOrder.findUniqueOrThrow({
          where: {
            CustomerOrderSold_key: {
              code: customerReturnData.orderCode,
              is_sold: true,
            }
          },
          include: {
            productCustomerOrders: true,
          }
        });
        if (orderSold.status !== OrderStatus.COMPLETED) {
          return `Please don't hack us.`;
        }
        const newProductSaleReturns = new Map();
        for (const productSold of orderSold.productCustomerOrders) {
          newProductSaleReturns.set(productSold.product_name, {
            product_name: productSold.product_name,
            quantity: productSold.quantity,
            unit_price: productSold.unit_price,
          });
        }
        for (const productReturn of productReturns) {
          const productOrderSold = newProductSaleReturns.get(productReturn.product_name);
          if (
            !productOrderSold ||
            productOrderSold.quantity - productReturn.quantity < 0 ||
            !productReturn.unit_price.equals(productOrderSold.unit_price)
          ) {
            throw `${productReturn.product_name}: Invalid product data.`;
          }
          newProductSaleReturns.set(productReturn.product_name, {
            ...newProductSaleReturns.get(productReturn.product_name),
            quantity: productOrderSold.quantity - productReturn.quantity,
          });
        }
        // create sale return -- since this is the first return
        const newSaleReturn = await tx.customerSaleReturn.create({
          data: {
            sale_code: customerReturnData.orderCode,
            customer_name: customerReturnData.customerName,
            sold_at: orderSold.updated_at,
            productCustomerSaleReturns: {
              create: Array.from(newProductSaleReturns.values()),
            }
          }
        }); 
      } else {
        // validate with existing sale returns -- this is NOT the first return
        const existingProductSaleReturns = new Map();
        for (const productSaleReturn of existingSaleReturn.productCustomerSaleReturns) {
          existingProductSaleReturns.set(
            productSaleReturn.product_name, 
            {"quantity": productSaleReturn.quantity, "unit_price": productSaleReturn.unit_price}
          );
        }
        for (const productReturn of productReturns) {
          const productSaleReturn = existingProductSaleReturns.get(productReturn.product_name);
          if (
            !productSaleReturn || 
            productSaleReturn.quantity - productReturn.quantity < 0 ||
            !productReturn.unit_price.equals(productSaleReturn.unit_price)
          ) {
            throw `${productReturn.product_name}: Invalid product data.`;
          }          
          // update product sale return quantity
          const updatedProductSaleReturn = await tx.productCustomerSaleReturn.update({
            where: {
              ProductCustomerSaleReturn_key: {
                customer_sale_return_code: customerReturnData.orderCode,
                product_name: productReturn.product_name,
              }
            },
            data: {
              quantity: {
                increment: 0 - productReturn.quantity,
              }
            }
          });
        }
      }

      // create return
      const newCustomerReturn = await tx.customerReturn.create({
        data: {
          customer_name: customerReturnData.customerName,
          order_code: customerReturnData.orderCode, 
          created_at: time,
          recommended_price: new Prisma.Decimal(new Prisma.Decimal(customerReturnData.recommendedPrice).toPrecision(2)),
          final_price: new Prisma.Decimal(new Prisma.Decimal(customerReturnData.recommendedPrice).toPrecision(2)),
          productCustomerReturns: {
            create: productReturns
          }
        }
      });      

      // increase stock
      // create stock change history
      const addedProductStockChangeHistory = await tx.productStockChangeHistory.create({
        data: {
          created_at: time,
          reason: ProductStockChangeReason.CUSTOMER_RETURN_RECEIVED
        }
      });

      for (const productReturn of productReturns) {
        // update product stock
        const updatedProductStock = await tx.productStock.update({
          where: {
            product_name: productReturn.product_name,
          },
          data: {
            quantity: {
              increment: productReturn.quantity,
            },
            updated_at: time,
          }
        });

        // create stock change
        const addedProductStockChange = await tx.productStockChange.create({
          data: {
            stock_id: updatedProductStock.id,
            change_id: addedProductStockChangeHistory.id,
            quantity_change: productReturn.quantity,
          }
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
    throw new createError.BadRequest("Cannot create customer return with the given data.");
  }
}