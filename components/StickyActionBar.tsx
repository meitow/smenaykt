import type { ReactNode } from "react";

export function StickyActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-10 border-t border-line bg-surface/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur-md md:bottom-0">
      <div className="app-shell">{children}</div>
    </div>
  );
}
