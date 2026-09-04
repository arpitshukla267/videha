import { createApp } from "./app";
import { connectDatabase } from "./db/connect";
import { env } from "./config/env";

async function main() {
  await connectDatabase();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[CRM] API listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error("[CRM] Failed to start:", err);
  process.exit(1);
});
