import { Resend } from "resend";
import { Types } from "mongoose";
import { EmailReminderLog } from "../models/EmailReminderLog";
import { Task } from "../models/Task";
import { FollowUp } from "../models/FollowUp";
import { Lead } from "../models/Lead";
import { User } from "../models/User";

export interface ReminderEmailPayload {
  to: string;
  userName: string;
  itemType: "Task" | "Follow-up";
  title: string;
  leadOrCustomerName: string;
  dueDate: Date | string;
  entityId?: string;
}

export interface SentReminderEmailRecord {
  id: string;
  to: string;
  userName: string;
  itemType: "Task" | "Follow-up" | "OTP" | "General";
  title: string;
  leadOrCustomerName: string;
  dueDate: string;
  subject: string;
  text: string;
  html: string;
  sentAt: Date;
  entityId?: string;
}

// In-memory ledger of sent reminder & notification emails for instant querying and automated verification
const sentEmailLedger: SentReminderEmailRecord[] = [];

let resendClientInstance: Resend | null = null;

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }
  if (!resendClientInstance) {
    resendClientInstance = new Resend(apiKey.trim());
  }
  return resendClientInstance;
}

/** Check if a given date falls on today's calendar day (in local or UTC time) */
export function isDueToday(date: Date | string | number | null | undefined): boolean {
  if (!date) return false;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();

  // Local calendar day comparison
  const localMatch =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  // UTC calendar day comparison
  const utcMatch =
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate();

  return localMatch || utcMatch;
}

/** Formats a date into a clean professional string: e.g. "Nov 21, 2026" */
export function formatDueDate(date: Date | string | number): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Universal Resend email sender used across Videha Overseas CRM.
 */
export async function sendEmailViaResend(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
  itemType?: "Task" | "Follow-up" | "OTP" | "General";
  userName?: string;
  entityId?: string;
}): Promise<SentReminderEmailRecord> {
  const to = options.to.toLowerCase().trim();
  const from = options.from || process.env.RESEND_FROM || "Videha Overseas CRM <notifications@videhaoverseas.com>";
  const html = options.html || options.text.replace(/\n/g, "<br />");

  const record: SentReminderEmailRecord = {
    id: new Types.ObjectId().toString(),
    to,
    userName: options.userName || "User",
    itemType: options.itemType || "General",
    title: options.subject,
    leadOrCustomerName: "Videha Overseas CRM",
    dueDate: new Date().toISOString(),
    subject: options.subject,
    text: options.text,
    html,
    sentAt: new Date(),
    entityId: options.entityId,
  };

  sentEmailLedger.push(record);

  const client = getResendClient();
  if (client) {
    try {
      await client.emails.send({
        from,
        to,
        subject: options.subject,
        text: options.text,
        html,
      });
      console.log(`[Resend Email] Successfully dispatched to ${to} | Subject: "${options.subject}"`);
    } catch (err) {
      console.error(`[Resend Email] Delivery error to ${to}:`, err);
    }
  } else {
    console.log(`[Resend Email] (Simulated - no RESEND_API_KEY) Queued email for ${to}: "${options.subject}"`);
  }

  return record;
}

/**
 * Sends a reminder email following the strict Videha Overseas CRM professional template via Resend.
 */
