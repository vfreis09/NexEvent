import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const envPaths = [
  path.join(process.cwd(), ".env"),
  path.join(__dirname, ".env"),
  path.join(__dirname, "..", ".env"),
];

for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    console.log(`✅ Loaded .env from: ${p}`);
    break;
  }
}

async function test() {
  console.log(`--- Connection Check ---`);
  console.log(`DB User: ${process.env.DB_USERNAME || "❌ NOT FOUND"}`);
  console.log(`DB Name: ${process.env.DB_DATABASE || "❌ NOT FOUND"}`);
  console.log(`-----------------------`);

  if (!process.env.DB_USERNAME) {
    console.error("❌ Failed to load env. Authentication will fail.");
    process.exit(1);
  }

  const { processDigestQueue } = require("./src/jobs/digestProcessor");

  console.log("🚀 Manually triggering the Daily Digest...");

  try {
    await processDigestQueue("daily");
    console.log("✅ Batch processed successfully.");
  } catch (err) {
    console.error("❌ Batch failed:", err);
  } finally {
    process.exit();
  }
}

test();
