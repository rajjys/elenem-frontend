/* eslint-disable @typescript-eslint/no-explicit-any */
export function sanitizeEmptyStrings<T extends Record<string, any>>(data: T): T {
  const cleaned: Record<string, any> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim() === '') {
      cleaned[key] = undefined; // Set empty strings to undefined to match optional Zod schemas
    } else {
      cleaned[key] = value;
    }
  });

  return cleaned as T;
}