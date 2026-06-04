import type { ReactNode } from "react";

export function StickyActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-10 border-t border-line bg-surface px-4 py-3">
      <div className="mx-auto max-w-lg">{children}</div>
    </div>
  );
}
