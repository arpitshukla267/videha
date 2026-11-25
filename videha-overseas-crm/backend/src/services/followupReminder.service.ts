import { Lead } from "../models/Lead";
import { FollowUp } from "../models/FollowUp";
import { Task } from "../models/Task";
import { Notification } from "../models/Notification";
import { EmailReminderLog } from "../models/EmailReminderLog";
import { createNotification } from "./notification.service";
import { sendTaskReminderIfDueToday, sendFollowUpReminderIfDueToday } from "./emailReminder.service";

/**
 * Checks for scheduled tasks and follow-ups due today (or overdue),
 * creates in-app notifications, and dispatches reminder emails to assigned users'
 * current login emails.
 *
 * Avoids spamming by ensuring at most one notification and email reminder
 * per user per task/follow-up per calendar day.
 */
export async function checkFollowUpReminders(): Promise<number> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  let createdCount = 0;

  try {
    // 1. Check Leads with nextFollowUp scheduled for today or overdue
    const closedStatuses = ["Converted", "Lost", "Not Interested", "Closed"];
    const dueLeads = await Lead.find({
      archived: { $ne: true },
      status: { $nin: closedStatuses },
      assignedToId: { $ne: null },
      nextFollowUp: { $ne: null, $lt: endOfDay },
    })
      .select("_id leadCode company name nextFollowUp assignedToId status")
      .lean();

    for (const lead of dueLeads) {
      if (!lead.nextFollowUp || !lead.assignedToId) continue;

      const followUpDate = new Date(lead.nextFollowUp);
      const isOverdue = followUpDate < startOfDay;
      const type = isOverdue ? "followup_overdue" : "followup_due";
      const linkUrl = `/leads/${String(lead._id)}`;

      const existing = await Notification.findOne({
        userId: lead.assignedToId,
        type: { $in: ["followup_due", "followup_overdue"] },
        linkUrl,
        createdAt: { $gte: startOfDay },
      });

      if (!existing) {
        const leadLabel = `${lead.company} (${lead.leadCode})`;
        const formattedDate = followUpDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        await createNotification({
          userId: String(lead.assignedToId),
          title: isOverdue ? "Follow-up Overdue" : "Follow-up Due Today",
          message: isOverdue
            ? `Follow-up with ${leadLabel} was scheduled for ${formattedDate} and is overdue.`
            : `Scheduled follow-up with ${leadLabel} is due today.`,
          type,
          linkUrl,
        });

        createdCount++;
      }
    }

    // 2. Check pending FollowUp documents scheduled for today or overdue
    const dueFollowUps = await FollowUp.find({
      status: "Pending",
      assignedToId: { $ne: null },
      dueAt: { $lt: endOfDay },
    })
      .populate({ path: "leadId", select: "leadCode company name" })
      .lean();

    for (const fu of dueFollowUps) {
      if (!fu.dueAt || !fu.assignedToId) continue;

      const dueDate = new Date(fu.dueAt);
      const isOverdue = dueDate < startOfDay;
      const type = isOverdue ? "followup_overdue" : "followup_due";
      const lead = fu.leadId as any;
      const linkUrl = lead?._id ? `/leads/${String(lead._id)}` : `/follow-ups`;

      const existingNotif = await Notification.findOne({
        userId: fu.assignedToId,
        type: { $in: ["followup_due", "followup_overdue"] },
        linkUrl,
        createdAt: { $gte: startOfDay },
      });

      if (!existingNotif) {
        const leadName = lead?.company || lead?.leadCode || "lead";
        const fuType = fu.type || "Call";

        await createNotification({
          userId: String(fu.assignedToId),
          title: isOverdue ? `${fuType} Follow-up Overdue` : `${fuType} Follow-up Due Today`,
          message: isOverdue
            ? `Your ${fuType.toLowerCase()} follow-up with ${leadName} is overdue.`
            : `Your ${fuType.toLowerCase()} follow-up with ${leadName} is scheduled for today.`,
          type,
          linkUrl,
        });

        createdCount++;
      }

      // If scheduled for today, send reminder email if not already sent today
      if (!isOverdue) {
        const emailSentToday = await EmailReminderLog.findOne({
          entityId: fu._id,
          itemType: "Follow-up",
          sentAt: { $gte: startOfDay },
        });
        if (!emailSentToday) {
          await sendFollowUpReminderIfDueToday(fu);
        }
      }
    }

    // 3. Check pending/in-progress Tasks due today
    const dueTasks = await Task.find({
      status: { $in: ["Pending", "In Progress"] },
      assignedToId: { $ne: null },
      dueDate: { $gte: startOfDay, $lt: endOfDay },
    })
      .populate({ path: "relatedLeadId", select: "leadCode company name" })
      .lean();

    for (const task of dueTasks) {
      if (!task.dueDate || !task.assignedToId) continue;
      const linkUrl = `/tasks/${String(task._id)}`;

      // In-app notification
      const existingNotif = await Notification.findOne({
        userId: task.assignedToId,
        type: { $in: ["task_due", "task_overdue"] },
        linkUrl,
        createdAt: { $gte: startOfDay },
      });

      if (!existingNotif) {
        await createNotification({
          userId: String(task.assignedToId),
          title: "Task Due Today",
          message: `Task "${task.title}" is due today.`,
          type: "task_due",
          linkUrl,
        });

        createdCount++;
      }

      // Email reminder
      const emailSentToday = await EmailReminderLog.findOne({
        entityId: task._id,
        itemType: "Task",
        sentAt: { $gte: startOfDay },
      });
      if (!emailSentToday) {
        await sendTaskReminderIfDueToday(task);
      }
    }
  } catch (err) {
    console.error("Error in checkFollowUpReminders:", err);
  }

  return createdCount;
}
