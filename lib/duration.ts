export const DURATION_HOURS_MIN = 1;
export const DURATION_HOURS_MAX = 12;

export const DURATION_HOUR_OPTIONS = Array.from(
  { length: DURATION_HOURS_MAX - DURATION_HOURS_MIN + 1 },
  (_, i) => i + DURATION_HOURS_MIN
);

export function clampDurationHours(hours: number): number {
  return Math.min(DURATION_HOURS_MAX, Math.max(DURATION_HOURS_MIN, Math.round(hours)));
}
