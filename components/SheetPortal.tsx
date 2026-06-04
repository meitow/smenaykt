"use client";

import { createPortal } from "react-dom";
import { useEffect, useState, type ReactNode } from "react";

/** Renders modals on document.body so fixed positioning is not clipped by transformed ancestors. */
export function SheetPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}
