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
  SALES_CRM: {
    displayName: "Sales / CRM",
    description: "Manage client leads, customer accounts, quotations, follow-ups, and CRM operations.",
  },
  SALES_MARKETING_CMS: {
    displayName: "Sales / Marketing / CMS",
    description: "Sales, marketing inquiries, and CMS support (subject to final role approval).",
  },
};

const DEPARTMENTS = [
  { name: "Management", description: "Executive leadership and CRM administration" },
  { name: "Sales", description: "International trade & sales desks" },
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

  // 3. Super Admin & MD credentials
  const superAdminEmail = (process.env.SUPERADMIN_EMAIL || "superadmin@videhaoverseas.com").toLowerCase().trim();
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD || "admin123";
  const superAdminName = process.env.SUPERADMIN_NAME || "Super Admin";

  const passwordHash = await bcrypt.hash(superAdminPassword, 10);
  const salesHash = await bcrypt.hash("sales123", 10);
  const superAdminRole = roleDocs["SUPER_ADMIN"];
  const salesCrmRole = roleDocs["SALES_CRM"];
  const salesMarketingRole = roleDocs["SALES_MARKETING_CMS"];
  const managementDept = deptDocs["Management"];
  const salesDept = deptDocs["Sales"];

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

  // MD User
  const mdUser = await User.findOneAndUpdate(
    { email: "md@videhaoverseas.com" },
    {
      name: "Managing Director",
      email: "md@videhaoverseas.com",
      passwordHash,
      roleId: superAdminRole._id,
      roleName: "SUPER_ADMIN",
      departmentId: managementDept?._id || null,
      status: "active",
      phone: "+91 98100 23456",
      designation: "Managing Director / Super Admin",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  // Shilpa Shelar – Sales / CRM
  const shilpaUser = await User.findOneAndUpdate(
    { email: "shilpa.shelar@videhaoverseas.com" },
    {
      name: "Shilpa Shelar",
      email: "shilpa.shelar@videhaoverseas.com",
      passwordHash: salesHash,
      roleId: salesCrmRole._id,
      roleName: "SALES_CRM",
      departmentId: salesDept?._id || null,
      status: "active",
      phone: "+91 98200 11223",
      designation: "Sales / CRM",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  // Sejal Bidgar – Sales / Marketing / CMS
  const sejalUser = await User.findOneAndUpdate(
    { email: "sejal.bidgar@videhaoverseas.com" },
    {
      name: "Sejal Bidgar",
      email: "sejal.bidgar@videhaoverseas.com",
      passwordHash: salesHash,
      roleId: salesMarketingRole._id,
      roleName: "SALES_MARKETING_CMS",
      departmentId: salesDept?._id || null,
      status: "active",
      phone: "+91 98200 44556",
      designation: "Sales / Marketing / CMS (Subject to final role approval)",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log(`[Seed2] Superadmin user provisioned: ${superAdminUser.email}`);
  console.log(`[Seed2] MD user provisioned: ${mdUser.email}`);
  console.log(`[Seed2] Shilpa Shelar user provisioned: ${shilpaUser.email}`);
  console.log(`[Seed2] Sejal Bidgar user provisioned: ${sejalUser.email}`);
  console.log("\n========================================================");
  console.log("  TEAM CREDENTIALS (READY FOR CLIENT):");
  console.log("  1. Managing Director (Super Admin):");
  console.log("     Email: md@videhaoverseas.com | Pass: admin123");
  console.log("  2. Shilpa Shelar (Sales / CRM):");
  console.log("     Email: shilpa.shelar@videhaoverseas.com | Pass: sales123");
  console.log("  3. Sejal Bidgar (Sales / Marketing / CMS):");
  console.log("     Email: sejal.bidgar@videhaoverseas.com | Pass: sales123");
  console.log("  4. Super Admin (System):");
  console.log(`     Email: ${superAdminEmail} | Pass: ${superAdminPassword}`);
  console.log("========================================================\n");

  await mongoose.disconnect();
  process.exit(0);
}

seedSuperAdminOnly().catch((err) => {
  console.error("[Seed2] Failed:", err);
  process.exit(1);
});
