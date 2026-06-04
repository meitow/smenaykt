export const TASK_EMOJI_PRESETS = [
  "❄️",
  "🧹",
  "🌨️",
  "🏠",
  "🧊",
  "🪵",
  "📦",
  "🚚",
  "🔧",
  "💪",
  "🛒",
  "🐕",
  "🌿",
  "🚗",
  "🍳",
  "🪜",
  "💡",
  "🪣",
  "📋",
  "⏰",
] as const;

export function isSingleEmoji(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return [...trimmed].length === 1;
}

export function sanitizeEmoji(value: string, fallback = "📋"): string {
  const trimmed = value.trim();
  return isSingleEmoji(trimmed) ? trimmed : fallback;
}
