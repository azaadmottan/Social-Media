import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "./apiError.js";

/**
 * Async handler to catch errors in async route handlers
 * and pass them to Express error middleware.
 */
const asyncHandler = (
  requestHandler: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<any>
) => (req: Request, res: Response, next: NextFunction) => {
  Promise
    .resolve(
      requestHandler(req, res, next)
    )
    .catch((error) => {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        return next(new ApiError(400, "Validation failed", formattedErrors));
      }

      next(error)
    });
};

export { asyncHandler };