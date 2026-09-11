# Handover — Phase 5: launch, and the public side

> Written 2026-09-11, at the end of the Phase 4 conversation. Read this, then
> `docs/INFRASTRUCTURE.md`, then `docs/UI_CONVENTIONS.md`. Everything below was verified against the
> running application or the provider's own documentation on that date; where something is a guess,
> it says so.

---

## 1. Four things the next session must not get wrong

These are decisions, not opinions. Each one reverses something an earlier session believed.

### 1.1 The product is now **DXScores**

`elenem.com` could not be had. `dxscores.com` and `dxscores.app` are registered at Namecheap
(2026-09-11, payment pending). The name says what the product is about — scores, sport — and `dx`
carries `d/dx`: *deriving* something from the numbers, which is exactly what a standings table and a
scorers' list are.

**Nothing in the code has been renamed.** Repositories, `NEXT_PUBLIC_ROOT_DOMAIN`, the brand mark,
every document still say *Elenem*. That is fine and deliberate: DNS does not care what a repository
is called. The rename is Phase 5 work, and the order matters — do the user-visible strings and the
logo, leave the repository names until last, because renaming a repository breaks every deploy hook
pointing at it.

### 1.2 Images do **not** block the launch

Roadmap item 17 says S3 is *"blocking for the public site"*. **That is withdrawn.** The owner's
words, and they are correct:

> *Most local teams don't even have recognisable logos to begin with, so I don't want to act like
> image is a "MUST" at all cost. Launching is the real must.*

So: **a missing image must never stop a game being saved, a standing being computed, or a page being
served.** Every avatar and crest in the product already falls back to initials on a tinted square
(`player-quick-view.tsx`, `league-card.tsx`) — keep doing that everywhere, and build the public site
as though no image exists. R2 is how images work *when they exist*.

Wire R2 when convenient. Do not sequence anything behind it.

### 1.3 Standings, schedule and results are the hero. Blogging is not.

> *Most local leagues don't even blog, so having it as the hero is proper to bigger and more
> organised leagues. The most interactive info to bet on is obviously standings, schedules and
> completed games. That's where the money is.*

The public tenant site's information hierarchy follows from that, and the current
`[tenantSlug]/page.tsx` (395 lines) should be re-read against it rather than assumed correct:

1. **The table** — what a federation publishes and what people argue about.
2. **What is next** — the coming matchday, with dates and halls.
3. **What just happened** — completed games with scores.
4. Scorers, then everything else.
5. **News, only if the federation has any.** A blog section on a tenant with no posts is an empty
   promise; hide it rather than render an empty state.

Blogging *is* in Phase 5 — it was never on the roadmap and should have been — but as a feature for
the federations that will use it, not as the shape of the page.

### 1.4 The platform is self-serve

The old product depended on the owner onboarding each federation by hand. It no longer should. The
marketing CTA is **"start for free"**, not "request a demo" or "contact us".

This is *why* the infrastructure looks the way it does: `*.dxscores.app` on Vercel's nameservers
means a federation that signs up at nine in the morning has a live public site at 09:01, with no
human in the loop. See `INFRASTRUCTURE.md` §1.

It also creates an obligation nobody has met yet — **reserved slugs** (§4.2 below).

---

## 2. Where the code actually is

### Done and stable

Phases 1–4 are closed apart from item 17 (images). The admin product works end to end for all four
roles: calendar, results, standings with configurable rules, phases and brackets, scoresheets,
player statistics, settings, users. 157 backend tests pass. Typecheck and lint are clean in both
repositories. Both are pushed.

The conventions that hold it together are in **`docs/UI_CONVENTIONS.md`** — read it before writing a
screen. The most load-bearing sections: §1 drawer/modal/page, §2 one page shell and one header
geometry, §6 creation is the minimum that makes a thing real, §8 leaf pages keep the menu you
arrived with.

### The public side, honestly

**Nine routes are `ComingWithLaunch` placeholders**, deliberately — an honest French placeholder
rather than a fake screen:

```
(public)/standings  (public)/leagues  (public)/teams  (public)/about
(public)/docs       (public)/api      (public)/legal
public_tenant/[slug]/playoff   public_tenant/[slug]/stats   public_tenant/[slug]/players
```

**Seven routes have real content but are pre-Phase-2 code** — `useState` + `useEffect` + a bare
`api.get`, no React Query, no `parseResponse`, their own loading flags. They work; they are not
built the way the rest of the product is:

