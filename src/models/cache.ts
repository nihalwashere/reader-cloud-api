import mongoose, { Schema, type Document } from "mongoose";
import { config } from "../config.js";

export interface ICacheEntry extends Document {
  cacheKey: string;
  url: string;
  markdown: string;
  html: string;
  metadata: {
    title: string | null;
    description: string | null;
    duration: number;
    scrapedAt: string;
  };
  createdAt: Date;
}

const cacheEntrySchema = new Schema<ICacheEntry>({
  cacheKey: { type: String, required: true, unique: true, index: true },
  url: { type: String, required: true },
  markdown: { type: String, default: "" },
  html: { type: String, default: "" },
  metadata: {
    title: { type: String, default: null },
    description: { type: String, default: null },
    duration: { type: Number, default: 0 },
    scrapedAt: { type: String, default: "" },
  },
  createdAt: { type: Date, default: Date.now, expires: config.cacheTtlSeconds },
});

export const CacheEntry = mongoose.model<ICacheEntry>(
  "CacheEntry",
  cacheEntrySchema
);
