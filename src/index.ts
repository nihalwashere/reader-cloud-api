import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import pinoHttp from "pino-http";
import { config } from "./config.js";
import { logger } from "./utils/logger.js";
import { authMiddleware } from "./middleware/auth.js";
import { rateLimitMiddleware } from "./middleware/rate-limit.js";
import { errorHandler } from "./middleware/error-handler.js";
import { scrapeRouter } from "./routes/scrape.js";
import { getReaderClient, closeReaderClient } from "./services/reader.js";

async function main() {
  // Connect to MongoDB
  await mongoose.connect(config.mongodbUri);
  logger.info("Connected to MongoDB");

  // Pre-initialize ReaderClient
  await getReaderClient();

  // Create Express app
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  // Health check (no auth)
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // API routes
  app.use("/v1/scrape", authMiddleware, rateLimitMiddleware, scrapeRouter);

  // Error handler
  app.use(errorHandler);

  // Start server
  const server = app.listen(config.port, () => {
    logger.info({ port: config.port }, "Server started");
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down...");
    server.close();
    await closeReaderClient();
    await mongoose.disconnect();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  logger.fatal(err, "Failed to start server");
  process.exit(1);
});
