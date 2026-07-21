import type { ZodTypeAny, infer as zInfer } from 'zod';

// Validate an API response against a Zod schema WITHOUT throwing on drift.
//
// The backend is the source of truth and already validates on write. When a
// hand-written frontend response schema drifts from the real payload (the
// recurring class of bug this project hit — country, player email, etc.), we
// must not white-screen the page with a ZodError. Instead: on the happy path
// the schema runs (including transforms like string->Date); on mismatch we log
// the drift in dev and fall back to the raw data so the UI still renders.
//
// Going forward, prefer typing responses from the generated OpenAPI contract
// (`ApiSchema<'SomeDto'>` in types/api-types) so drift fails at BUILD time.
export function parseResponse<S extends ZodTypeAny>(schema: S, data: unknown): zInfer<S> {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  if (process.env.NODE_ENV === 'development') {
    console.warn('[api] response schema drift (using raw data):', result.error.issues);
  }
  return data as zInfer<S>;
}
