import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../models/User";
import { Lead } from "../models/Lead";
import { Quotation } from "../models/Quotation";
import { FollowUp } from "../models/FollowUp";
import { Task } from "../models/Task";
import { Role } from "../models/Role";
import { resolveRolePermissions } from "../constants/permissions";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const role = await Role.findOne({ name: "SALES_MEMBER" }).lean();
  console.log("Stored SALES_MEMBER perms:", role?.permissions);

  const sales = await User.find({ roleName: "SALES_MEMBER", status: "active" })
    .select("name email _id createdAt departmentId")
    .sort({ createdAt: 1 })
    .lean();

  for (const u of sales) {
    const id = u._id;
    const [leads, quotes, followups, tasksAssigned, tasksAll] = await Promise.all([
      Lead.countDocuments({
        archived: { $ne: true },
        $or: [{ assignedToId: id }, { createdById: id }],
      }),
      Quotation.countDocuments({ $or: [{ assignedToId: id }, { createdById: id }] }),
      FollowUp.countDocuments({ $or: [{ assignedToId: id }, { createdById: id }] }),
      Task.countDocuments({ assignedToId: id }),
      Task.countDocuments({}),
    ]);
    const resolved = resolveRolePermissions("SALES_MEMBER", role?.permissions);
    console.log(
      u.email,
      "| created",
      u.createdAt?.toISOString().slice(0, 10),
      "| dept",
      u.departmentId ?? "none",
      "| own leads/quotes/fu",
      leads,
      quotes,
      followups,
      "| tasks assigned/all",
      tasksAssigned,
      "/",
      tasksAll,
      "| nav views",
      resolved.filter((p) => p.endsWith(".view")).length,
    );
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
