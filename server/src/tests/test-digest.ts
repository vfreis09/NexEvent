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

  console.log(
    `DATABASE_URL: ${process.env.DATABASE_URL ? "✅ FOUND" : "❌ NOT FOUND"}`,
  );
  console.log(
    `BREVO_API_KEY: ${process.env.BREVO_API_KEY ? "✅ FOUND" : "❌ NOT FOUND"}`,
  );
  console.log(`-----------------------`);

  if (!process.env.DATABASE_URL) {
    console.error("❌ Failed to load DATABASE_URL. Check your .env file.");
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