export async function sendReminderEmail(payload: ReminderEmailPayload): Promise<SentReminderEmailRecord> {
  const { to, userName, itemType, title, leadOrCustomerName, dueDate, entityId } = payload;
  const formattedDueDate = formatDueDate(dueDate);
  const subject = `Reminder: Task/Follow-up Due Today – ${leadOrCustomerName}`;

  const text = [
    `Hello ${userName},`,
    "",
    `This is a reminder that the following ${itemType} is due today:`,
    "",
    `**Task/Follow-up:** ${title}`,
    `**Lead/Customer:** ${leadOrCustomerName}`,
    `**Due Date:** ${formattedDueDate}`,
    "",
    "Please review and complete the activity within the scheduled timeline.",
    "",
    "Regards,",
    "**Videha Overseas CRM**",
  ].join("\n");

  const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #182430; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E2DED2; border-radius: 8px;">
  <p>Hello ${userName},</p>
  <p>This is a reminder that the following ${itemType} is due today:</p>
  <table style="margin: 16px 0; border-collapse: collapse; width: 100%;">
    <tr><td style="padding: 6px 12px 6px 0; font-weight: bold; width: 160px;">Task/Follow-up:</td><td>${title}</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Lead/Customer:</td><td>${leadOrCustomerName}</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Due Date:</td><td>${formattedDueDate}</td></tr>
  </table>
  <p>Please review and complete the activity within the scheduled timeline.</p>
  <p style="margin-top: 24px;">Regards,<br /><strong>Videha Overseas CRM</strong></p>
</div>`;

  const record: SentReminderEmailRecord = {
    id: new Types.ObjectId().toString(),
    to: to.toLowerCase().trim(),
    userName,
    itemType,
    title,
    leadOrCustomerName,
    dueDate: formattedDueDate,
    subject,
    text,
    html,
    sentAt: new Date(),
    entityId,
  };

  sentEmailLedger.push(record);
  console.log(`[CRM Email Reminder via Resend] Sent to ${record.to} | Subject: "${subject}" | Due: ${formattedDueDate}`);

  // Resend dispatch
  const client = getResendClient();
  const fromAddress = process.env.RESEND_FROM || "Videha Overseas CRM <notifications@videhaoverseas.com>";
  if (client) {
    try {
      await client.emails.send({
        from: fromAddress,
        to: record.to,
        subject,
        text,
        html,
      });
      console.log(`[Resend Email] Successfully delivered reminder email to ${record.to}`);
    } catch (err) {
      console.error(`[Resend Email] Delivery error to ${record.to}:`, err);
    }
  } else {
    console.log(`[Resend Email] (Simulated - no RESEND_API_KEY) Reminder email queued for ${record.to}: "${subject}"`);
  }

  // Persist to MongoDB EmailReminderLog
  try {
    await EmailReminderLog.create({
      to: record.to,
      userName,
      itemType,
      title,
      leadOrCustomerName,
      dueDate: formattedDueDate,
      subject,
      text,
      html,
      entityId: entityId && Types.ObjectId.isValid(entityId) ? new Types.ObjectId(entityId) : undefined,
      sentAt: record.sentAt,
    });
  } catch (err) {
    console.warn("[CRM Email Reminder] Failed to persist email log to MongoDB:", err);
  }

  return record;
}

/**
 * Checks if a task is due today, resolves the assigned user's current login email,
 * and dispatches the reminder email via Resend.
 */
export async function sendTaskReminderIfDueToday(
  taskIdOrTask: string | any,
  explicitAssignee?: any,
): Promise<SentReminderEmailRecord | null> {
  let task = taskIdOrTask;
  if (typeof taskIdOrTask === "string" || !task.dueDate) {
    task = await Task.findById(taskIdOrTask).populate("relatedLeadId").populate("assignedToId");
  }
  if (!task || !task.dueDate || !isDueToday(task.dueDate)) {
    return null;
  }

  let assignee = explicitAssignee;
  if (!assignee || !assignee.email) {
    assignee = await User.findById(task.assignedToId);
  }
  if (!assignee || !assignee.email || assignee.status !== "active") {
    return null;
  }

  let leadOrCustomerName = "General / Direct";
  if (task.relatedLeadId) {
    const lead =
      typeof task.relatedLeadId === "object" && task.relatedLeadId.company !== undefined
        ? task.relatedLeadId
        : await Lead.findById(task.relatedLeadId).select("name company leadCode customerId");
    if (lead) {
      leadOrCustomerName = lead.company || lead.name || lead.leadCode || "Customer";
    }
  }

  return sendReminderEmail({
    to: assignee.email,
    userName: assignee.name,
    itemType: "Task",
    title: task.title,
    leadOrCustomerName,
    dueDate: task.dueDate,
    entityId: String(task._id),
  });
}

/**
 * Checks if a follow-up is due today, resolves the assigned user's current login email,
 * and dispatches the reminder email via Resend.
 */
export async function sendFollowUpReminderIfDueToday(
  followUpIdOrDoc: string | any,
  explicitAssignee?: any,
  explicitLead?: any,
): Promise<SentReminderEmailRecord | null> {
  let fu = followUpIdOrDoc;
  if (typeof followUpIdOrDoc === "string" || !fu.dueAt) {
    fu = await FollowUp.findById(followUpIdOrDoc).populate("leadId").populate("assignedToId");
  }
  if (!fu || !fu.dueAt || !isDueToday(fu.dueAt)) {
    return null;
  }

  let assignee = explicitAssignee;
  if (!assignee || !assignee.email) {
    assignee = await User.findById(fu.assignedToId);
  }
  if (!assignee || !assignee.email || assignee.status !== "active") {
    return null;
  }

  let lead = explicitLead;
  if (!lead || !lead.company) {
    lead =
      typeof fu.leadId === "object" && fu.leadId.company !== undefined
        ? fu.leadId
        : await Lead.findById(fu.leadId).select("name company leadCode");
  }
  const leadOrCustomerName = lead ? lead.company || lead.name || lead.leadCode || "Lead" : "Lead";
  const title = fu.type ? `${fu.type} Follow-up` : "Follow-up Touchpoint";

  return sendReminderEmail({
    to: assignee.email,
    userName: assignee.name,
    itemType: "Follow-up",
    title,
    leadOrCustomerName,
    dueDate: fu.dueAt,
    entityId: String(fu._id),
  });
}

/** Returns all sent reminder & notification emails recorded during execution */
export function getSentReminderEmails(): SentReminderEmailRecord[] {
  return [...sentEmailLedger];
}

/** Clears the in-memory sent email ledger (useful between test runs) */
export function clearSentReminderEmails(): void {
  sentEmailLedger.length = 0;
}

/** Finds the most recent sent email to a given recipient */
export function getLatestReminderEmailFor(email: string): SentReminderEmailRecord | undefined {
  const norm = email.toLowerCase().trim();
  for (let i = sentEmailLedger.length - 1; i >= 0; i--) {
    if (sentEmailLedger[i].to === norm) {
      return sentEmailLedger[i];
    }
  }
  return undefined;
}
