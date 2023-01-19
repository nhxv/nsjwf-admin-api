import createError from "http-errors";

export type HttpException = Error & { status: number };

export const handleValidationError = (error) => {
  let message = "";
  for (let i = 0; i < error.details.length; i++) {
    if (i === error.details.length - 1) {
      message += error.details[i].message;
    } else {
      message += error.details[i].message + ", ";
    }
  }
  throw new createError.BadRequest(message);
}