import { Request, Response, NextFunction } from "express";

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
    .catch(
      (error) => next(error)
    );
};

export { asyncHandler };