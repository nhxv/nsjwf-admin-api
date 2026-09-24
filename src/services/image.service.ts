import prisma from "../../prisma/prisma-client";
import createError from "http-errors";
import path from "node:path";

export const fetchImageFromVendorOrder = async (code: string) => {
  try {
    const vo = await prisma.vendorOrder.findUniqueOrThrow({
      where: {
        code: code,
      },
      select: {
        attachment: true,
      },
    });

    if (vo.attachment) {
      // TODO: Add a check to make sure it points to THE directory, not
      // just some random directory like from root or whatever.
      // Return cwd if vo.attachment is not a valid path.
      const attachmentPath = path.resolve(vo.attachment);

      return attachmentPath;
    } else {
      return "";
    }
  } catch (error) {
    throw new createError.BadRequest("Cannot find vendor with the given code.");
  }
};
