/** Ask the topbar to refetch the notification list immediately. */
export function refreshNotifications() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("crm:notifications-refresh"));
}

export type NotificationTarget = {
  tab: "leads" | "tasks" | "orders";
  entityId: string;
};

/** Parse `/leads/:id`, `/tasks/:id`, `/orders/:id` from notification linkUrl. */
export function parseNotificationLink(linkUrl?: string): NotificationTarget | null {
  if (!linkUrl) return null;
  const match = linkUrl.match(/^\/(leads|tasks|orders)\/([a-fA-F0-9]{24}|[\w-]+)/);
  if (!match) {
    if (linkUrl.includes("tasks")) return { tab: "tasks", entityId: "" };
    if (linkUrl.includes("leads")) return { tab: "leads", entityId: "" };
    if (linkUrl.includes("orders")) return { tab: "orders", entityId: "" };
    return null;
  }
  return { tab: match[1] as NotificationTarget["tab"], entityId: match[2] };
}
