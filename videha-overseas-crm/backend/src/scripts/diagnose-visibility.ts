import "dotenv/config";
import mongoose, { Types } from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Role } from "../models/Role";
import { Department } from "../models/Department";
import { Lead } from "../models/Lead";
import { Quotation } from "../models/Quotation";
import { FollowUp } from "../models/FollowUp";
import { Document } from "../models/Document";
import { buildAssigneeVisibilityFilter } from "../utils/visibility";
import { buildQuotationVisibilityFilter, buildDocumentVisibilityFilter } from "../utils/entityAccess";
import { resolveRolePermissions } from "../constants/permissions";
import type { AuthUser } from "../middleware/auth";
import * as leadsService from "../modules/leads/leads.service";

async function toActor(user: { _id: unknown; name: string; email: string; roleId: unknown; roleName: AuthUser["roleName"]; departmentId?: unknown | null }) {
  const role = await Role.findById(user.roleId).lean();
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    roleId: String(user.roleId),
    roleName: user.roleName,
    departmentId: user.departmentId ? String(user.departmentId) : null,
    permissions: resolveRolePermissions(user.roleName, role?.permissions),
  } satisfies AuthUser;
}

async function summarizeActor(label: string, actor: AuthUser) {
  const leadFilter = await buildAssigneeVisibilityFilter(actor, "assignedToId", "createdById");
  const quoteFilter = await buildQuotationVisibilityFilter(actor);
  const docFilter = await buildDocumentVisibilityFilter(actor);
  const [leads, quotes, followups, documents] = await Promise.all([
    Lead.countDocuments({ archived: { $ne: true }, ...leadFilter }),
    Quotation.countDocuments(quoteFilter),
    FollowUp.countDocuments(leadFilter),
    Document.countDocuments(docFilter),
  ]);
  const list = await leadsService.listLeads({ page: 1, limit: 5 }, actor);
  console.log(`\n${label}`);
  console.log("  actor:", { id: actor.id, roleName: actor.roleName, departmentId: actor.departmentId });
  console.log("  leadFilter:", JSON.stringify(leadFilter));
  console.log("  counts:", { leads, quotes, followups, documents, listTotal: list.total });
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);

  for (const email of [
    "manager@videhaoverseas.com",
    "rahul.sharma@videhaoverseas.com",
    "xyz@videha.com",
    "arpit@videha.com",
  ]) {
    const user = await User.findOne({ email }).lean();
    if (!user) continue;
    await summarizeActor(email, await toActor(user));
  }

  const salesRole = await Role.findOne({ name: "SALES_MEMBER" }).lean();
  const managerRole = await Role.findOne({ name: "MANAGER" }).lean();
  const salesDept = await Department.findOne({ name: "Sales" }).lean();
  if (!salesRole || !managerRole || !salesDept) throw new Error("Missing seed data");

  const stamp = Date.now();
  const salesEmail = `fresh-sales-${stamp}@test.local`;
  const managerEmail = `fresh-manager-${stamp}@test.local`;
  const passwordHash = await bcrypt.hash("test1234", 10);

  const freshSales = await User.create({
    name: "Fresh Sales",
    email: salesEmail,
    passwordHash,
    roleId: salesRole._id,
    roleName: "SALES_MEMBER",
    departmentId: salesDept._id,
    status: "active",
  });

  const freshManager = await User.create({
    name: "Fresh Manager",
    email: managerEmail,
    passwordHash,
    roleId: managerRole._id,
    roleName: "MANAGER",
    departmentId: salesDept._id,
    status: "active",
  });

  await summarizeActor("FRESH SALES (before assignment)", await toActor(freshSales.toObject()));
  await summarizeActor("FRESH MANAGER (before assignment)", await toActor(freshManager.toObject()));

  const rahul = await User.findOne({ email: "rahul.sharma@videhaoverseas.com" }).lean();
  const sampleLead = await Lead.findOne({ archived: { $ne: true }, assignedToId: rahul?._id }).lean();
  if (sampleLead) {
    await Lead.updateOne({ _id: sampleLead._id }, { $set: { assignedToId: freshSales._id } });
    await summarizeActor("FRESH SALES (after 1 lead assigned)", await toActor(freshSales.toObject()));

    await Lead.updateOne({ _id: sampleLead._id }, { $set: { assignedToId: freshManager._id } });
    await summarizeActor("FRESH MANAGER (after 1 lead assigned)", await toActor(freshManager.toObject()));

    if (rahul?._id) {
      await Lead.updateOne({ _id: sampleLead._id }, { $set: { assignedToId: rahul._id } });
    }
  }

  await User.deleteOne({ _id: freshSales._id });
  await User.deleteOne({ _id: freshManager._id });

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
