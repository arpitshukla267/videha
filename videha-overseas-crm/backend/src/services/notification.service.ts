import { Types, type ClientSession } from "mongoose";
import { Notification } from "../models/Notification";
import { AppError } from "../utils/AppError";

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: "task_assigned" | "lead_assigned" | "task_due" | "task_overdue" | "order_status" | "system";
  linkUrl?: string;
}

export async function createNotification(
  input: CreateNotificationInput,
  session?: ClientSession,
) {
  if (!Types.ObjectId.isValid(input.userId)) {
    throw new AppError("Invalid notification recipient", 400);
  }

  const docs = await Notification.create(
    [
      {
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type,
        linkUrl: input.linkUrl,
        isRead: false,
      },
    ],
    session ? { session } : undefined,
  );
  return docs[0];
}
