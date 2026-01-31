import rateLimit from "express-rate-limit";
import type { Request } from "express";
import { config } from "../config.js";

export const rateLimitMiddleware = rateLimit({
  windowMs: 60 * 1000,
  limit: (req: Request) => {
    return req.apiKey?.rateLimit ?? config.rateLimitRpm;
  },
  keyGenerator: (req: Request) => {
    return req.apiKey?.key ?? req.ip ?? "unknown";
  },
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, error: "Rate limit exceeded. Try again later." },
});
