# ELENEM — Master Plan (Ground Zero → Stable Multi-Tenant SaaS)

> Created 2026-07-21. This is the foundation document. We work **one phase at a time**; each phase is
> independently fixable and testable, and ends with a **front↔back match check** before moving on.
> Status legend: `[ ]` not started · `[~]` in progress · `[x]` done & verified.

---

## Part A — Infrastructure from zero: what to subscribe to and in what order

You need exactly **three paid/hosted services** to make the system work. Nothing else is required
to get running.

| # | Service | What it hosts | Plan to get today | Est. cost |
|---|---------|---------------|-------------------|-----------|
| 1 | **Railway** | NestJS backend + PostgreSQL | Hobby plan ($5/mo incl. usage credit) | ~$5–15/mo |
| 2 | **Vercel** | Next.js frontend at `elenem.site` (already exists) | Hobby is fine to start; Pro ($20/mo) when you want team features/more | $0–20/mo |
| 3 | **AWS S3** | Media (logos, photos) | Pay-as-you-go, single bucket | ~$1–5/mo |

Optional but recommended soon (free tiers exist, not blockers): **Sentry** (error tracking),
**Resend or SES** (email — the current raw-SMTP mailer needs any SMTP credentials to work).

### A.1 Order of operations (Day 1)

**Step 1 — Local run first (verify the code before paying anything).**
1. Backend: `cd elenem-backend && npm install`. Create `.env` (see table A.2). You need a Postgres —
   either local (`brew install postgresql@16`) or skip straight to the Railway DB and point
   `DATABASE_URL` at it.
2. `npx prisma migrate deploy` (applies the 64 existing migrations), then `npm run start:dev`.
   Verify: `curl http://localhost:3333/auth/health` → OK, and Swagger at `http://localhost:3333/api`.
3. Frontend: `cd elenem-frontend && npm install`, create `.env.local` (table A.3), `npm run dev`.
   Verify: `http://localhost:3000` loads; register a user; log in.
4. Bootstrap admin: `POST /auth/register-first-admin` (no body). It creates the SYSTEM_ADMIN from
   `SYSTEM_EMAIL` / `SYSTEM_USERNAME` / `SYSTEM_PASSWORD` env vars. **It refuses to run when
   `NODE_ENV=production`** — so run it once right after the first deploy while `NODE_ENV` is unset,
   then set `NODE_ENV=production`. (Alternative: run it locally against the production
   `DATABASE_URL` once.)

**Step 2 — Railway (backend + database).**
1. New Railway project → add **PostgreSQL** service. Copy the *public* `DATABASE_URL`
   (Railway calls it `DATABASE_PUBLIC_URL`; the internal one only works service-to-service).
2. Add a service **from the GitHub repo** `elenem-backend`. Build: `npm run build`.
   Start: `npx prisma migrate deploy && npm run start:prod`. (Running migrate in the start command
   keeps schema in sync on every deploy.)
3. Set all env vars from table A.2 (use the **internal** `DATABASE_URL` for the app service).
4. Networking → Generate Domain → you get `something.up.railway.app`. This becomes
   `NEXT_PUBLIC_API_URL` for the frontend. (Later: put `api.elenem.site` as a custom domain on this
   service — cleaner and lets you tighten CORS.)
5. Verify: `curl https://<railway-domain>/auth/health`.

**Step 3 — Vercel (frontend).**
1. The project already exists and serves `elenem.site`. Re-link the repo if needed
   (`vercel link`), then set env vars from table A.3 and redeploy.
2. **DNS:** `elenem.site` → Vercel (already done), plus a **wildcard** `*.elenem.site` CNAME to
   Vercel and add `*.elenem.site` as a domain on the Vercel project — this is what makes the
   tenant subdomain sites (`myleague.elenem.site`) work; the middleware rewrite already exists.
3. Verify: `elenem.site` loads and login talks to the Railway API (watch the network tab).

