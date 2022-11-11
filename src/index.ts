import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import routes from "./routes/routes";
import cookieParser from "cookie-parser";
import HttpException from "./commons/exceptions/http.exception";

require("dotenv").config();

const app = express();

app.use(cors({
  origin: "https://sjwh-admin.vercel.app",
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(routes);

// Error handler
app.use((err: Error | HttpException, req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  if (err && err.errorCode) {
    // @ts-ignore
    res.status(err.errorCode).json(err.message);
  } else if (err) {
    res.status(500).json(err.message);
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.info(`server up on port ${PORT}`);
});