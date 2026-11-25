import { Notification } from "../../models/Notification";
import { AppError } from "../../utils/AppError";
import { assertObjectId } from "../../utils/objectId";
import { serializeNotification } from "../../utils/serializers";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { checkFollowUpReminders } from "../../services/followupReminder.service";

export async function listMine(userId: string, query: { page?: unknown; limit?: unknown }) {
  // Check and generate any due or overdue follow-up reminders
  try {
    await checkFollowUpReminders();
  } catch (err) {
    console.error("Failed to check follow-up reminders:", err);
  }

  const { page, limit, skip } = parsePagination(query);
  const filter = { userId };

  const [total, docs] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  const items = docs.map((d) => serializeNotification(d as unknown as Record<string, unknown>));
  return paginatedResponse(items, total, page, limit);
}

export async function markRead(id: string, userId: string) {
  assertObjectId(id, "notification id");
  const notif = await Notification.findOne({ _id: id, userId });
  if (!notif) throw new AppError("Notification not found.", 404);
  notif.isRead = true;
  await notif.save();
  return true;
}

export async function markAllRead(userId: string) {
  await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
  return true;
}
