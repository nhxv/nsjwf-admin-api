import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import createError from "http-errors";
import { HttpException } from "./commons/http.exception";
import routes from "./routes/routes";

require("dotenv").config();

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
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.info(`server up on port ${PORT}`);
});
