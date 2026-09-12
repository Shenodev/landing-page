import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    statusCode: 404,
  });
};

export const globalErrorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode: number = err.statusCode ?? 500;
  const message: string = err.message ?? 'Internal Server Error';

  console.error(`[error] ${statusCode} - ${message}`, err.stack);

  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : err.name ?? 'Error',
    message,
    statusCode,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
