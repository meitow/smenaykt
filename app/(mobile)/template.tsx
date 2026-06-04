"use client";

export default function MobileTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in min-h-full">{children}</div>;
}
