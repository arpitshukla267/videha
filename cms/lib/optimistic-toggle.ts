import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

type ToggleItem = { _id: string; isActive?: boolean };

export async function optimisticToggle<T extends ToggleItem>(
  item: T,
  setItems: Dispatch<SetStateAction<T[]>>,
  apiToggle: (id: string) => Promise<T>,
  messages?: { on?: string; off?: string },
): Promise<void> {
  const previousActive = item.isActive ?? false;
  const nextActive = !previousActive;

  setItems((prev) =>
    prev.map((entry) => (entry._id === item._id ? { ...entry, isActive: nextActive } : entry)),
  );

  try {
    const updated = await apiToggle(item._id);
    setItems((prev) => prev.map((entry) => (entry._id === item._id ? updated : entry)));
    toast.success(nextActive ? messages?.on ?? "Shown on site" : messages?.off ?? "Hidden from site");
  } catch (error: unknown) {
    setItems((prev) =>
      prev.map((entry) =>
        entry._id === item._id ? { ...entry, isActive: previousActive } : entry,
      ),
    );
    toast.error(error instanceof Error ? error.message : "Toggle failed");
  }
}
