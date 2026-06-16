import type { AppNavIcon } from "@/lib/app-nav";

export function NavTabIcon({ icon, active }: { icon: AppNavIcon; active: boolean }) {
  const color = active ? "text-brand" : "text-muted";

  if (icon === "tasks") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={color} aria-hidden>
        <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (icon === "post") {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        className={active ? "text-taiga" : "text-muted"}
        aria-hidden
      >
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (icon === "chats") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={color} aria-hidden>
        <path
          d="M5 18.5V7.8A2.8 2.8 0 0 1 7.8 5h8.4A2.8 2.8 0 0 1 19 7.8v5.4A2.8 2.8 0 0 1 16.2 16H9l-4 2.5z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={color} aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.5 19.5c0-3 3-5.5 6.5-5.5s6.5 2.5 6.5 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