```
public_tenant/[slug]/page.tsx            395 lines   ← the tenant home
public_tenant/[slug]/teams/[l]/[t]       276
public_tenant/[slug]/games/[l]/[g]       217
public_tenant/[slug]/news/[postSlug]     184
public_tenant/[slug]/teams               164
public_tenant/[slug]/games               158
public_tenant/[slug]/standings           148
```

Rebuilding these is the same job done three times already on the admin side (teams, competitions,
users) — the pattern is settled and quick.

**The marketing site is entirely in English and still says "Elenem".** `(public)/page.tsx` (378
lines) reads *"Same Problems."*, *"THE OLD WAY"*, *"Our engine."*, *"How Elenem works"*. Item 18's
translation pass covered the **admin app only**. The landing page, `features` (1131 lines),
`pricing` (313) and `plans` (192) are untouched and also need the self-serve CTA of §1.4.

`(public)/upload` and `(public)/upload2` are experiments and should be deleted.

### Public API

Backend controllers exist for all of it, but the route naming is **inconsistent** and should be
settled before the public site is written against it:

```
public-posts   public-games   public-leagues   public-teams   public-tenants     ← hyphen
public/seasons   public/players                                                  ← slash
```

Pick one. `public/*` is the better shape; it is two files to change.

---

## 3. Phase 5, in the order I would do it

1. **Deploy what exists**, following `INFRASTRUCTURE.md` §6b step by step. Shipping the admin
   product to a real domain flushes out environment problems while they are still cheap. Do this
   *before* writing new screens.
2. **The two-root-domain change** (§4.1) — it must land before the first deploy.
3. **Reserved slugs** (§4.2) — before anybody can self-serve.
4. **The tenant public site**, in the §1.3 order: standings, schedule, results. On React Query, on
   the design system, mobile-first. This is the launch.
5. **Rename to DXScores** — user-visible strings, brand mark, metadata. Repositories last.
6. **The marketing site** — French, self-serve CTA, honest about what the product does.
7. **SEO** — `generateMetadata`, sitemap, robots, OG images. A standings link pasted into WhatsApp
   must preview properly; that is how this product spreads in Goma.
8. **R2 + images + blog posts**, once the above is live.
9. **Onboard LIPROBAKIN in person**, and watch where they hesitate.

---

## 4. Work that is known and not done

### 4.1 Two root domains, not one — **blocks the first deploy**

`utils/resolveTenantSlugFromHostname.ts` and `middleware.ts` assume a single
`NEXT_PUBLIC_ROOT_DOMAIN` (`elenem.site`) and treat **every** subdomain of it as a tenant. With the
split that is wrong:

- `dxscores.com`, `www.dxscores.com` → the app. Never a tenant.
- `*.dxscores.app` → a tenant, the label is the slug.

Needs `NEXT_PUBLIC_APP_DOMAIN` and `NEXT_PUBLIC_TENANT_DOMAIN`; the resolver returns a slug only for
the second. `lvh.me` stays the local stand-in for the tenant domain, which already works.

### 4.2 Reserved slugs — **blocks self-serve**

A tenant slug becomes a public hostname the instant somebody signs up. `www`, `api`, `app`, `admin`,
`media`, `cdn`, `mail`, `static`, `assets`, `docs`, `blog`, `status` must be refused at registration,
server-side, beside the existing slug generation. The first federation to call itself *API* would
otherwise take out infrastructure.

### 4.3 The storage adapter

No S3 code exists yet, which is lucky — nothing to unpick. What lands should be an
`@aws-sdk/client-s3` client pointed at R2's endpoint, behind a small interface, so no screen names
its provider. Same rule the sport columns follow (`PLAYERS_AND_STATS` §1).

### 4.4 Blog posts

The `Post` model is already complete — `title`, `slug`, `content` (Markdown), `richContent`,
`excerpt`, `type`, `status`, `publishedAt`, `scheduledAt`, `heroImage → MediaAsset`, scoped by
`targetType`/`targetId`. The admin side exists (`/tenant/posts`, `post-form.tsx`). What is missing is
the public rendering and the image pipeline. Per §1.3, build it for the federations that will use it
and do not give it the top of the page.

### 4.5 Still open from earlier phases

Carried forward from `ROADMAP_V2` §12 — none of it blocks launch:

