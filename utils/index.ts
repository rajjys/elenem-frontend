import { jwtVerify } from 'jose';

export async function verifyJWT(token: string, secret: string) {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload; // Contains exp, sub, role, etc.
  } catch (e) {
    return null;
  }
}