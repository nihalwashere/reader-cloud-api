import crypto from "crypto";
import { CacheEntry, type ICacheEntry } from "../models/cache.js";
import { logger } from "../utils/logger.js";

export interface ScrapeParams {
  onlyMainContent?: boolean;
  includeTags?: string[];
  excludeTags?: string[];
  waitForSelector?: string;
}

export interface CachedData {
  markdown: string;
  html: string;
  metadata: {
    title: string | null;
    description: string | null;
    duration: number;
    scrapedAt: string;
  };
}

function buildCacheKey(url: string, params: ScrapeParams): string {
  const normalized = {
    url,
    onlyMainContent: params.onlyMainContent ?? true,
    includeTags: params.includeTags ?? [],
    excludeTags: params.excludeTags ?? [],
    waitForSelector: params.waitForSelector ?? null,
  };
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(normalized))
    .digest("hex")
    .slice(0, 16);
  return `${url}::${hash}`;
}

export async function getCached(
  url: string,
  params: ScrapeParams
): Promise<CachedData | null> {
  try {
    const cacheKey = buildCacheKey(url, params);
    const entry = await CacheEntry.findOne({ cacheKey }).lean<ICacheEntry>();
    if (!entry) return null;

    logger.debug({ url, cacheKey }, "Cache hit");
    return {
      markdown: entry.markdown,
      html: entry.html,
      metadata: entry.metadata,
    };
  } catch (err) {
    logger.error(err, "Cache lookup error");
    return null;
  }
}

export async function setCache(
  url: string,
  params: ScrapeParams,
  data: CachedData
): Promise<void> {
  try {
    const cacheKey = buildCacheKey(url, params);
    await CacheEntry.findOneAndUpdate(
      { cacheKey },
      {
        cacheKey,
        url,
        markdown: data.markdown,
        html: data.html,
        metadata: data.metadata,
        createdAt: new Date(),
      },
      { upsert: true }
    );
    logger.debug({ url, cacheKey }, "Cache set");
  } catch (err) {
    logger.error(err, "Cache write error");
  }
}
