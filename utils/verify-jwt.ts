/* eslint-disable @typescript-eslint/no-unused-vars */
import { JwtPayload } from '@/types';
import { jwtVerify, decodeJwt, errors } from 'jose';

function toJwtPayload(payload: unknown): JwtPayload | null {
  const p = payload as Record<string, unknown>;
  if (
    p &&
    typeof p.username === 'string' &&
    typeof p.email === 'string' &&
    Array.isArray(p.roles) &&
    'tenantId' in p
  ) {
    return p as unknown as JwtPayload;
  }
  return null;
}

export async function verifyJWT(token: string, secret: string) {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return toJwtPayload(payload);
  } catch (e) {
    return null;
  }
}

/**
 * Verifier for edge UI-gating. Returns the claims plus whether the token is
 * merely expired. jose validates the signature before the exp claim, so a
 * JWTExpired error means the token is authentic but stale — we still return its
 * claims (with expired=true) so the middleware can let the navigation through
 * and the client-side interceptor can refresh the session. `payload` is null
 * only when the token is genuinely invalid (bad signature / malformed / wrong
 * shape), which should force a re-login.
 */
export async function verifyJWTForGate(
  token: string,
  secret: string,
): Promise<{ payload: JwtPayload | null; expired: boolean }> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return { payload: toJwtPayload(payload), expired: false };
  } catch (e) {
    if (e instanceof errors.JWTExpired) {
      try {
        return { payload: toJwtPayload(decodeJwt(token)), expired: true };
      } catch {
        return { payload: null, expired: false };
      }
    }
    return { payload: null, expired: false };
  }
}