**Step 4 — S3.**
1. One bucket, e.g. `elenem-sports-media-prod` (this exact name is already whitelisted in
   `next.config.ts` `images.domains` — reuse it if the old bucket still exists in `eu-west-3`).
2. IAM user with a policy scoped to that bucket only (`s3:PutObject`, `s3:GetObject`,
   `s3:DeleteObject`, `s3:ListBucket`). Save the access key into Railway env.
3. Bucket CORS: allow `PUT,GET` from `https://elenem.site`, `https://*.elenem.site`, and
   `http://localhost:3000` (presigned uploads go browser→S3 directly).
4. Verify: upload a tenant logo through the app.

### A.2 Backend env vars (complete — everything the code reads)

| Var | Required | Notes |
|-----|----------|-------|
| `DATABASE_URL` | ✅ | Railway internal URL in prod; public URL for local/tooling |
| `JWT_SECRET` | ✅ | Generate fresh (`openssl rand -base64 48`). The old committed dev secret is burned — rotate. |
| `JWT_REFRESH_SECRET` | ✅ | **Currently missing everywhere — refresh flow is broken without it.** Generate a second one. |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | opt | Defaults 1h / 7d |
| `PORT` | ✅ | Railway injects it; locally use 3333 (frontend dev hardcodes `localhost:3333`) |
| `NODE_ENV` | ✅ | `production` on Railway (after first-admin bootstrap) |
| `FRONTEND_URL` | ✅ | `https://elenem.site` — feeds CORS + email links |
| `SYSTEM_EMAIL` / `SYSTEM_USERNAME` / `SYSTEM_PASSWORD` | ✅ once | For `register-first-admin` bootstrap |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_USER` / `MAIL_PASS` / `MAIL_SECURE` | ✅ | Any SMTP (Resend/SES/Gmail-app-password to start). Without it, registration emails throw. |
| `AWS_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | ✅ | For S3 |
| `S3_BUCKET_NAME` / `S3_PUBLIC_BASE` | ✅ | `S3_PUBLIC_BASE` = `https://<bucket>.s3.<region>.amazonaws.com` |
| `S3_PRESIGNED_TTL` | opt | Default 300s |
| `LOGIN_LOCKOUT_DURATION_MS` | opt | Lockout window |

### A.3 Frontend env vars (Vercel + `.env.local`)

| Var | Required | Notes |
|-----|----------|-------|
| `NEXT_PUBLIC_API_URL` | ✅ | Railway backend URL (only used in prod builds; dev hardcodes localhost:3333) |
| `NEXT_PUBLIC_ROOT_DOMAIN` | ✅ | `elenem.site` — drives subdomain→tenant resolution |
| `JWT_SECRET` | ✅ | **Must equal the backend's** (middleware verifies tokens at the edge). If unset it falls back to the string `'your-secret'` = forgeable tokens. Phase 1 removes this shared-secret design (RS256); until then, set it. |
| `NEXT_PUBLIC_HOME_URL` / `NEXT_PUBLIC_HOME_URL_LOCAL` | opt | Cross-links from subdomain sites |
| `NEXT_PUBLIC_ADSENSE_ID` | opt | Ads |

**Definition of done for Part A:** register → verify-email link arrives → login → create tenant
(as system admin) → tenant subdomain page renders → upload a logo. When those five things work,
infrastructure is DONE and we never think about it again except via Phase 1 hardening.

---

## Part B (aside) — Connecting Claude to the database and S3

Short answer: **both are possible, and neither strictly needs MCP** because Claude Code has shell
access.

**Postgres (Railway):** Railway databases expose a public TCP proxy, so external connections work.
- *Simplest (recommended):* put the public `DATABASE_URL` in a local untracked file and Claude uses
  `psql` directly (`psql "$DATABASE_URL" -c '...'`). Full introspection, zero setup.