- **Accent-blind search.** *Kasereka* and *Kaséréka* compare as two people. No ordinary Postgres
  collation folds accents; the recommendation is a folded shadow column. Revisit when a roster
  passes a few hundred names.
- **Playoff seeding, two-legged ties, automatic promotion.** Brackets are entered, not drawn.
  LIPROBAKIN agree their play-off in committee and hand over a fixture list.
- **`/admin/*` is English and pre-Phase-2.** One operator, who is the owner. Its create buttons were
  removed rather than repointed — a cross-tenant list cannot answer *"for which organisation"*.
- **Touch drag on the calendar**, **long rosters on the scoresheet** — parked, unasked-for.

---

## 5. How to work in this repository

- **Two repositories**, both on `main`, both pushed: `rajjys/elenem-frontend`, `rajjys/elenem`.
- **Run it**: backend `npm run start:dev` (3333), frontend `npm run dev` (3000).
  `CREDENTIALS.local.md` has a login for every role. Sign in with username or e-mail — there is no
  organisation code to type.
- **The seeded data is the owner's working data.** Do not reseed and do not tidy it. To test
  anything destructive, create a throwaway database (`INFRASTRUCTURE.md` has the pattern) or create
  a record, verify, and delete it, checking counts before and after.
- **Verify in the browser, not by reasoning.** There is a Playwright harness pattern in the
  scratchpad from this session: log in, visit routes, collect `pageerror` and any response ≥ 400.
  Several of this session's findings — a dialog that silently did nothing, a sidebar that vanished,
  a 403 on every page load — were invisible to typecheck and lint.
- **Verify mutations against the database.** A `PUT` returning 200 is not proof: `PUT /players/:id`
  returned 200 and wrote nothing for as long as it had existed.
- **Migrations**: always `prisma migrate`, never `db push`. The baseline rule holds in production
  more than anywhere.
- **Commits**: no `Co-Authored-By` trailer in these repositories. Long explanatory bodies are the
  house style — say what was wrong and why the fix is shaped as it is.

---

## 6. The prompt for the next session

> I'm continuing work on DXScores (the repositories still say *elenem*) — a free league-management
> product for Congolese basketball federations, built for LIPROBAKIN in Kinshasa and LIBAGO in Goma.
> Phases 1–4 are done and pushed; we're starting **Phase 5: launch and the public side**.
>
> Read `docs/HANDOVER_PHASE5.md` first, then `docs/INFRASTRUCTURE.md` and
> `docs/UI_CONVENTIONS.md`. Four things in that handover reverse what earlier sessions believed, so
> please don't skip §1.
>
> In short: the product is being renamed **DXScores** (`dxscores.com` for the app,
> `*.dxscores.app` for tenant sites); **images do not block anything** — most Congolese clubs have
> no logo, and a missing one must never stop a page rendering; **standings, schedule and results are
> the hero** of a tenant's public site, not blogging; and the platform is **self-serve**, so the CTA
> is "start for free".
>
> Start by reading the public surface as it actually is — nine placeholder routes and seven real
> ones written before the design system — and tell me what you'd do first, before writing anything.
> I'd like to deploy what already exists to the real domains early, so problems surface while
> they're cheap.
>
> Both servers run locally (3333 / 3000) and `CREDENTIALS.local.md` has a login for every role. The
> seeded data is my real working data — don't reseed it.

---

## 7. What this session changed, for context

Phase 4 closed, plus a good deal that was not on any list:

- The scorers' leaderboard and player pages, derived from scoresheets with no stored totals.
- The scoresheet became a **report** you read, with the entry grid behind one dialog.
- League settings became one tabbed screen; competitions, clubs and users were rebuilt on the
  templates; creation became "the minimum that makes a thing real".
- **`GET /users` was returning password-reset and verification tokens** to any admin who listed
  users — a full account-takeover path, now an allow-list with 16 tests.
- **`PUT /players/:id` returned 200 and wrote nothing**, on every player, for as long as it existed.
- **Nineteen list endpoints** wrapped a `findMany` + `count` in a 5-second `$transaction`, turning
  slow queries into intermittent 500s.
- A sidebar that vanished whenever a ctx parameter was missing; dialogs unmounted on empty lists;
  `Input` discarding its own styling whenever a caller passed `className`.

The pattern worth carrying forward: **most of these were invisible to typecheck, lint and the test
suite, and obvious within thirty seconds of opening the page as the right role.**
