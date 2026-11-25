import { connectDatabase } from "../db/connect";
import { User } from "../models/User";
import { Role } from "../models/Role";

async function main() {
  await connectDatabase();
  const users = await User.find().lean();
  console.log("=== ALL USERS IN DB ===");
  for (const u of users) {
    console.log(JSON.stringify({
      id: u._id,
      email: u.email,
      name: u.name,
      roleName: u.roleName,
      roleId: u.roleId,
      designation: u.designation,
      status: u.status,
    }, null, 2));
  }

  const roles = await Role.find().lean();
  console.log("\n=== ALL ROLES IN DB ===");
  for (const r of roles) {
    console.log(JSON.stringify({
      id: r._id,
      name: r.name,
      displayName: r.displayName,
      isSystem: r.isSystem,
      permissionsCount: r.permissions.length,
    }, null, 2));
  }
  process.exit(0);
}

main().catch(console.error);
