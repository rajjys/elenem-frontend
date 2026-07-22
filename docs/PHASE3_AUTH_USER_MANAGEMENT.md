# Phase 3 — Auth & User Management: Deep Analysis & Plan

> Created 2026-07-21. Companion to `MASTER_PLAN.md` Phase 3. Written to be readable by
> anyone on the team. Goal: a **stable, easy-to-use** auth + user-management system.
> No over-engineering — we want something that works, not the next Microsoft.

---

## 0. TL;DR

The **auth core is genuinely solid** (login, refresh with rotation + hijack detection, argon2,
lockout, throttling — all working and hardened in Phase 1). What's missing is the **user-facing
management layer**: there's no way to recover a forgotten password, no working invite flow, no
UI to create/edit users or assign roles, and several account pages are empty. Plus a handful of
**latent bugs** the audit found (a guard-wiring mistake, duplicate DB fields, broken invites).

This phase makes user management **exist and be usable**, and answers your specific questions on
email verification, OTP, cookie storage, social login, and password reuse.

---

## 1. How the user model works today (plain English)

- **One `User` table for everyone.** A person is a single user account. What they can do is
  decided by their **roles** (an array) and their **scope** (which tenant/league/team they belong
  to or manage).
- **Roles** (`Role` enum): `SYSTEM_ADMIN` (runs the whole platform), `TENANT_ADMIN` (runs one
  organization), `LEAGUE_ADMIN`, `TEAM_ADMIN`, `PLAYER`, `COACH`, `REFEREE`, `GENERAL_USER`
  (a signed-up person with no special powers yet). A user can hold several roles at once
  (e.g. `[GENERAL_USER, TENANT_ADMIN]`).
- **Scope fields on the user**: `tenantId` (which org they belong to), `managingLeagueId`,
  `managingTeamId` (what they run). Permissions = "your role" × "your scope". A `TENANT_ADMIN`
  can only touch data where `tenantId` matches theirs.
- **The permission engine** (`PermissionsService`) already encodes this well: it knows who can
  see/edit what, and `canAssignRole` stops a tenant admin from minting a system admin. But it's
  currently only wired into the **users** module — most other modules use simpler role guards.
- **"Followers" do not exist yet.** The roles enum has no `FOLLOWER`. If fans following a
  team/league is a goal, that's a new concept to add (a lightweight join table, not a role).

**Two ways a user gets created today:**
1. **Self-register** (`/register` → `POST /auth/register`) — anyone signs up, gets
   `[GENERAL_USER]`, no tenant. This works.
