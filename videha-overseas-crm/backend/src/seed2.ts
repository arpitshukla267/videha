import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "./db/connect";
import { Role } from "./models/Role";
import { Department } from "./models/Department";
import { User } from "./models/User";
import { ROLE_PERMISSIONS, ALL_PERMISSION_CODES } from "./constants/permissions";

const ROLE_META: Record<
  string,
  { displayName: string; description: string }
> = {
  SUPER_ADMIN: {
    displayName: "Super Admin",
    description: "Full administrative access across the entire Videha Overseas CRM system.",
  },
  ADMIN: {
    displayName: "Administrator",
    description: "Manage CRM operations, team members, leads, tasks, orders, and reports.",
  },
  MANAGER: {
    displayName: "Manager",
    description: "Oversee assigned sales and operational teams, delegate leads, and monitor tasks.",
  },
  SALES_MEMBER: {
    displayName: "Sales Member",
    description: "Manage client leads, qualify product interests, schedule follow-ups, and update tasks.",
  },
  OPERATIONS: {
    displayName: "Operations Specialist",
    description: "Handle logistics, cargo shipping, order milestones, and operational dispatch.",
  },
};

const DEPARTMENTS = [
  { name: "Management", description: "Executive leadership and CRM administration" },
  { name: "Sales", description: "International trade & sales desks" },
  { name: "Operations", description: "Order fulfillment and processing" },
  { name: "Logistics", description: "Freight, shipping and cargo" },
];

async function seedSuperAdminOnly() {
  await connectDatabase();
  console.log("[Seed2] Connected to database. Setting up system roles, departments, and Superadmin...");

  // 1. Ensure system roles exist so permissions and role assignment work properly
  const roleDocs: Record<string, InstanceType<typeof Role>> = {};
  for (const [name, meta] of Object.entries(ROLE_META)) {
    const permissions =
      name === "SUPER_ADMIN" || name === "ADMIN"
        ? [...ALL_PERMISSION_CODES]
        : ROLE_PERMISSIONS[name] || [];

    const visibilityScope =
      name === "SUPER_ADMIN" || name === "ADMIN"
        ? "all"
        : name === "MANAGER"
          ? "department"
          : name === "OPERATIONS"
            ? "team"
            : "own";

    const role = await Role.findOneAndUpdate(
      { name },
      {
        name,
        displayName: meta.displayName,
        description: meta.description,
        permissions,
        isSystem: true,
        visibilityScope,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    roleDocs[name] = role!;
  }
  console.log("[Seed2] System roles initialized.");

  // 2. Ensure base departments exist
  const deptDocs: Record<string, InstanceType<typeof Department>> = {};
  for (const d of DEPARTMENTS) {
    const doc = await Department.findOneAndUpdate(
      { name: d.name },
      { ...d, status: "active" },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    deptDocs[d.name] = doc!;
  }
  console.log("[Seed2] Base departments initialized.");

  // 3. Super Admin credentials (from frontend/src/features/auth/LoginPage.tsx)
  const superAdminEmail = (process.env.SUPERADMIN_EMAIL || "superadmin@videhaoverseas.com").toLowerCase().trim();
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD || "admin123";
  const superAdminName = process.env.SUPERADMIN_NAME || "Super Admin";

  const passwordHash = await bcrypt.hash(superAdminPassword, 10);
  const superAdminRole = roleDocs["SUPER_ADMIN"];
  const managementDept = deptDocs["Management"];

  const superAdminUser = await User.findOneAndUpdate(
    { email: superAdminEmail },
    {
      name: superAdminName,
      email: superAdminEmail,
      passwordHash,
      roleId: superAdminRole._id,
      roleName: "SUPER_ADMIN",
      departmentId: managementDept?._id || null,
      status: "active",
      phone: "+91 98100 23456",
      designation: "Founder / Super Admin",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log(`[Seed2] Superadmin user provisioned: ${superAdminUser.email}`);
  console.log("\n========================================================");
  console.log("  SUPERADMIN CREDENTIALS (READY FOR CLIENT):");
  console.log(`  Email:    ${superAdminEmail}`);
  console.log(`  Password: ${superAdminPassword}`);
  console.log(`  Role:     Super Admin`);
  console.log("========================================================\n");

  await mongoose.disconnect();
  process.exit(0);
}

seedSuperAdminOnly().catch((err) => {
  console.error("[Seed2] Failed:", err);
  process.exit(1);
});
