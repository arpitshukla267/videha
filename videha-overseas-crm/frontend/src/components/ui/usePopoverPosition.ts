import { useCallback, useEffect, useState, type RefObject } from "react";

export type PopoverCoords = {
  top: number;
  left: number;
  width: number;
  openUp: boolean;
};

/** Measure trigger and place a floating panel below (or above if near bottom). */
export function usePopoverPosition(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  panelHeightEstimate = 280,
) {
  const [coords, setCoords] = useState<PopoverCoords | null>(null);

  const update = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < panelHeightEstimate && rect.top > spaceBelow;
    setCoords({
      top: openUp ? rect.top - 6 : rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      openUp,
    });
  }, [triggerRef, panelHeightEstimate]);

  useEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, update]);

  return coords;
}
