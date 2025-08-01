/* eslint-disable @typescript-eslint/no-unused-vars */
import { JwtPayload } from '@/types';
import { jwtVerify } from 'jose';

export async function verifyJWT(token: string, secret: string) {
  console.log("Secret: ",secret);
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    //return payload; // Contains exp, sub, role, etc.
    if (
        typeof payload.username === "string" &&
        typeof payload.email === "string" &&
        Array.isArray(payload.roles) && "tenantId" in payload) {
            return payload as JwtPayload;
      }
      else 
        return null;
      } catch (e) {
          return null;
      }
}