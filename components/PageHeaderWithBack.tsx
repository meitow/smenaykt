"use client";

import { BackButton } from "@/components/BackButton";

type PageHeaderWithBackProps = {
  title: string;
  fallbackHref?: string;
};

export function PageHeaderWithBack({ title, fallbackHref = "/" }: PageHeaderWithBackProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-surface/90 backdrop-blur-md">
      <div className="h-0.5 w-full bg-brand-gradient" aria-hidden />
      <div className="app-shell flex items-center gap-3 px-4 py-3">
        <BackButton fallbackHref={fallbackHref} />
        <h1 className="min-w-0 flex-1 truncate text-[17px] font-bold text-ink">{title}</h1>
      </div>
    </header>
  );
}
