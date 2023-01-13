import createError from "http-errors";
import prisma from "../../prisma/prisma-client";
import { CustomerRequestDto, customerSchema } from "../dto/requests/customer-request.dto";

export const findActiveCustomers = async () => {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        discontinued: false,
      },
      orderBy: {
        name: "asc",
      }
    });
    return customers;
  } catch (error) {
    throw new createError.BadRequest("Cannot find customers.");
  }
}

export const findCustomerById = async (id: number) => {
  try {
    const customer = await prisma.customer.findUniqueOrThrow({
      where: {
        id: id,
      },
      include: {
        customerProductTendencies: {
          orderBy: {
            name: "asc",
          },
        }
      },
    });
    return customer;
  } catch (error) {
    throw new createError.BadRequest("Cannot find customer with the given data.");    
  }
}

export const findCustomersByName = async (keyword: string) => {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        name: {
          contains: keyword,
          mode: "insensitive",
        }
      },
      orderBy: {
        name: "asc",
      }
    });
    return customers;
  } catch (error) {
    throw new createError.BadRequest("Cannot find customer with the given data.");
  }
}

export const findCustomerTendencyByName = async (name: string) => {
  try {
    const tendency = await prisma.customer.findUnique({
      where: {
        name: name,
      },
      include: {
        customerProductTendencies: true,
      }
    });
    return tendency;
  } catch (error) {
    throw new createError.BadRequest("Cannot find customer tendency with the given data.");
  }
}

export const createCustomer = async (customerDto: CustomerRequestDto) => {
  try {
    const customerData: CustomerRequestDto = await customerSchema.validateAsync(customerDto);
    const productTendencies = customerData.customerProductTendencies.map((product) => ({ 
      name: product.productName,
      quantity: product.quantity,
    }));
    const newCustomer = await prisma.customer.create({
      data: {
        name: customerData.name,
        address: customerData.address,
        phone: customerData.phone,
        email: customerData.email,
        presentative: customerData.presentative,
        discontinued: customerData.discontinued,
        customerProductTendencies: {
          create: productTendencies,
        }
      }
    });
    return newCustomer;
  } catch (error) {
    throw new createError.BadRequest("Cannot add customer with the given data.");
  }
}

export const updateCustomer = async (customerDto: CustomerRequestDto, id: number) => {
  try {
    const customerData: CustomerRequestDto = await customerSchema.validateAsync(customerDto);
    const productTendencies = customerData.customerProductTendencies.map((product) => ({ 
      name: product.productName,
      quantity: product.quantity,
    }));
    return await prisma.$transaction(async (tx) => {
      const updatedCustomer = await prisma.customer.update({
        where: {
          id: id
        },
        include: {
          customerProductTendencies: true,
        },
        data: {
          name: customerData.name,
          address: customerData.address,
          phone: customerData.phone,
          email: customerData.email,
          presentative: customerData.presentative,
          discontinued: customerData.discontinued
        }
      });

      // delete product not in request
      for (const product of updatedCustomer.customerProductTendencies) {
        const found = productTendencies.find(p => p.name === product.name);
        if (!found) {
          const deletedProduct = await tx.customerProductTendency.delete({
            where: {
              CustomerProductTendency_key: {
                customer_name: customerData.name,
                name: product.name,
              }
            }
          });
        }
      }

      // update/insert product in request
      for (const product of productTendencies) {
        const updatedProduct = await tx.customerProductTendency.upsert({
          where: {
            CustomerProductTendency_key: {
              customer_name: customerData.name,
              name: product.name,
            }
          },
          update: {
            quantity: product.quantity,
          },
          create: {
            customer_name: customerData.name,
            name: product.name,
            quantity: product.quantity,
          },
        });
      }
    })
  } catch (error) {
    throw new createError.BadRequest("Cannot update customer with the given data.");
  }
}