2. **Admin-create** (`POST /users`) — an admin creates a user and **sets their password
   directly**. The backend endpoint works, but **there is no frontend page for it** (the form
   component `user-form.tsx` exists but nothing renders it), and it always assigns
   `[GENERAL_USER]` (admin can't pick a role at creation).

---

## 2. What works / what's broken / what's missing (from the 2026-07 audit)

### ✅ Works (backend)
- Register, login (tenant-scoped **and** platform/system-admin split), refresh-token rotation
  with reuse/"hijack" detection, logout, email verification endpoint, first-admin bootstrap.
- argon2 hashing unified, with transparent bcrypt-legacy verify + rehash-on-login.
- Separate `JWT_SECRET` / `JWT_REFRESH_SECRET`; throttling on login/register; account lockout
  after 5 failed attempts.
- Full admin user **CRUD** endpoints with the hierarchical permission engine, privilege-
  escalation protection, last-system-admin protection, and soft-delete with anonymization.

### 🔴 Dead / stubbed (exists but does nothing)
- **Password reset**: `sendPasswordResetEmail` + `passwordResetToken/Expires` DB fields exist but
  have **zero callers**. No forgot/reset endpoint. A user who forgets their password is stuck.
- **PasswordHistory** (reuse prevention): model exists, referenced **nowhere** in code. Reuse is
  not prevented. `lastPasswordChange` is never updated.
- **League/player invites**: creating a league admin or player for a **new** email generates a
  random temp password but **sends no email and no token** → that invited person can never log
  in. Player invite is an explicit `// TODO`.
- **`emailVerified`** field: written once by the invite, never read (the app uses `isVerified`).
- **`mfaSecret`** field: exists, no MFA logic anywhere.

### 🔴 Stubbed (frontend — empty pages)
- `account/profile` (11-line stub), `account/settings` (**missing file**, but linked from nav →
  404), `admin/roles`, `admin/users/permissions`, `admin/settings`, `league/users`.
- `admin/users/create`, `admin/users/[id]` (edit), `admin/users/[id]/roles` — **missing files**;
  the "Create New User" / "View/Edit" / "Manage Roles" buttons all 404.
- No forgot-password page, no reset-password page, no verify-email landing page, no "Forgot
  password?" link on login.
- `admin/dashboard` renders rich UI but on **100% hardcoded mock data** with inert buttons.

### 🟡 Partial
- `account/security` works (ChangePasswordForm, which we fixed in Phase 1) but swallows the
  backend error message (always says "Failed to change password"), no strength meter/show-hide.
- `account/dashboard` is real and role-aware (CTA cards) but thin — no profile summary, roles
  display, or activity.
- `admin/users` list is **fully working** (filter/paginate/sort/delete). Only the row actions
  beyond delete are dead (they point at missing pages).

### Notable existing assets to reuse (don't rebuild)
- `components/forms/user-form.tsx` — a complete create/edit user form, just **orphaned**. Wiring
  it into `admin/users/create` and `admin/users/[id]` is the single highest-leverage fix.

---

## 3. Critical bugs the audit found (fix these regardless)

1. **Global guards aren't actually global.** `auth.module.ts` registers `JwtAuthGuard`/`RolesGuard`
   with the **string** `'APP_GUARD'` instead of the `APP_GUARD` token from `@nestjs/core`. So they
   only apply where a controller explicitly adds `@UseGuards(...)`. Any route that forgets it is
   **unauthenticated**. This is a real latent security hole — fix first.
2. **Duplicate/contradictory DB fields**: `isVerified` (used) vs `emailVerified` (dead);
   `lastLoginAt` (returned to the UI) vs `lastLogin` (what login actually writes) → the
   "last login" shown to users is **always empty**. Pick one of each, migrate, delete the other.
3. **`generateTokens` reads non-existent fields** (`user.teamManagingId`, `user.leagueId`) → those
   JWT claims are always `undefined`. Rename to the real fields.
4. **Broken invite** (see §2) — new invited users can't log in.

---

## 4. The build plan (ordered, non-over-engineered)

Each step is independently shippable and testable with the seeded demo data.

### 4A. Backend (do first — the UI needs these)
1. **Fix the global-guard wiring bug** (§3.1). One-line correctness/security win.
2. **Forgot/reset password** — `POST /auth/forgot-password` (issue token, email it, **always
   return 200** so you can't probe which emails exist) + `POST /auth/reset-password` (consume
   token, set new hash, clear `hashedRt` to log out other sessions). The DB fields + mail method
   already exist. **Use an OTP code, not a link** (see §6) — simpler locally and better UX.
3. **Password change hygiene** — on change/reset: update `lastPasswordChange`, revoke `hashedRt`,
   and record + check `PasswordHistory` to block reusing the last N passwords (§7).
4. **Real invite flow** — replace temp-password-with-no-delivery with a tokenized "set your
   password" email (reuse the verification-token pattern). Fixes league-admin and player
   onboarding. Admin-created users get the same set-password email instead of an out-of-band
   password.
5. **Reconcile duplicate fields** (§3.2, §3.3).
6. **Resend-verification endpoint** (throttled) + decide the verification policy (§6).
7. **Let admin-create pick roles** (currently hardcoded to GENERAL_USER), gated by `canAssignRole`.

### 4B. Frontend (build the management layer)
1. **A shared `useCurrentUser()` / `useHasRole()` hook** (`hooks/useAuth.ts` is currently an empty
   file). Removes the duplicated `roles?.includes(...)` logic everywhere. Do this first.
2. **Wire the orphaned `UserForm`** → `admin/users/create` and `admin/users/[id]` (edit). Kills
   the 404s and gives real admin user creation.
3. **Role assignment page** → `admin/users/[id]/roles` (the "Manage Roles" target).
4. **Account pages**: implement `account/profile` (reuse `UserForm` in self mode against
   `/users/me`), create `account/settings`, improve `account/security` (surface backend errors,
   add show/hide + strength hint).
5. **Forgot/reset password pages** + a "Forgot password?" link on login; **verify-email landing**
   + resend button.
6. **`admin/roles`** — a readable roles↔permissions reference screen (start read-only: show what
   each role can do; editing permissions is a later, optional step).
7. **Per-scope member management** (tenant/league/team → admins/users): start with the league
   admins list (the backend endpoints already exist), generalize later. Followers only if we
   decide to add the concept.
8. Follow the Phase-2 pattern for all of the above: `services/users.ts` (React Query hooks),
   generated types, `parseResponse`, `toastApiError`, standard loading/error.

### Migrations (Prisma)
- `passwordHash` → **nullable** (needed later for OAuth-only accounts; harmless now).
- Add `provider` / `providerId` columns + unique index (for future social login; §8).
- Drop or consolidate `emailVerified` / `lastLogin` after reconciling (§3.2).

---

## 5. Local email — how to actually send verification/reset mail with no deploy

You've never done email before, so here's the whole picture.

**How email sending works:** your backend doesn't send mail itself — it hands the message to an
**SMTP server** (a mail-relay service) which delivers it. You need SMTP credentials
(host/port/user/pass). The code already uses `nodemailer` with `MAIL_HOST/PORT/USER/PASS` env
vars — it just needs real credentials.

**Free options (pick one):**
| Option | Cost | Best for | Notes |
|---|---|---|---|
| **Resend** | Free 3k/mo | Recommended | Modern, 5-min setup, great deliverability, nice dashboard. Has SMTP + an API. |
| **Brevo (Sendinblue)** | Free 300/day | Alternative | Generous free SMTP. |
| **Gmail app password** | Free | Quick hack | Works via SMTP with an "app password"; fine for dev, not for real sending. |
| **Mailtrap / Ethereal** | Free | Pure local testing | Emails are **captured in a fake inbox**, never actually delivered. Perfect while developing — you see the email in their web UI. |

**Recommendation for right now (local, no deploy):** use **Mailtrap** (or nodemailer's Ethereal)
so you can *see* verification/reset emails in a web inbox without real delivery, then switch the
same `MAIL_*` env vars to **Resend** when you deploy. Zero code change — only env vars.

**The "dynamic link" question — you're exactly right to ask.** The email currently builds
`${FRONTEND_URL}/verify-email?token=...`. So the link points at whatever `FRONTEND_URL` is set to:
- Local: `FRONTEND_URL=http://localhost:3000` (or `http://lvh.me:3000`).
- Prod: `FRONTEND_URL=https://elenem.site`.

Set it per-environment and the links "just work". **But** — if we switch to **OTP codes instead of
links** (§6), this problem largely disappears: the email contains a 6-digit code, the user types it
into whatever site they're on, and there's no host/domain to get wrong. That's simpler and why I
recommend OTP for both verification and reset locally.

---

## 6. Verification & forgot-password: OTP vs link

**Link approach** (current): email contains a URL with a long token; clicking it hits a page that
sends the token to the backend. Downsides: depends on the right `FRONTEND_URL`, breaks across
dev/prod hosts, links can be mangled by email clients, and needs a landing page.

**OTP approach** (recommended): email contains a **6-digit code** valid for ~10 minutes. The user
types it into a form. Advantages: host-independent (great for local dev on lvh.me), no landing
page needed, familiar UX, works identically for **email verification, password reset, and (later)
2FA**.

**Plan:** one small `OtpCode` mechanism (or reuse the existing token fields storing a short code +
expiry) used for both **verify email** and **forgot password**:
- Forgot password: user enters email → backend emails a 6-digit code (always responds 200) →
  user enters code + new password → backend verifies code, checks password history, sets new hash,
  revokes sessions.
- Verify email: same code pattern, or keep the link — but OTP is the cleaner single mechanism.

Keep it simple: rate-limit the request endpoint (throttler), expire codes fast, single-use.

---

## 7. Password reuse prevention (you asked for this explicitly)

The `PasswordHistory` table exists but is unused. The plan:
- On **register / change / reset**, after hashing the new password, write a row to
  `PasswordHistory` (the argon2 hash + timestamp + userId).
- Before accepting a new password, argon2-verify it against the **last N** history rows (N=3–5).
  If it matches any, reject with "You can't reuse a recent password."
- Also update `lastPasswordChange` and revoke `hashedRt` (logs out other sessions) on change.

Low effort (the table's already there), directly satisfies your requirement, not over-engineered.

---

## 8. Session storage — localStorage vs httpOnly cookies (the lecture you asked for)

**What they are:**
- **localStorage**: a browser key-value store that **JavaScript on the page can read**. Our app
  currently keeps the access + refresh tokens here (via zustand persist).
- **httpOnly cookie**: a cookie the browser stores and **automatically sends to the server**, but
  which **JavaScript cannot read** (the `httpOnly` flag hides it from `document.cookie`).

**Why httpOnly is safer (and yes, it's the recommended default):**
- The main threat is **XSS** (cross-site scripting) — if any malicious script runs on your page
  (a bad dependency, an injected ad, a compromised script), it can read `localStorage` and **steal
  your tokens**, including the 7-day refresh token → full account takeover.
- An **httpOnly** cookie is invisible to JavaScript, so even a successful XSS **can't read the
  token**. That's the whole point.

**The trade-offs (why it's not free):**
| | localStorage | httpOnly cookie |
|---|---|---|
| XSS can steal token | **Yes (bad)** | No |
| JS can read token | Yes | No |
| Sent automatically to API | No (you add the header) | Yes (browser attaches it) |
| CSRF risk | No | **Yes** — needs mitigation (SameSite=Lax/Strict + CSRF token on state-changing requests) |
| Cross-domain (api.elenem.site ↔ elenem.site) | Easy | Needs careful cookie domain/SameSite config |

**Our current setup is a hybrid mess worth cleaning up:** tokens live in localStorage **and** a
**non-httpOnly** `accessToken` cookie (readable by JS, so no better than localStorage) that the
middleware reads. Both are XSS-exposed.

**Recommendation (a later hardening step, not urgent for local stability):** move to the backend
setting **httpOnly, Secure, SameSite=Lax cookies** for both tokens; the middleware and API read
the cookie; add a CSRF token for mutations. The backend's JWT strategy already reads a cookie, so
the plumbing is half there. It's a real change (touches login/refresh/logout + CSRF), so we
schedule it deliberately — but the direction is: **httpOnly cookies, yes.** Noted in the plan.

---

## 9. Social login (Gmail/Facebook/Apple) — are we ready? (you asked)

**Short answer: not ready today, but it's a clean additive change — plan it for later, don't build
it now.** Here's how it works and what to prepare.

**How OAuth "Sign in with Google" works, simply:**
1. User clicks "Continue with Google". We redirect them to Google.
2. Google authenticates them and redirects back to our **callback URL** with a code.
3. Our backend exchanges the code for the user's Google profile (email, name, a stable
   `providerId`).
4. We **find-or-create** a user by that email/provider and issue our own JWT — from then on it's
   the same session as any other user.

**What blocks it in our code today:**
- **`passwordHash` is required (NOT NULL).** An OAuth-only user has no password. → make it
  nullable.
- **No `provider` / `providerId` fields** on the User model (to remember "this is a Google account
  with Google-ID X"). → add them + a unique index.
- **No account-linking logic** (what if someone registered with email+password, then later signs
  in with the same Google email? You link them). → decide the policy.
- **No OAuth strategy/callback** (we only have JWT + local). → add `passport-google-oauth20` etc.
  and a callback controller.

**Is our system "ready"?** The architecture is friendly to it — auth already ends in "issue our own
JWT", so social login just adds new *entry points* that converge on the same session. Nothing needs
to be re-architected. But it's **not something to bolt on now**; it's a focused feature.

**What to do now (cheap future-proofing, part of §4 migrations):** make `passwordHash` nullable and
add the `provider`/`providerId` columns in a migration. That's it — the columns sit empty until we
build the feature, but adding them now avoids a bigger migration later. **Full social login is a
future integration plan, kept out of Phase 3 to stay simple.**

---

## 10. What Phase 1 already solved (for the record)

So we don't re-litigate: unified argon2 + bcrypt migration, active rate limiting, fixed the
forgeable `'your-secret'` JWT fallback (fail-closed), set `JWT_REFRESH_SECRET`, boot-time config
validation, cross-tenant games leak, expired-token re-login loop, and the change-password route
contract. The auth **core** is in good shape; Phase 3 is about the **management layer and recovery
flows** on top of it.

---

## 11. Suggested Phase 3 order (smallest → biggest, each shippable)

1. Backend: guard-wiring fix + field reconciliation (§3) — correctness, ~half a day.
2. Backend + FE: **forgot-password via OTP** (§4A.2, §6) — highest user value.
3. FE: `useCurrentUser()` hook + **wire `UserForm`** (create/edit) — kills the 404s (§4B.1–2).
4. Backend: password history/reuse + change hygiene (§7).
5. Backend + FE: **real invite flow** (set-password email) (§4A.4).
6. FE: account pages (profile/settings/security polish) + verify-email OTP (§4B.4–5).
7. FE: `admin/roles` read-only reference + role assignment page (§4B.3, 4B.6).
8. Migration only: `passwordHash` nullable + `provider/providerId` columns (future OAuth) (§9).
9. Later/optional: httpOnly-cookie session hardening (§8), followers concept, MFA.

---

## 12. User-detail architecture: view vs edit, and the multi-scope routes (analysis)

The concern: we have (or are heading toward) `/admin/users/[id]`, `/tenant/users/[id]`,
`/league/users/[id]`, `/team/users/[id]` — four parallel user areas — and the current
`[id]` page drops you straight into an edit form even when you only want to *view* a rich
user profile (roles, status, activity, footprint). Is this over-engineered?

**Verdict: the SCOPES are legitimate; the DUPLICATION and the view/edit conflation are the
real problems.** Fix those two and the complexity collapses.

### What production systems do (GitHub / Stripe / Linear / any mature admin)
1. **List** — scoped to what *you* can manage (the backend already scopes `GET /users` by the
   caller's role: a team admin only sees their team's people). Filters, search, pagination.
2. **Detail page = READ-first hub.** Shows the full profile (identity, roles, status, tenant/
   league/team, verified, last login, activity/audit log, sessions). It is *not* a form. It
   carries **action buttons** (Edit, Reset password, Change roles, Suspend) that are shown/
   enabled by *your* permissions over *that* user.
3. **Edit is an ACTION, not a destination.** It opens a focused edit form (modal, side panel, or
   an `/edit` sub-route) launched from the detail page. You never land "blind" in a form.
4. **Roles/permissions** are a section/tab of the detail (or a small modal), not a separate page.

Our current `UserForm` conflates view and edit via an `isEditMode` flag — that's exactly why
"viewing" feels wrong: you're always in a form.

### The `?ctxUserId=` "one screen for everyone" idea — half right
- **Right:** the *profile view* of a user can be ONE reusable component regardless of who's
  looking. What differs is how much you see and what you can do — driven by **permissions**, not
  by separate screens.
- **Trap:** overloading `/account/dashboard?ctxUserId=X` mixes two different mental models —
  *self-service* ("manage MY account") and *administration* ("manage SOMEONE ELSE"). Production
  systems keep these **route families separate** even when they reuse components, because the
  intent (and the permission context) is different. Don't collapse them into one context param.

### Recommendation for Elenem (pragmatic, not over-engineered)
Build the pieces **once**, mount them at thin scope-specific routes:
- **Reusable components:** `UsersTable` (have it), `UserSummary` (new — the read-first detail),
  `UserEditForm` (today's `UserForm`, used purely as an edit *action*).
- **Two route families, clear intent:**
  - **Self-service:** `/account/*` (profile, security, settings) — a person managing themselves.
  - **Administration:** `/[scope]/users` + `/[scope]/users/[id]` (scope ∈ admin/tenant/league/
    team). Each is a ~10-line wrapper mounting the SAME components with a scope context. The
    detail is read-first; **Edit** opens `UserEditForm` (modal or `/[id]/edit`). The backend
    already enforces scoping + permissions, so there is **no per-scope logic to duplicate** — only
    the route wrapper differs.
- **Split-view/sidebar** (list + selected-user summary in a panel + "view full") is a great polish
  once `UserSummary` exists — it's just `UserSummary` rendered in a drawer. Edit stays a button.
- **Activity/footprint:** the `AuditLog` model exists (write-only today) — the detail's "Activity"
  tab reads it later.

**So:** don't build four implementations, and don't build one magic context route. Build **one set
of components + thin scope wrappers**, and make **view the default, edit an action.** That is both
simpler than what we have drifting and matches production norms. Concrete near-term step: turn
`/admin/users/[id]` into a read `UserSummary` with an "Edit" button that opens the form, instead of
the form being the page.
