/** Full-screen task detail (no app chrome). */
export function isMobileTaskDetailPath(pathname: string) {
  return /^\/tasks\/[^/]+$/.test(pathname);
}

/** Full-screen in-app chat (no header / bottom nav). */
export function isMobileTaskChatPath(pathname: string) {
  return /^\/tasks\/[^/]+\/chat\/?$/.test(pathname);
}

/** Partner task chat — hide dashboard chrome. */
export function isPartnerTaskChatPath(pathname: string) {
  return /^\/partner\/tasks\/[^/]+\/chat\/?$/.test(pathname);
}
