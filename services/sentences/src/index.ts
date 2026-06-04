import mongoose from "mongoose";
import { config } from "./config.js";
import { createApp } from "./app.js";

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log("[sentences] connected to MongoDB");

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[sentences] listening on port ${config.port}`);
  });
}

main().catch((err) => {
  console.error("[sentences] failed to start:", err);
  process.exit(1);
});
