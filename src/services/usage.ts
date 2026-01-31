import type { Types } from "mongoose";
import { UsageLog } from "../models/usage.js";
import { logger } from "../utils/logger.js";

interface LogUsageParams {
  apiKeyId: Types.ObjectId;
  url: string;
  duration: number;
  status: "success" | "error";
  cached: boolean;
  error?: string;
}

export async function logUsage(params: LogUsageParams): Promise<void> {
  try {
    await UsageLog.create(params);
  } catch (err) {
    logger.error(err, "Failed to log usage");
  }
}
