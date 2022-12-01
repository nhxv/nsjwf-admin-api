import createError from "http-errors";
import prisma from "../../prisma/prisma-client";
import { VendorRequestDto, vendorSchema } from "../dto/requests/vendor-request.dto";

export const findActiveVendors = async () => {
  try {
    const vendors = await prisma.vendor.findMany({
      where: {
        discontinued: false,
      }
    });
    return vendors;
  } catch (error) {
    throw new createError.BadRequest("Cannot find vendors.");
  }
}

export const findVendorsByName = async (keyword: string) => {
  try {
    const vendors = await prisma.$queryRaw`
    SELECT * FROM "Vendor"
    WHERE name iLIKE ${`%${keyword}%`}
    ORDER BY id;
    `;
    return vendors;
  } catch (error) {
    throw new createError.BadRequest("Cannot find vendor with the given data.");
  }
}

export const createVendor = async (vendorDto: VendorRequestDto) => {
  try {
    const vendorData: VendorRequestDto = await vendorSchema.validateAsync(vendorDto);
    const newVendor = await prisma.vendor.create({
      data: {
        name: vendorData.name,
        address: vendorData.address,
        phone: vendorData.phone,
        email: vendorData.email,
        presentative: vendorData.presentative,
        discontinued: vendorData.discontinued
      }
    });
    return newVendor;
  } catch (error) {
    throw new createError.BadRequest("Cannot add vendor with the given data.");
  }
}

export const updateVendor = async (vendorDto: VendorRequestDto, id: number) => {
  try {
    const vendorData: VendorRequestDto = await vendorSchema.validateAsync(vendorDto);
    const updatedVendor = await prisma.vendor.update({
      where: {
        id: id
      },
      data: {
        name: vendorData.name,
        address: vendorData.address,
        phone: vendorData.phone,
        email: vendorData.email,
        presentative: vendorData.presentative,
        discontinued: vendorData.discontinued
      }
    });
    return updatedVendor;
  } catch (error) {
    throw new createError.BadRequest("Cannot update vendor with the given data.");
  }
}