import ru from "@/locales/ru.json";

export type Locale = "ru" | "sah";

const messages: Record<Locale, Record<string, unknown>> = {
  ru,
  sah: ru,
};

function get(obj: Record<string, unknown>, path: string): string {
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);

  return typeof value === "string" ? value : path;
}

export function t(
  path: string,
  options?: Locale | Record<string, string | number>,
  locale?: Locale
): string {
  let loc: Locale = "ru";
  let params: Record<string, string | number> | undefined;

  if (typeof options === "string") {
    loc = options;
  } else if (options) {
    params = options;
    if (locale) loc = locale;
  }

  const table = messages[loc] ?? messages.ru;
  let translated = get(table as Record<string, unknown>, path);
  if (translated === path) {
    translated = get(messages.ru as Record<string, unknown>, path);
  }

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      translated = translated.replaceAll(`{${key}}`, String(value));
    }
  }

  return translated;
}

export const defaultLocale: Locale = "ru";
