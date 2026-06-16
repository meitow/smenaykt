export const APP_NAV_TABS = [
  { href: "/", labelKey: "nav.tasks", icon: "tasks" },
  { href: "/chats", labelKey: "nav.chats", icon: "chats" },
  { href: "/post", labelKey: "nav.post", icon: "post" },
  { href: "/profile", labelKey: "nav.profile", icon: "profile" },
] as const;

export type AppNavIcon = (typeof APP_NAV_TABS)[number]["icon"];
