import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../models/User";
import { Role } from "../models/Role";
import * as leadsService from "../modules/leads/leads.service";
import * as quotationsService from "../modules/quotations/quotations.service";
import * as followupsService from "../modules/followups/followups.service";
import * as tasksService from "../modules/tasks/tasks.service";
import * as documentsService from "../modules/documents/documents.service";
import { resolveRolePermissions } from "../constants/permissions";
import type { AuthUser } from "../middleware/auth";

async function actorFromUser(email: string): Promise<AuthUser> {
  const user = await User.findOne({ email }).lean();
  if (!user) throw new Error(`User not found: ${email}`);
  const role = await Role.findById(user.roleId).lean();
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    roleId: String(user.roleId),
    roleName: (role?.name || user.roleName) as AuthUser["roleName"],
    departmentId: user.departmentId ? String(user.departmentId) : null,
    permissions: resolveRolePermissions(
      (role?.name || user.roleName) as string,
      role?.permissions,
    ),
  };
}

async function summarize(email: string) {
  const actor = await actorFromUser(email);
  const [leads, quotes, followups, tasks, documents] = await Promise.all([
    leadsService.listLeads({ page: 1, limit: 5 }, actor),
    quotationsService.listQuotations({ page: 1, limit: 5 }, actor),
    followupsService.listFollowUps({ page: 1, limit: 5 }, actor),
    tasksService.listTasks({ page: 1, limit: 5 }, actor.id),
    documentsService.listDocuments({ page: 1, limit: 5 }, actor),
  ]);

  console.log(`\n${email} (${actor.roleName})`);
  console.log("  permissions views:", actor.permissions.filter((p) => p.endsWith(".view")).join(", "));
  console.log("  leads total:", leads.total);
  console.log("  quotations total:", quotes.total);
  console.log("  followups total:", followups.total);
  console.log("  tasks total:", tasks.total);
  console.log("  documents total:", documents.total);
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  await summarize("rahul.sharma@videhaoverseas.com");
  await summarize("priya.patel@videhaoverseas.com");
  await summarize("xyz@videha.com");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