- *MCP option:* a Postgres MCP server (e.g. `npx @modelcontextprotocol/server-postgres <url>` or
  `postgres-mcp`) added via `claude mcp add`. Nice for read-only guardrails (create a read-only DB
  role for it), otherwise equivalent to psql.
- *Safety rule either way:* give Claude a **read-only role** for analysis; write access only during
  explicit migration/fix tasks.

**S3:** same story — `aws` CLI via shell (`aws s3 ls s3://bucket`, presign, cp) with the scoped IAM
key in the environment. S3 MCP servers exist but add nothing over the CLI here. Install
`awscli` locally and Claude can inspect/manage media directly.

**Railway itself:** Railway has a CLI (`railway logs`, `railway variables`, `railway up`) — worth
installing so deploys/logs are scriptable from this workspace too.

---

## Part C — Working method (applies to every phase)

Each phase follows the same loop, so progress is independently verifiable:

1. **Scope** — one module/feature only. No opportunistic fixes outside it (log them in
   `docs/BACKLOG.md` instead).
2. **Fix** — backend first, then frontend, then the contract between them.
3. **Match check** (the "simpler analysis" rerun) — for the module in scope:
   - every frontend API call has a real backend route (method + path + params);
   - frontend zod schemas/enums agree with backend DTOs/Prisma enums;
   - every list endpoint is paginated and tenant-scoped; every mutation validates scope;
   - errors surface as toasts; loading/empty states exist.
4. **Test** — exercise the flow end-to-end in the browser as each affected role
   (SYSTEM_ADMIN / TENANT_ADMIN / LEAGUE_ADMIN / TEAM_ADMIN / public visitor). Backend unit/e2e
   tests updated where they exist.
5. **Mark done** in this file, commit, deploy, move on.

Two cross-cutting rules adopted from Phase 2 onward:
- **No raw `axios` imports** — everything through `services/api.ts` (ESLint rule enforces it).
- **No new hand-written response types** — types come from the OpenAPI codegen (set up in Phase 2).

---

## Part D — The phased plan

### Phase 0 — Light the fires (infrastructure) `[ ]`
Everything in Part A. Exit criteria = the five-step "definition of done" above.

### Phase 1 — Security & correctness hotfixes (system-wide, before module work) `[x]` DONE
These are active defects; they block trusting anything else we test.
1. `[x]` **Games list scope leak** — security scope + user filters are now independent AND
   conditions in `listGamesScoped`. Verified with seeded data: DEMOKGL admin's `?tenantId=` /
   `?search=` spoofs return 0.
2. `[x]` **Unify password hashing on argon2** — `common/utils/password.util` (argon2 + legacy
   bcrypt verify + rehash-on-login). Verified: planted bcrypt hash logs in and migrates to
   argon2; change-password works (204).
3. `[x]` **Register the throttler** — `ThrottlerModule` (300/min global) + `ThrottlerGuard`;
   fixed the `ttl:60` (ms) bug to 60000 for a real 5/min on login. Verified 6th login → 429.
4. `[x]` **Secrets hygiene** — `JWT_REFRESH_SECRET` set; `'your-secret'` fallback removed (fail
   closed); `JWT_SECRET` rotated; `.env.example` in both repos; dependency-free `validateEnv`
   (no joi) hard-fails at boot on missing critical vars.
5. `[x]` **Contract fixes** — change-password → `PUT /users/me/password {currentPassword}`;
   backend accepts `accessToken` cookie; dead `/venues` call was already commented out.
6. `[x]` **GameStatus enum alignment** — frontend enum now mirrors the backend's 9 states
   (`LIVE` not `IN_PROGRESS`). NOTE: driving a game to LIVE still needs SCHEDULED→CONFIRMED→LIVE
   per the transition map — wiring that flow into the dashboard is a Phase 7 item.
7. `[x]` **Ops minimums** — `enableShutdownHooks()`; Prisma query logging off in prod; CORS
   rebuilt (env-driven root domain + subdomains + Vercel previews, anchored regexes); Sentry
   wired in both apps, dormant until a DSN is set.

