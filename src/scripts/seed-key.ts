import mongoose from "mongoose";
import crypto from "crypto";
import { config } from "../config.js";
import { ApiKey } from "../models/api-key.js";

async function seed() {
  await mongoose.connect(config.mongodbUri);

  const key = `rdr_${crypto.randomBytes(24).toString("hex")}`;

  const apiKey = await ApiKey.create({
    key,
    name: "Default API Key",
    active: true,
    rateLimit: 60,
  });

  console.log("API key created:");
  console.log(`  Key:  ${key}`);
  console.log(`  Name: ${apiKey.name}`);
  console.log(`  ID:   ${apiKey._id}`);
  console.log("\nUse this in your requests:");
  console.log(`  curl -X POST http://localhost:${config.port}/v1/scrape \\`);
  console.log(`    -H "X-API-Key: ${key}" \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"url": "https://example.com"}'`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
