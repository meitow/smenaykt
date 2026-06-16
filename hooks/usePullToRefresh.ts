"use client";

import { useEffect, useRef, useState } from "react";

const PULL_THRESHOLD = 72;
const MAX_PULL = 120;

type UsePullToRefreshOptions = {
  onRefresh: () => void | Promise<void>;
  disabled?: boolean;
};

function isMobileTouchDevice() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 1023px)").matches && "ontouchstart" in window;
}

function isScrollAtTop() {
  const root = document.documentElement;
  return (window.scrollY || root.scrollTop || 0) <= 0;
}

export function usePullToRefresh({ onRefresh, disabled = false }: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(0);
  const trackingRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  useEffect(() => {
    if (disabled || !isMobileTouchDevice()) return;

    const onTouchStart = (event: TouchEvent) => {
      if (refreshingRef.current || !isScrollAtTop() || event.touches.length !== 1) return;
      startYRef.current = event.touches[0].clientY;
      trackingRef.current = true;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!trackingRef.current || refreshingRef.current) return;
      if (!isScrollAtTop()) {
        trackingRef.current = false;
        pullDistanceRef.current = 0;
        setPullDistance(0);
        return;
      }

      const delta = event.touches[0].clientY - startYRef.current;
      if (delta <= 0) {
        pullDistanceRef.current = 0;
        setPullDistance(0);
        return;
      }

      const next = Math.min(delta * 0.55, MAX_PULL);
      pullDistanceRef.current = next;
      setPullDistance(next);

      if (next > 8) {
        event.preventDefault();
      }
    };

    const finishTracking = async () => {
      if (!trackingRef.current) return;
      trackingRef.current = false;

      const shouldRefresh = pullDistanceRef.current >= PULL_THRESHOLD;
      pullDistanceRef.current = 0;
      setPullDistance(0);

      if (!shouldRefresh || refreshingRef.current) return;

      setRefreshing(true);
      try {
        await onRefreshRef.current();
      } finally {
        setRefreshing(false);
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", finishTracking);
    document.addEventListener("touchcancel", finishTracking);

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", finishTracking);
      document.removeEventListener("touchcancel", finishTracking);
    };
  }, [disabled]);

  const active = pullDistance > 0 || refreshing;
  const progress = refreshing ? 1 : Math.min(pullDistance / PULL_THRESHOLD, 1);

  return { pullDistance, refreshing, active, progress };
}
