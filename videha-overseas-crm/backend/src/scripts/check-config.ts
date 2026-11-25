import { connectDatabase } from "../db/connect";
import { AssignmentConfig } from "../models/AssignmentConfig";

async function checkConfig() {
  await connectDatabase();
  const configs = await AssignmentConfig.find().lean();
  console.log("=== ASSIGNMENT CONFIGS ===");
  console.log(JSON.stringify(configs, null, 2));
  process.exit(0);
}

checkConfig().catch(console.error);
