import { ReaderClient } from "@vakra-dev/reader";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";

let client: ReaderClient | null = null;

export async function getReaderClient(): Promise<ReaderClient> {
  if (!client) {
    const proxies = config.proxyDatacenter
      ? [{ url: config.proxyDatacenter, type: "datacenter" as const }]
      : undefined;

    client = new ReaderClient({
      verbose: config.nodeEnv !== "production",
      browserPool: {
        size: config.readerPoolSize,
      },
      proxies,
    });
    logger.info(
      { poolSize: config.readerPoolSize, proxy: !!proxies },
      "ReaderClient initialized"
    );
  }
  return client;
}

export async function closeReaderClient(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    logger.info("ReaderClient closed");
  }
}
