import { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/**
 * Wrap an async route handler so that rejected promises are forwarded to the
 * Express error middleware instead of crashing the process.
 *
 * Express 5 natively forwards rejected async handler promises, but wrapping
 * explicitly makes the intent visible and provides a safety net for any
 * remaining synchronous `next(err)` code in the handler.
 */
export const asyncHandler = (handler: AsyncRequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    void Promise.resolve(handler(req, res, next)).catch(next);
  };
};