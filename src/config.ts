export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/reader-cloud",
  readerPoolSize: parseInt(process.env.READER_POOL_SIZE || "3", 10),
  rateLimitRpm: parseInt(process.env.RATE_LIMIT_RPM || "60", 10),
  cacheTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || "86400", 10),
  proxyDatacenter: process.env.PROXY_DATACENTER || "",
  nodeEnv: process.env.NODE_ENV || "development",
} as const;
