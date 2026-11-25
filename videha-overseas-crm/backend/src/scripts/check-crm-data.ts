import { connectDatabase } from "../db/connect";
import { Lead } from "../models/Lead";
import { FollowUp } from "../models/FollowUp";
import { Quotation } from "../models/Quotation";
import { Order } from "../models/Order";
import { Task } from "../models/Task";
import { User } from "../models/User";
import { Role } from "../models/Role";

async function checkData() {
  await connectDatabase();
  console.log("=== RECORD COUNTS ===");
  console.log("Leads total:", await Lead.countDocuments());
  console.log("FollowUps total:", await FollowUp.countDocuments());
  console.log("Quotations total:", await Quotation.countDocuments());
  console.log("Orders total:", await Order.countDocuments());
  console.log("Tasks total:", await Task.countDocuments());
  console.log("Users total:", await User.countDocuments());

  console.log("\n=== USERS ===");
  const users = await User.find().lean();
  for (const u of users) {
    const leads = await Lead.countDocuments({ assignedToId: u._id });
    const followups = await FollowUp.countDocuments({ assignedToId: u._id });
    const quotations = await Quotation.countDocuments({ assignedToId: u._id });
    const orders = await Order.countDocuments({ assignedToId: u._id });
    const tasks = await Task.countDocuments({ assignedToId: u._id });
    console.log(`${u._id} | ${u.email} | ${u.name} | ${u.roleName} | status: ${u.status} | leads: ${leads}, followups: ${followups}, quotes: ${quotations}, orders: ${orders}, tasks: ${tasks}`);
  }

  process.exit(0);
}

checkData().catch(console.error);
