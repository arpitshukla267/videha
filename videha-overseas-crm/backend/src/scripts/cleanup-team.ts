import bcrypt from "bcryptjs";
import { connectDatabase } from "../db/connect";
import { User } from "../models/User";
import { Role } from "../models/Role";
import { Lead } from "../models/Lead";
import { FollowUp } from "../models/FollowUp";
import { Quotation } from "../models/Quotation";
import { Task } from "../models/Task";
import { Department } from "../models/Department";
import { AssignmentConfig } from "../models/AssignmentConfig";
import { ALL_PERMISSION_CODES, ROLE_PERMISSIONS } from "../constants/permissions";

async function cleanupTeam() {
  await connectDatabase();
  console.log("=====================================================");
  console.log("   CLEANUP & RESTORE CRM TEAM & MEMBER DIRECTORY     ");
  console.log("=====================================================\n");

  const initialLeads = await Lead.countDocuments();
  const initialFollowUps = await FollowUp.countDocuments();
  const initialQuotes = await Quotation.countDocuments();
  const initialTasks = await Task.countDocuments();

  console.log(`[Safety Check] Current records before cleanup:`);
  console.log(`  Leads: ${initialLeads}`);
  console.log(`  Follow-ups: ${initialFollowUps}`);
  console.log(`  Quotations: ${initialQuotes}`);
  console.log(`  Tasks: ${initialTasks}\n`);

  // 1. Ensure Management & Sales departments exist
  const managementDept = await Department.findOneAndUpdate(
    { name: "Management" },
    { name: "Management", description: "Executive leadership and CRM administration", status: "active" },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const salesDept = await Department.findOneAndUpdate(
    { name: "Sales" },
    { name: "Sales", description: "International trade & sales desks", status: "active" },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  // 2. Ensure Roles: SUPER_ADMIN, SALES, SALES_MARKETING_CMS
  const superAdminRole = await Role.findOneAndUpdate(
    { name: "SUPER_ADMIN" },
    {
      name: "SUPER_ADMIN",
      displayName: "Super Admin",
      description: "Full administrative access across the entire Videha Overseas CRM system.",
      permissions: [...ALL_PERMISSION_CODES],
      isSystem: true,
      visibilityScope: "all",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const salesPermissions = ROLE_PERMISSIONS["SALES"] || ROLE_PERMISSIONS["SALES_CRM"] || [];
  const salesRole = await Role.findOneAndUpdate(
    { name: "SALES" },
    {
      name: "SALES",
      displayName: "Sales",
      description: "Sales and CRM representative managing leads, quotations, and customer follow-ups.",
      permissions: salesPermissions,
      isSystem: true,
      visibilityScope: "own",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const salesMarketingPermissions = ROLE_PERMISSIONS["SALES_MARKETING_CMS"] || [];
  const salesMarketingRole = await Role.findOneAndUpdate(
    { name: "SALES_MARKETING_CMS" },
    {
      name: "SALES_MARKETING_CMS",
      displayName: "Sales / Marketing / CMS",
      description: "Sales, marketing, and CMS operations.",
      permissions: salesMarketingPermissions,
      isSystem: true,
      visibilityScope: "own",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log("✓ Verified Roles: SUPER_ADMIN, SALES, SALES_MARKETING_CMS");

  // 3. Find the 3 actual user records
  const mdUser = await User.findOne({ email: "superadmin@videhaoverseas.com" });
  if (!mdUser) throw new Error("Could not find existing MD/Super Admin (superadmin@videhaoverseas.com)");

  const shilpaUser = await User.findOne({ email: "shilpasachin31@gmail.com" });
  if (!shilpaUser) throw new Error("Could not find Shilpa Shelar user (shilpasachin31@gmail.com)");

  const sejalUser = await User.findOne({ email: "sejalbidgar@gmail.com" });
  if (!sejalUser) throw new Error("Could not find Sejal Bidgar user (sejalbidgar@gmail.com)");

  // 4. Update the 3 actual users to correct roles, designations, departments, and reset passwords
  const adminHash = await bcrypt.hash("admin123", 10);
  const salesHash = await bcrypt.hash("sales123", 10);

  mdUser.roleId = superAdminRole._id;
  mdUser.roleName = "SUPER_ADMIN";
  mdUser.designation = "Managing Director / Super Admin";
  mdUser.departmentId = managementDept._id;
  mdUser.status = "active";
  mdUser.passwordHash = adminHash;
  await mdUser.save();
  console.log(`✓ 1. Managing Director: ${mdUser.name} (${mdUser.email}) -> Role: SUPER_ADMIN | Password: admin123`);

  shilpaUser.roleId = salesRole._id;
  shilpaUser.roleName = "SALES";
  shilpaUser.designation = "Sales / CRM";
  shilpaUser.departmentId = salesDept._id;
  shilpaUser.status = "active";
  shilpaUser.passwordHash = salesHash;
  await shilpaUser.save();
  console.log(`✓ 2. Shilpa Shelar: ${shilpaUser.name} (${shilpaUser.email}) -> Role: SALES | Password: sales123`);

  sejalUser.roleId = salesMarketingRole._id;
  sejalUser.roleName = "SALES_MARKETING_CMS";
  sejalUser.designation = "Sales / Marketing / CMS";
  sejalUser.departmentId = salesDept._id;
  sejalUser.status = "active";
  sejalUser.passwordHash = salesHash;
  await sejalUser.save();
  console.log(`✓ 3. Sejal Bidgar: ${sejalUser.name} (${sejalUser.email}) -> Role: SALES_MARKETING_CMS | Password: sales123`);

  // 5. Reassign any leads/tasks assigned to duplicate or test users to the real team
  const duplicateEmails = [
    "md@videhaoverseas.com",
    "shilpa.shelar@videhaoverseas.com",
    "sejal.bidgar@videhaoverseas.com",
    "sejaibidgar@gmail.com",
    "sales_rep_a@videha.example",
    "sales_rep_b@videha.example",
    "sales_rep_c@videha.example",
  ];

  const duplicateUsers = await User.find({ email: { $in: duplicateEmails } }).lean();
  console.log(`\n[Migration] Found ${duplicateUsers.length} duplicate/test users to clean up.`);

  for (const dup of duplicateUsers) {
    let targetId = shilpaUser._id;
    if (dup.email.includes("sejal")) {
      targetId = sejalUser._id;
    } else if (dup.email.includes("md")) {
      targetId = mdUser._id;
    } else if (dup.email.includes("sales_rep_a") || dup.email.includes("shilpa")) {
      targetId = shilpaUser._id;
    } else if (dup.email.includes("sales_rep_b")) {
      targetId = sejalUser._id;
    } else if (dup.email.includes("sales_rep_c")) {
      targetId = shilpaUser._id;
    }

    const reLead = await Lead.updateMany({ assignedToId: dup._id }, { $set: { assignedToId: targetId } });
    const reFollow = await FollowUp.updateMany({ assignedToId: dup._id }, { $set: { assignedToId: targetId } });
    const reQuote = await Quotation.updateMany({ assignedToId: dup._id }, { $set: { assignedToId: targetId } });
    const reTask = await Task.updateMany({ assignedToId: dup._id }, { $set: { assignedToId: targetId } });

    if (reLead.modifiedCount > 0) {
      console.log(`  Reassigned ${reLead.modifiedCount} lead(s) from ${dup.email} to ${targetId}`);
    }
  }

  // 6. Delete only duplicate/test users
  const deleteResult = await User.deleteMany({ email: { $in: duplicateEmails } });
  console.log(`✓ Removed ${deleteResult.deletedCount} duplicate/test user account(s).`);

  // 7. Clean up unused/incorrect role records created
  const removedRoles = await Role.deleteMany({
    name: { $in: ["BUYER_ACQUISITION_COORDINATOR", "SALES_CRM"] },
  });
  console.log(`✓ Removed ${removedRoles.deletedCount} obsolete role record(s).`);

  // 8. Update AssignmentConfig to point to Shilpa and Sejal
  await AssignmentConfig.updateMany(
    {},
    {
      $set: {
        enabled: true,
        defaultMode: "round_robin",
        roundRobinUserIds: [shilpaUser._id, sejalUser._id],
        roundRobinLastIndex: -1,
        countryRules: [],
        productRules: [],
        fallbackUserId: shilpaUser._id,
      },
    }
  );
  console.log("✓ Updated lead AssignmentConfig to round-robin between Shilpa and Sejal.");

  // 9. Verify Safety: All data intact
  const finalLeads = await Lead.countDocuments();
  const finalFollowUps = await FollowUp.countDocuments();
  const finalQuotes = await Quotation.countDocuments();
  const finalTasks = await Task.countDocuments();
  const activeUsers = await User.find({ status: "active" }).select("name email roleName").lean();

  console.log("\n=====================================================");
  console.log("   DATA PRESERVATION & FINAL DIRECTORY AUDIT         ");
  console.log("=====================================================");
  console.log(`  Leads: ${finalLeads} (Initial: ${initialLeads}) -> ${finalLeads === initialLeads ? "PERFECT 100% INTACT" : "MISMATCH"}`);
  console.log(`  Follow-ups: ${finalFollowUps} (Initial: ${initialFollowUps}) -> ${finalFollowUps === initialFollowUps ? "PERFECT 100% INTACT" : "MISMATCH"}`);
  console.log(`  Quotations: ${finalQuotes} (Initial: ${initialQuotes}) -> ${finalQuotes === initialQuotes ? "PERFECT 100% INTACT" : "MISMATCH"}`);
  console.log(`  Tasks: ${finalTasks} (Initial: ${initialTasks}) -> ${finalTasks === initialTasks ? "PERFECT 100% INTACT" : "MISMATCH"}`);

  console.log(`\n  Active Users in Directory (Total: ${activeUsers.length}):`);
  activeUsers.forEach((u, i) => {
    console.log(`    ${i + 1}. ${u.name} | ${u.email} | Role: ${u.roleName}`);
  });

  if (activeUsers.length !== 3) {
    throw new Error(`Expected exactly 3 active users, found ${activeUsers.length}`);
  }
  if (finalLeads !== initialLeads) {
    throw new Error(`Leads data affected! Expected ${initialLeads}, got ${finalLeads}`);
  }

  console.log("\n=====================================================");
  console.log("   TEAM DIRECTORY CLEANUP COMPLETED SUCCESSFULLY!    ");
  console.log("=====================================================\n");
  process.exit(0);
}

cleanupTeam().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
