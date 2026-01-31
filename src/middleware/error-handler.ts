import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(err, "Unhandled error");

  const name = err.constructor.name;
  let status = 500;
  let message = "Internal server error";

  if (name === "TimeoutError" || err.message?.includes("timeout")) {
    status = 504;
    message = "Scrape timed out";
  } else if (name === "NetworkError" || err.message?.includes("ECONNREFUSED")) {
    status = 502;
    message = "Failed to reach target URL";
  } else if (err.message?.includes("Invalid") || err.message?.includes("required")) {
    status = 400;
    message = err.message;
  }

  res.status(status).json({ success: false, error: message });
}
