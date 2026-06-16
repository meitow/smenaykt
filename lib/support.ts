export const SUPPORT_TELEGRAM_URL =
  process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM ?? "https://t.me/smenaykt";
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@smenaykt.ru";

export function supportMailtoUrl(subject = "SmenaYKT — вопрос из профиля") {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
