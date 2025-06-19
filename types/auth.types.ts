// src/types/auth.types.ts
import { JWTPayload } from 'jose';
import { Role } from '../prisma'; // Assuming Role enum is in your prisma/index.ts

/**
 * Interface representing the custom claims within your JWT payload.
 * This extends the base JWTPayload from 'jose' with your application-specific data.
 * MUST accurately reflect what your backend puts into the JWT.
 */
export interface JwtPayload extends JWTPayload {
  sub: string; // User ID (User.id) - standard JWT claim, often maps to `id`
  username: string;
  email: string;
  roles: Role[]; // Array of roles
  tenantId: string | null; // Nullable tenant ID
  // Note: 'leagueId' from backend JwtPayload is typically not directly used for access control in JWT,
  // as managingLeagueId implies context. Keeping it out here for simplicity in middleware.
  // If your middleware explicitly needs `leagueId` for non-admin users, add it.
  managingLeagueId?: string | null; // Optional, for specific admin roles
  managingTeamId?: string | null; // Optional, for specific admin roles
  // 'iat' and 'exp' are already part of JWTPayload, so no need to redefine them here.
}
