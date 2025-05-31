import { Role } from '@/prisma';
import jwt from 'jsonwebtoken';

export function verifyJWT(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default') 
    return decoded; // { sub, role, leagueId, exp }
  } catch (error) {
    if (error instanceof Error) {
      console.error('JWT Verification Error:', error.message);
    } else {
      console.error('JWT Verification Error:', error);
    }
    return null;
  }
}
