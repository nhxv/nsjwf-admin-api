import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import createError from "http-errors";
import { HttpException } from "./commons/http.exception";
import routes from "./routes/routes";

require("dotenv").config();

if (!process.env.ACCESS_TOKEN_SECRET) {
  throw new Error("ACCESS_TOKEN_SECRET is not set.");
}

const app = express();

app.use(
  cors({
    origin: process.env.CORS,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(routes);

/**
 * Error handlers
 */
app.use(async (req, res, next) => {
  next(new createError.NotFound("Route not found"));
});

app.use(async (err: HttpException, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status);
  res.send({
    error: {
      status: status,
      // Don't leak internal error details (e.g. Prisma messages) to the client.
      message: err.status ? err.message : "Internal server error.",
    },
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.info(`server up on port ${PORT}`);
});
