/** Full-screen task detail (no app chrome). */
export function isMobileTaskDetailPath(pathname: string) {
  return /^\/tasks\/[^/]+$/.test(pathname);
}

/** Full-screen in-app chat (no header / bottom nav). */
export function isMobileTaskChatPath(pathname: string) {
  return /^\/tasks\/[^/]+\/chat\/?$/.test(pathname);
}

/** Pages where pull-to-refresh reloads meaningful data (not create/post forms). */
export function isPullToRefreshPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/profile" ||
    pathname === "/chats" ||
    isMobileTaskChatPath(pathname)
  );
}

/** Partner task chat — hide dashboard chrome. */
export function isPartnerTaskChatPath(pathname: string) {
  return /^\/partner\/tasks\/[^/]+\/chat\/?$/.test(pathname);
}
