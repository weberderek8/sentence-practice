import { config } from "./config.js";
import { connect } from "./db.js";
import { createApp } from "./app.js";

async function main() {
  await connect();
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[audio] listening on port ${config.port}`);
  });
}

main().catch((err) => {
  console.error("[audio] failed to start:", err);
  process.exit(1);
});
