/** Max pay in rubles — fits Prisma Int / SQLite INTEGER. */
export const MAX_TASK_PAY = 1_000_000;

export function parseTaskPay(raw: unknown): number | null {
  const pay = Number(raw);
  if (!Number.isFinite(pay) || pay <= 0 || pay > MAX_TASK_PAY) {
    return null;
  }
  return Math.round(pay);
}

export function formatHourlyRate(pay: number, durationHours: number): string {
  if (durationHours <= 0) return "—";
  const rate = Math.round(pay / durationHours);
  return `${rate.toLocaleString("ru-RU")} ₽/час`;
}
