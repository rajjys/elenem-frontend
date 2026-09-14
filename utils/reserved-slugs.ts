// Frontend copy of reserved tenant codes/slugs used to avoid proposing them client-side.
export const RESERVED_TENANT_CODES = new Set<string>([
  'WWW', 'API', 'APP', 'ADMIN', 'MEDIA', 'CDN', 'MAIL', 'STATIC', 'ASSETS', 'DOCS', 'BLOG', 'STATUS', 'SUPPORT', 'HELP', 'LOGIN', 'REGISTER', 'HEALTH'
]);

export const RESERVED_TENANT_SLUGS = new Set<string>([
  'www', 'api', 'app', 'admin', 'media', 'cdn', 'mail', 'static', 'assets', 'docs', 'blog', 'status', 'support', 'help', 'login', 'register', 'health'
]);

export function isReservedTenantCode(code?: string) {
  if (!code) return false;
  return RESERVED_TENANT_CODES.has(code.trim().toUpperCase());
}

export function isReservedTenantSlug(slug?: string) {
  if (!slug) return false;
  return RESERVED_TENANT_SLUGS.has(slug.trim().toLowerCase());
}
