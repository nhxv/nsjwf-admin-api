import createError from "http-errors";
import prisma from "../../prisma/prisma-client";
import { handleValidationError } from "../commons/http.exception";
import {
  VendorRequestDto,
  vendorSchema,
} from "../dto/requests/vendor-request.dto";

export const findAllVendors = async () => {
  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return vendors;
  } catch (error) {
    throw new createError.BadRequest("Cannot find vendors.");
  }
};

export const findActiveVendors = async () => {
  try {
    const vendors = await prisma.vendor.findMany({
      where: {
        discontinued: false,
      },
      orderBy: {
        name: "asc",
      },
    });
    return vendors;
  } catch (error) {
    throw new createError.BadRequest("Cannot find vendors.");
  }
};

export const findVendorById = async (id: number) => {
  try {
    const vendor = await prisma.vendor.findUniqueOrThrow({
      where: {
        id: id,
      },
      include: {
        vendorProductTendencies: {
          orderBy: {
            name: "asc",
          },
        },
      },
    });
    return vendor;
  } catch (error) {
    throw new createError.BadRequest("Cannot find vendor with the given data.");
  }
};

export const findVendorTendencyByName = async (name: string) => {
  try {
    const tendency = await prisma.vendor.findUnique({
      where: {
        name: name,
      },
      include: {
        vendorProductTendencies: {
          orderBy: {
            name: "asc",
          },
        },
      },
    });
    return tendency;
  } catch (error) {
    throw new createError.BadRequest(
      "Cannot find vendor tendency with the given data."
    );
  }
};

export const createVendor = async (vendorDto: VendorRequestDto) => {
  try {
    const vendorData: VendorRequestDto = await vendorSchema.validateAsync(
      vendorDto
    );
    const productTendencies = vendorData.vendorProductTendencies.map(
      (product) => ({
        name: product.productName,
        quantity: product.quantity,
        unit_code: product.unitCode,
      })
    );
    const newVendor = await prisma.vendor.create({
      data: {
        name: vendorData.name,
        address: vendorData.address,
        phone: vendorData.phone,
        email: vendorData.email,
        presentative: vendorData.presentative,
        discontinued: vendorData.discontinued,
        vendorProductTendencies: {
          create: productTendencies,
        },
      },
    });
    return newVendor;
  } catch (error) {
    if (error.details?.length > 0) {
      handleValidationError(error);
    }
    throw new createError.BadRequest("Cannot add vendor with the given data.");
  }
};

export const updateVendor = async (vendorDto: VendorRequestDto, id: number) => {
  try {
    const vendorData: VendorRequestDto = await vendorSchema.validateAsync(
      vendorDto
    );
    const productTendencies = vendorData.vendorProductTendencies.map(
      (product) => ({
        name: product.productName,
        quantity: product.quantity,
        unit_code: product.unitCode,
      })
    );
    return await prisma.$transaction(async (tx) => {
      const updatedVendor = await prisma.vendor.update({
        where: {
          id: id,
        },
        include: {
          vendorProductTendencies: true,
        },
        data: {
          name: vendorData.name,
          address: vendorData.address,
          phone: vendorData.phone,
          email: vendorData.email,
          presentative: vendorData.presentative,
          discontinued: vendorData.discontinued,
        },
      });

      // delete product not in request
      for (const product of updatedVendor.vendorProductTendencies) {
        const found = productTendencies.find((p) => p.name === product.name);
        if (!found) {
          const deletedProduct = await tx.vendorProductTendency.delete({
            where: {
              VendorProductTendency_key: {
                vendor_name: vendorData.name,
                name: product.name,
              },
            },
          });
        }
      }

      // update/insert product in request
      for (const product of productTendencies) {
        const updatedProduct = await tx.vendorProductTendency.upsert({
          where: {
            VendorProductTendency_key: {
              vendor_name: vendorData.name,
              name: product.name,
            },
          },
          update: {
            quantity: product.quantity,
            unit_code: product.unit_code,
          },
          create: {
            vendor_name: vendorData.name,
            name: product.name,
            quantity: product.quantity,
            unit_code: product.unit_code,
          },
        });
      }
    });
  } catch (error) {
    if (error.details?.length > 0) {
      handleValidationError(error);
    }
    throw new createError.BadRequest(
      "Cannot update vendor with the given data."
    );
  }
};
