import mongoose from "mongoose";
import { connectDatabase } from "./db/connect";

async function flushDatabase() {
  console.log("[Flush] Connecting to database...");
  await connectDatabase();

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection not established.");
  }

  const dbName = db.databaseName;
  console.log(`[Flush] Target database: "${dbName}"`);

  const collections = await db.collections();
  if (collections.length === 0) {
    console.log("[Flush] Database is already empty. No collections found.");
  } else {
    console.log(`[Flush] Found ${collections.length} collection(s). Dropping...`);
    for (const col of collections) {
      const colName = col.collectionName;
      if (colName.startsWith("system.")) {
        continue;
      }
      try {
        await col.drop();
        console.log(`[Flush]  ✓ Dropped collection: ${colName}`);
      } catch (err: unknown) {
        const error = err as { codeName?: string; code?: number; message?: string };
        if (error.codeName === "NamespaceNotFound" || error.code === 26) {
          console.log(`[Flush]  - Collection ${colName} already deleted.`);
        } else {
          console.warn(`[Flush]  ! Could not drop ${colName}:`, error.message);
        }
      }
    }
  }

  console.log(`\n[Flush] Database "${dbName}" has been successfully flushed.`);
  console.log("[Flush] All collections and seeded records have been wiped clean.");

  await mongoose.disconnect();
  process.exit(0);
}

flushDatabase().catch((err) => {
  console.error("[Flush] Operation failed:", err);
  process.exit(1);
});
