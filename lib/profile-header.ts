import { t } from "@/lib/i18n";

export function formatRuOrdersCount(count: number): string {
  const n = Math.max(0, Math.floor(count));
  const mod10 = n % 10;
  const mod100 = n % 100;
  let word: string;
  if (mod10 === 1 && mod100 !== 11) word = "заказ";
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) word = "заказа";
  else word = "заказов";
  return `${n} ${word}`;
}

export function formatProfileHeaderSubtitle(stats: {
  avgRating: number | null;
  completedTotal: number;
}): string {
  const orders = formatRuOrdersCount(stats.completedTotal);
  const rating =
    stats.avgRating !== null && !Number.isNaN(stats.avgRating)
      ? stats.avgRating.toFixed(1)
      : null;

  if (rating && stats.completedTotal > 0) {
    return t("home.headerStats", { rating, orders });
  }
  if (rating && stats.completedTotal === 0) {
    return t("home.headerStatsNoOrders", { rating });
  }
  if (!rating && stats.completedTotal > 0) {
    return t("home.headerStatsNoRating", { orders });
  }
  return t("home.headerStatsEmpty");
}
