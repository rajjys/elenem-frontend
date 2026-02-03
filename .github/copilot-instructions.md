# Copilot / AI Agent Guidance for elenem-frontend

This file captures essential, actionable knowledge for AI coding agents to be productive in this repo.

- **Stack & shape**: Next.js (app router, Next 15), TypeScript, TailwindCSS, Zustand for state, Axios for HTTP, Zod schemas.
- **Key dev commands**: `npm run dev` (Next dev with `--turbopack`), `npm run build`, `npm run start`, `npm run lint`.

- **Main entry points & layout**:
  - `app/` — app-router pages and route groups. Parenthesized folders like `(public)` and `(auth)` are route groups.
  - `app/layout.tsx` and sub-layouts under `app/(public)/layout.tsx` and `app/admin/layout.tsx` control global UI.

- **HTTP + auth patterns**:
  - Central HTTP client: `services/api.ts`. Use the exported `api` instance for backend calls. It sets `withCredentials: true` and uses
    `process.env.NEXT_PUBLIC_API_URL` in production; local dev defaults to `http://localhost:3333/`.
  - Token handling: `setAuthToken(token)` updates `api.defaults.headers.common.Authorization`.
  - Refresh flow: `api` has an interceptor that calls `/auth/refresh` and relies on `useAuthStore` to set tokens. Respect the `isRefreshing` queue logic when modifying.

- **Auth store conventions**:
  - `store/auth.store.ts` uses `zustand` + `persist` (storage key: `auth-storage`). Tokens are persisted to `localStorage` and also mirrored to cookies (`accessToken`).
  - Prefer `useAuthStore.getState()` for programmatic access when needed (e.g., inside non-react helpers), but avoid using it during SSR unless guarded.
  - User roles: rely on `user.roles` (array). Do NOT assume a single `userRole` cookie exists.

- **Schemas & types**:
  - Zod schemas live in `schemas/` and export typed values (e.g., `RegisterFormSchema`, `User`). Use these for validation and typing.

- **Conventions and idioms**:
  - Absolute imports use the `@/` alias (e.g., `@/services/api`). Follow existing import style.
  - Centralize network logic in `services/`. Add endpoint wrappers there rather than scattering axios calls.
  - Add domain entries for external images in `next.config.ts` when adding new remote image hosts.

- **When editing auth or api code**:
  - Update `services/api.ts` carefully — changing interceptor behavior affects global retry/refresh semantics.
  - If you add new token fields, also update `store/auth.store.ts` persist logic and cookie handling.

- **Examples**:
  - Use `api.get('/auth/me')` and `useAuthStore().fetchUser()` to refresh user data.
  - To issue authenticated requests in non-react code: `setAuthToken(token); await api.get('/some/protected')`.

- **Developer workflow notes**:
  - Local dev backend: many dev flows assume a backend at `http://localhost:3333/` (see `services/api.ts`). Set `NEXT_PUBLIC_API_URL` for production testing.
  - Run `npm run dev` to start the Next dev server (Turbopack enabled). Run `npm run lint` before PRs.

- **Files to inspect for context**: `services/api.ts`, `store/auth.store.ts`, `next.config.ts`, `app/(public)/page.tsx`, and `schemas/*`.

If any of these assumptions look wrong or you want more detail (examples, common fixes, or test commands), tell me which area to expand. 
