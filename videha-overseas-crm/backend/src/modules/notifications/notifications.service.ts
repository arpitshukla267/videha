import { Notification } from "../../models/Notification";
import { AppError } from "../../utils/AppError";
import { assertObjectId } from "../../utils/objectId";
import { serializeNotification } from "../../utils/serializers";

export async function listMine(userId: string) {
  const docs = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(100);
  return docs.map((d) => serializeNotification(d.toObject() as unknown as Record<string, unknown>));
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
