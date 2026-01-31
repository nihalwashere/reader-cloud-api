import { Router, type Request, type Response, type NextFunction } from "express";
import { getReaderClient } from "../services/reader.js";
import { getCached, setCache, type ScrapeParams } from "../services/cache.js";
import { logUsage } from "../services/usage.js";
import { logger } from "../utils/logger.js";

const router = Router();

interface ScrapeBody {
  url: string;
  formats?: ("markdown" | "html")[];
  onlyMainContent?: boolean;
  includeTags?: string[];
  excludeTags?: string[];
  waitForSelector?: string;
  timeoutMs?: number;
}

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const body = req.body as ScrapeBody;

  if (!body.url || typeof body.url !== "string") {
    res.status(400).json({ success: false, error: "url is required" });
    return;
  }

  const formats = body.formats ?? ["markdown"];
  const scrapeParams: ScrapeParams = {
    onlyMainContent: body.onlyMainContent,
    includeTags: body.includeTags,
    excludeTags: body.excludeTags,
    waitForSelector: body.waitForSelector,
  };

  try {
    // Check cache (keyed on url + params)
    const cached = await getCached(body.url, scrapeParams);
    if (cached) {
      const duration = Date.now() - start;

      logUsage({
        apiKeyId: req.apiKey!._id,
        url: body.url,
        duration,
        status: "success",
        cached: true,
      });

      res.json({
        success: true,
        cached: true,
        data: {
          markdown: formats.includes("markdown") ? cached.markdown : undefined,
          html: formats.includes("html") ? cached.html : undefined,
          metadata: {
            url: body.url,
            title: cached.metadata.title,
            description: cached.metadata.description,
            duration,
            scrapedAt: cached.metadata.scrapedAt,
          },
        },
      });
      return;
    }

    // Cache miss — always scrape both formats so the cache is complete
    const reader = await getReaderClient();
    const result = await reader.scrape({
      urls: [body.url],
      formats: ["markdown", "html"],
      onlyMainContent: body.onlyMainContent ?? true,
      includeTags: body.includeTags,
      excludeTags: body.excludeTags,
      waitForSelector: body.waitForSelector ?? undefined,
      timeoutMs: body.timeoutMs ?? 30000,
    });

    const page = result.data[0];
    if (!page) {
      throw new Error("Scrape returned no data");
    }

    const duration = Date.now() - start;
    const scrapedAt = new Date().toISOString();

    const fullData = {
      markdown: page.markdown ?? "",
      html: page.html ?? "",
      metadata: {
        title: page.metadata?.website?.title ?? null,
        description: page.metadata?.website?.description ?? null,
        duration,
        scrapedAt,
      },
    };

    // Store both formats in cache (fire and forget)
    setCache(body.url, scrapeParams, fullData);

    // Log usage (fire and forget)
    logUsage({
      apiKeyId: req.apiKey!._id,
      url: body.url,
      duration,
      status: "success",
      cached: false,
    });

    // Return only the formats the caller asked for
    res.json({
      success: true,
      cached: false,
      data: {
        markdown: formats.includes("markdown") ? fullData.markdown : undefined,
        html: formats.includes("html") ? fullData.html : undefined,
        metadata: {
          url: body.url,
          ...fullData.metadata,
        },
      },
    });
  } catch (err) {
    const duration = Date.now() - start;

    logUsage({
      apiKeyId: req.apiKey!._id,
      url: body.url,
      duration,
      status: "error",
      cached: false,
      error: err instanceof Error ? err.message : "Unknown error",
    });

    logger.error({ err, url: body.url }, "Scrape failed");
    next(err);
  }
});

export { router as scrapeRouter };
