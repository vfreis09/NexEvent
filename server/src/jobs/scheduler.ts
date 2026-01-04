import cron from "node-cron";
import { processDigestQueue } from "./digestProcessor";

export const startScheduler = (): void => {
  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log("Running Daily Digest...");
      await processDigestQueue("daily");
    },
    { timezone: "America/Sao_Paulo" }
  );

  cron.schedule(
    "0 0 * * 0",
    async () => {
      console.log("Running Weekly Digest...");
      await processDigestQueue("weekly");
    },
    { timezone: "America/Sao_Paulo" }
  );

  console.log(
    "Email digest scheduler started for Daily and Weekly frequencies."
  );
};
