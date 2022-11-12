import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import routes from "./routes/routes";
import cookieParser from "cookie-parser";
import createError from "http-errors";
import { HttpException } from "./commons/http.exception";

require("dotenv").config();

const app = express();

app.use(cors({
  origin: process.env.CORS,
}));

app.use(cookieParser());
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