**Match check:** login/refresh/logout/change-password as every role; attempt the cross-tenant
`?tenantId=` exploit and confirm 403/filtered.

**Also fixed in Phase 1 (surfaced by browsing seeded data):** 4× `@Transform` array-wrap bug
(tenants/leagues/users list 400s); two undecorated DTO fields breaking team + game creation;
tenant `ownerId` made optional; registration resilient to mail outage; several frontend Zod
drift fixes (tenant `country`, player `email`); tenant dashboard real counts; expired-token
re-login loop in middleware. See git log for detail.

### Phase 2 — Contract & data-layer foundation (makes every later phase cheaper) `[~]`
1. `[x]` **OpenAPI codegen** — fixed the duplicate `TenantResponseDto` and all dangling `$ref`s
   (leagues/teams/players `@ApiExtraModels`); added `openapi-typescript` + `npm run codegen` →
   `types/api.d.ts`, and `ApiSchema<'Dto'>` helper. Adopt incrementally in touched code.
2. `[~]` Introduce **React Query** + per-module service files. Infra done: `QueryProvider` in
   root layout; `services/tenants.ts` is the reference module (key factory + fetchers +
   `useTenants`/`useTenant`/`useCreate`/`useDelete`); `app/admin/tenants` converted off the
   useState/useEffect triad. Remaining modules adopt `services/<module>.ts` as they're worked.
3. `[x]` ESLint `no-restricted-imports` on `axios`; migrated the 20 files (18 only used
   `axios.isAxiosError` → now `isAxiosError` from `@/services/api`; 2 upload pages keep raw
   axios for S3 presigned-PUT/multipart with a documented eslint-disable). tsc clean.
4. `[ ]` Shared axios-error → toast normalizer; `loading.tsx` / `error.tsx` per route group.
5. `[ ]` Migrate hand-written response Zod schemas to derive from / validate against the generated
   types (kills the recurring runtime drift for good).

### Phase 3 — Auth & Users module `[ ]`
1. `[ ]` Password **reset flow**: `POST /auth/forgot-password` + `POST /auth/reset-password`
   (mailer method + token fields already exist), plus frontend pages.
2. `[ ]` Enforce email verification where it matters (or consciously decide not to).
3. `[ ]` Users admin UI: wire `PUT :id/promote`; audit-log user mutations.
4. `[ ]` Decision: move tokens out of localStorage → httpOnly cookies (backend sets them; the
   strategy already reads a cookie). Do it here while auth is in scope.

**Match check + role-matrix login test.**

### Phase 4 — Tenants module `[ ]`
Backend is solid; polish the admin flows, verify soft-delete behavior end-to-end, tenant
settings/theme editing (this is where the theming tokens from Phase 8 get their data), audit-log
tenant mutations. Exit: full tenant lifecycle create→edit→deactivate→delete as SYSTEM_ADMIN.

### Phase 5 — Leagues & Seasons `[ ]`
1. `[ ]` Wire the existing-but-unconsumed league membership endpoints (invite/assign/remove
   admins, settings) into the league dashboard.
2. `[ ]` Season lifecycle UI: create → activate → complete; surface the "one active season"
   rule clearly.
3. `[ ]` Fix `PermissionsService.getPrismaWhereForScope` for resources without `leagueId`
   scalar (currently emits invalid filters for LEAGUE_ADMIN on referees).

### Phase 6 — Teams, Players & Rosters (biggest UI build) `[ ]`
1. `[ ]` Players UI from scratch against the complete existing backend: list/create/edit,
   assign-to-team, player status. Replace the 11-line stub pages.
2. `[ ]` Team roster page (uses lineup/roster backend where applicable).
3. `[ ]` Decide coaches/referees: **register the modules + controllers** (they're dead code with
   passing tests) or delete them for now. Recommendation: enable referees minimally (needed for
   games), defer coaches.

