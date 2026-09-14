const NO_SQL_INJECTION = /\$where|__proto__|\$gt|\$ne/;

export const purify = (value: string): string =>
  value
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/\$/g, "")
    .trim();

export const hasNoSqlInjection = (...values: string[]): boolean =>
  values.some((value) => NO_SQL_INJECTION.test(value));

export const toSafeString = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);