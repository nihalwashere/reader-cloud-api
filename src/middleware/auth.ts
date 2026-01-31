import type { Request, Response, NextFunction } from "express";
import { ApiKey, type IApiKey } from "../models/api-key.js";
import { logger } from "../utils/logger.js";

declare global {
  namespace Express {
    interface Request {
      apiKey?: IApiKey;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const key = req.headers["x-api-key"] as string | undefined;

  if (!key) {
    res.status(401).json({ success: false, error: "Missing X-API-Key header" });
    return;
  }

  try {
    const apiKey = await ApiKey.findOne({ key, active: true });

    if (!apiKey) {
      res.status(401).json({ success: false, error: "Invalid or inactive API key" });
      return;
    }

    req.apiKey = apiKey;
    next();
  } catch (err) {
    logger.error(err, "Auth middleware error");
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}