### Phase 7 — Games core `[ ]`
1. `[ ]` Split `games.service.ts` (876 lines) into admin-crud / public-read / scheduling
   concerns. No behavior change — mechanical, verified by existing e2e tests.
2. `[ ]` Route `reportFinalScore` **through the state machine** (transition → COMPLETED with
   version check + audit) and make standings updates idempotent — recompute a team's
   `TeamSeasonStat` from games rather than blind `increment`, so corrections/reprocessing are safe.
3. `[ ]` Score-entry dashboard verified live (enum fix from Phase 1 unblocks it).
4. `[ ]` **Fixture generator v1**: simple round-robin for a season (every league needs this;
   creating fixtures one-by-one doesn't scale past ~6 teams).
5. `[ ]` Referee assignment to games (`GameReferee` model exists; small service + UI).

### Phase 8 — Realtime `[ ]`
1. `[ ]` Backend: inject the broadcaster into `GameResultsService` (emit on live-score and
   final-score); add JWT handshake auth + tenant check on `joinGame`; restrict gateway CORS.
2. `[ ]` Frontend: add `socket.io-client`; a `useLiveGame(gameId)` hook joining `game_${id}` and
   patching the React Query cache on `scoreUpdate` / `gameEvent` / `statusUpdate`.
3. `[ ]` Apply to: admin score dashboard, public game page, public standings (refetch on final).
4. `[ ]` Test with two browsers side-by-side (admin scoring, public watching).

### Phase 9 — Design system consolidation `[ ]`
1. `[ ]` Define the missing CSS tokens (`--secondary`, `--accent`, `--ring`, `--popover*`,
   `--card-foreground`, `--primary-foreground`, destructive/success) and wire into Tailwind.
2. `[ ]` Refactor Button/Badge/Input to token palette + `cva` + `cn` (kills hardcoded
   blue/indigo; makes tenant theming actually recolor the app).
3. `[ ]` Install `@radix-ui/react-dialog`; replace the mock `dialog.tsx`; delete dead `modal.tsx`;
   merge the three status-badge components.
4. `[ ]` One icon library (lucide); codemod admin's `react-icons/fi` and stray phosphor imports.
5. `[ ]` Consolidate `upload` vs `upload2` → keep `upload` (DB-tracked MediaAsset), port the
   proxy fallback into it, delete `upload2`.

### Phase 10 — Public sites, Posts & SEO `[ ]`
1. `[ ]` Fill the stub root-domain pages (`/leagues`, `/teams`, `/standings`, …) or remove them
   from nav; decide the relationship between `(public)` marketing and `public_tenant` sites.
2. `[ ]` `generateMetadata` on all public tenant pages (league, team, game, player, post);
   `sitemap.ts`, `robots.ts`, OG image.
3. `[ ]` Posts: re-enable `publishedAt` scheduled publishing; finish admin entry page.
4. `[ ]` One pricing page — kill either `/pricing` (sales-led) or `/plans` (self-serve tiers);
   they currently promise contradictory business models.

### Phase 11 — SaaS layer (monetization) `[ ]`
1. `[ ]` Stripe: products/prices mirroring `SubscriptionPlan`; checkout + customer portal +
   webhooks writing the `Subscription` row (which `FeatureGuard` already reads).
2. `[ ]` Quota enforcement service (teams/leagues/seasons/users per plan) + extend `FeatureGuard`
   beyond its single current use.
3. `[ ]` Self-serve onboarding: register → choose plan → auto-provision tenant + subscription.
4. `[ ]` Invite system (tokenized emails) for staff/players.
5. `[ ]` Transactional email upgrade (Resend/SES + templates: welcome, invite, receipts).

### Phase 12 — Domain ownership (custom domains) `[ ]`
1. `[ ]` Schema: `Tenant.customDomain`, `domainVerified`, `verificationToken`.
2. `[ ]` Verification endpoint (TXT/CNAME check) + Vercel Domains API attachment (certs auto).
3. `[ ]` `resolveTenantSlugFromHostname` → host-to-tenant lookup (cached) instead of only
   stripping the root domain; dynamic backend CORS from registered domains.

### Phase 13 — Observability & error tracking `[~]` (partially wired; deferred until functionality lands)
Do the depth here **after** the functional phases — dashboards are only useful once the
flows they watch exist. What's already in place vs. still to do:
1. `[x]` **Sentry wired in both apps, DSN-driven** — backend `instrument.ts` (+ profiling,
   structured logs, env-driven sample rates) and frontend `instrumentation*.ts`; dormant until
   `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` is set. Backend DSN is live locally.
2. `[ ]` **Source maps upload** — `@sentry/wizard -i sourcemaps` so production stack traces map
   to TypeScript, not compiled `dist/` JS. Needs `SENTRY_AUTH_TOKEN`; touches the build.
3. `[ ]` **Frontend Sentry project + DSN** — create the Next.js project in Sentry, set
   `NEXT_PUBLIC_SENTRY_DSN`.
4. `[ ]` **Review data scrubbing** — decide `dataCollection.userInfo` / `httpBodies` before real
   user data flows to Sentry (PII).
5. `[ ]` **Tune sample rates for prod** — traces/profiles are 1.0 in dev, 0.1 in prod; revisit
   against Sentry quota once traffic is real.
6. `[ ]` **Structured logging** — replace `console.log` with a JSON logger (pino/Nest Logger),
   request-id correlation; ship to Sentry logs or a log drain.
7. `[ ]` **Real health/readiness probes** — `@nestjs/terminus` with DB check (current
   `/auth/health` is a bare 200); wire Railway healthcheck to it.
8. `[ ]` **Release tracking + alerts** — tag Sentry releases on deploy; set alert rules
   (error-rate spikes, new-issue notifications) to Slack/email.
9. `[ ]` **Uptime + business metrics** — external uptime check; optional dashboards for
   signups/active tenants/games-per-day once the SaaS layer exists.

---

## Appendix — Known-defect index (from the 2026-07 five-agent audit)

Kept here so nothing gets lost; each item is owned by a phase above.

| Defect | Severity | Phase |
|---|---|---|
| Cross-tenant game listing via query params | Critical | 1 |
| argon2/bcrypt split (change-password broken; onboarded accounts can't log in) | Critical | 1 |
| Frontend `'your-secret'` JWT fallback | Critical | 1 |
| GameStatus enum mismatch (live dashboard dead) | Critical | 1 |
| Throttler decorators inert | High | 1 |
| `JWT_REFRESH_SECRET` unset | High | 1 |
| Tokens in localStorage / non-httpOnly cookie | High | 3 |
| Standings not idempotent; state-machine completion skips standings | High | 7 |
| `reportFinalScore` bypasses state machine | High | 7 |
| Realtime: no client transport; live-score path doesn't emit; gateway unauthenticated | High | 8 |
| Coaches/referees dead code (tests pass on unreachable services) | Medium | 6 |
| Players backend complete, zero UI | High | 6 |
| Password change route mismatch; `GET /venues` dead call | Medium | 1 |
| Password reset unreachable | Medium | 3 |
| Two upload systems | Medium | 9 |
| Zod↔DTO drift (tenantCode, country, sportType) | Medium | 2 |
| 20 files bypass shared axios client | Medium | 2 |
| Undefined shadcn tokens; hardcoded palette; mock dialog a11y | Medium | 9 |
| SEO absent (no generateMetadata/sitemap/robots) | High for launch | 10 |
| Subscription never written; FeatureGuard dead; no quotas | Blocker for revenue | 11 |
| No custom-domain model | Feature | 12 |
| PermissionsService bad filters for non-league resources | Medium | 5 |
| Prisma query logging in prod; no shutdown hooks; hardcoded CORS | Medium | 1 |
