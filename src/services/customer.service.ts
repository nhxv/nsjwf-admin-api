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
        name: "asc"
      }
    });
    return customers;
  } catch (error) {
    throw new createError.BadRequest("Cannot find customers.");
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

export const createCustomer = async (customerDto: CustomerRequestDto) => {
  try {
    const customerData: CustomerRequestDto = await customerSchema.validateAsync(customerDto);
    const newCustomer = await prisma.customer.create({
      data: {
        name: customerData.name,
        address: customerData.address,
        phone: customerData.phone,
        email: customerData.email,
        presentative: customerData.presentative,
        discontinued: customerData.discontinued
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
    const updatedCustomer = await prisma.customer.update({
      where: {
        id: id
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
    return updatedCustomer;
  } catch (error) {
    throw new createError.BadRequest("Cannot update customer with the given data.");
  }
}