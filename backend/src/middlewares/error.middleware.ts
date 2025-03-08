import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError.js";

const errorMiddleware = (
  err: ApiError, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  console.error("Error:", err.message);

  res.status(err.statusCode || 500).json(
    err instanceof ApiError
      ? err.format()
      : new ApiError(500, "Internal Server Error").format()
  );
};

export default errorMiddleware;