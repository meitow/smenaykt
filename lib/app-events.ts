export const PULL_REFRESH_EVENT = "smenaykt_pull_refresh";

export function dispatchPullRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PULL_REFRESH_EVENT));
}
