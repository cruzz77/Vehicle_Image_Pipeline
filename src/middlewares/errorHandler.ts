import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import multer from "multer";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Multer errors (file size, file type)
  if (err instanceof multer.MulterError) {
    logger.warn({ err: err.message, path: req.path }, "Multer error");
    res.status(400).json({
      success: false,
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "File too large. Maximum size is 10MB."
          : err.message,
    });
    return;
  }

  // Custom app errors
  if (err instanceof AppError) {
    logger.warn({ err: err.message, path: req.path }, "App error");
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Unknown errors
  logger.error({ err, path: req.path }, "Unhandled error");
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn({ path: req.path, method: req.method }, "Route not found");
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
};