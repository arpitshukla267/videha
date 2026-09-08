import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../models/User";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const db = mongoose.connection.db!;
  const rows = await db
    .collection("users")
    .find({}, { projection: { email: 1, departmentId: 1, roleName: 1 } })
    .toArray();
  for (const row of rows) {
    console.log(
      row.email,
      row.roleName,
      "deptType:",
      row.departmentId == null ? "null" : row.departmentId?.constructor?.name ?? typeof row.departmentId,
      row.departmentId,
    );
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
