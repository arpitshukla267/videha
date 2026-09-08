import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Role } from "../models/Role";
import { Department } from "../models/Department";
import { Lead } from "../models/Lead";
import { buildAssigneeVisibilityFilter } from "../utils/visibility";
import { resolveRolePermissions } from "../constants/permissions";
import { createUser } from "../modules/users/users.service";
import type { AuthUser } from "../middleware/auth";

async function actorFromEmail(email: string): Promise<AuthUser> {
  const user = await User.findOne({ email }).lean();
  if (!user) throw new Error(`Missing user ${email}`);
  const role = await Role.findById(user.roleId).lean();
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    roleId: String(user.roleId),
    roleName: user.roleName,
    departmentId: user.departmentId ? String(user.departmentId) : null,
    permissions: resolveRolePermissions(user.roleName, role?.permissions),
  };
}

async function leadCount(actor: AuthUser) {
  const filter = await buildAssigneeVisibilityFilter(actor, "assignedToId", "createdById");
  return Lead.countDocuments({ archived: { $ne: true }, ...filter });
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const admin = await User.findOne({ roleName: "ADMIN" }).lean();
  if (!admin) throw new Error("Admin user required for test actor");

  const adminActor: AuthUser = {
    id: String(admin._id),
    name: admin.name,
    email: admin.email,
    roleId: String(admin.roleId),
    roleName: admin.roleName,
    departmentId: admin.departmentId ? String(admin.departmentId) : null,
    permissions: resolveRolePermissions("ADMIN", []),
  };

  const salesRole = await Role.findOne({ name: "SALES_MEMBER" });
  const managerRole = await Role.findOne({ name: "MANAGER" });
  if (!salesRole || !managerRole) throw new Error("Missing roles");

  const stamp = Date.now();
  const salesEmail = `verify-sales-${stamp}@test.local`;
  const managerEmail = `verify-manager-${stamp}@test.local`;

  const createdSales = await createUser(
    {
      name: "Verify Sales",
      email: salesEmail,
      password: "test1234",
      roleId: String(salesRole._id),
    },
    adminActor,
  );

  const createdManager = await createUser(
    {
      name: "Verify Manager",
      email: managerEmail,
      password: "test1234",
      roleId: String(managerRole._id),
    },
    adminActor,
  );

  console.log("Created sales departmentId:", createdSales.departmentId);
  console.log("Created manager departmentId:", createdManager.departmentId);

  const salesActor = await actorFromEmail(salesEmail);
  const managerActor = await actorFromEmail(managerEmail);

  const managerBefore = await leadCount(managerActor);
  console.log("Manager leads before any assignment:", managerBefore);

  const rahul = await User.findOne({ email: "rahul.sharma@videhaoverseas.com" }).lean();
  const sampleLead = await Lead.findOne({
    archived: { $ne: true },
    assignedToId: rahul?._id,
  }).lean();

  if (sampleLead) {
    await Lead.updateOne({ _id: sampleLead._id }, { $set: { assignedToId: createdSales.id } });
    const salesWithAssigned = await leadCount(await actorFromEmail(salesEmail));
    console.log("Sales leads after admin pre-assigned one lead:", salesWithAssigned);
    if (rahul?._id) {
      await Lead.updateOne({ _id: sampleLead._id }, { $set: { assignedToId: rahul._id } });
    }
  }

  await User.deleteOne({ email: salesEmail });
  await User.deleteOne({ email: managerEmail });

  const ok =
    Boolean(createdSales.departmentId) &&
    Boolean(createdManager.departmentId) &&
    managerBefore > 0;

  console.log("\nVerification:", ok ? "PASS" : "FAIL");
  await mongoose.disconnect();
  if (!ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
