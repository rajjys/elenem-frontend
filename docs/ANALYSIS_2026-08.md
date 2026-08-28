# ELENEM — State of the System, August 2026

> Written after booting both apps locally, seeding a fresh organisation end-to-end, and reading
> the schema, services and routes. Every claim below is backed by something I actually ran; the
> commands are included so you can re-verify.
>
> Companion to `MASTER_PLAN.md` (which is still accurate and still the right plan). This document
> answers a different question: **what should we cut so we can launch?**

---

## 0. It runs. That matters more than it sounds.

```
backend   NestJS 11 + Prisma 7 + Postgres 18   → http://localhost:3333   ✅ boots clean
frontend  Next 16 (App Router, Turbopack)      → http://localhost:3000   ✅ boots clean
db        64/64 migrations applied                                       ✅ schema current
tsc       frontend                                                       ✅ 0 errors
jest      backend                                       74/83 pass, 9 fail (stale DI mocks)
```

I created a brand-new organisation through the real API — no fixtures, no DB writes:

```
✓ register org owner            (11.3s  ← see §2.4)
✓ create tenant/org             (157ms)
✓ create league                 (58ms)
✓ create season                 (97ms)
✓ create 6 teams                (6 calls)
✓ create 15 fixtures + 10 results (25 calls)

=== STANDINGS (Championnat Goma D1) ===
rank  team              P  W  L   PF   PA  Pts
1     Nyiragongo BC     5  4  1   423  360  12
2     BC Virunga        5  3  2   380  375   9
3     AS Goma           3  1  2   230  236   3
4     Muungano BC       2  1  1   165  176   3
5     Panthers BC       2  1  1   155  170   3
6     Kivu Stars        3  0  3   207  243   0
```

**The engine works.** Org → league → season → teams → fixtures → results → live standings, with
tie-breakers, soft deletes, audit trail and tenant isolation. That is a real product core and you
should stop discounting it. Most people who say "I built a SaaS" have less than this.

Now look at that table again, because it also contains three bugs. All three are in §2.

---

## 1. The good

Genuinely well-built, keep as-is:

- **Multi-tenancy is real.** `tenantId` is on every table, scope is enforced service-side, and the
  Phase 1 fix for the `?tenantId=` spoof holds. I re-tested it. This is the hardest thing to
  retrofit and you already have it.
- **The standings engine.** `standings.service.ts` (661 lines) does configurable point systems,
  an ordered tie-breaker chain including head-to-head sub-tables, and per-season team stats. This
  is the single feature your Goma league actually needs and it is *finished*.
- **Auth is in good shape.** argon2, refresh tokens, password history, OTP verify/reset, real
  invite flow, throttling, lockout. Phase 1 + 3 did their job.
- **Soft deletes + audit fields everywhere** (`deletedAt`, `createdById`, `updatedById`,
  `deletedById`). For a product whose entire value proposition is "the numbers are not disputed",
  this is exactly right and it was smart to build it early.
- **The game state machine** (`game-state.service.ts`) with an explicit transition map and
  optimistic-locking `version` column.
- **The recent Phase 3 work** — `UsersListView` reused across four scopes via thin 6-line page
  wrappers — is the pattern the whole app should follow. That is the right instinct.
- **`sport-rules-defaults.ts`** already knows basketball is 2/1/0 with PF/PA, not 3/1/0 with
  goals. Someone was thinking. (It's just not wired up — §2.1.)

---

## 2. The bad — defects I hit while using it

These are not code smells. These are things that broke in front of me.

### 2.1 A basketball league is scored with football rules

```sql
    league                | sportType  | winPoints | drawPoints | lossPoints
 Kigali Premier Division  | BASKETBALL |     3     |     1      |     0
 Goma Volleyball League   | VOLLEYBALL |     3     |     1      |     0
```

`sport-rules-defaults.ts` correctly defines basketball as WIN=2 / LOSS=1. But `LeagueRules` rows
are always created with the Prisma **column** defaults (3/1/0), and `standings.service.ts:47`
prefers `league.leagueRules` whenever it exists — so the sport-aware branch at line 66 is
**unreachable in production**. Every league ever created gets football scoring, and basketball
gets a `drawPoints` value for an outcome that cannot occur.

*Fix:* seed `LeagueRules` from `sportRulesService.getSportRules(sportType)` at league creation
instead of from column defaults. ~10 lines. Do this before launch — it is your core promise.

### 2.2 Standings rank by total points while teams have played different numbers of games

Look at the table in §0. Kivu Stars (3 games) sits below Panthers (2 games). AS Goma, Muungano and
Panthers are all on 3 points having played 3, 2 and 2 games. Ranking by *accumulated* points is
only valid when everyone has played the same number of matches.

In European football that assumption mostly holds. **In Goma it never holds** — games get
postponed for rain, venue double-bookings, referee no-shows, teams not travelling. Half a season
in, your teams will have played 4, 6, 5, 7, 5, 6 games. Your table will be wrong, visibly, to
exactly the people you built this to convince.

This is *the* end-of-season drama you set out to kill, and the current engine reproduces it.

*Fix:* add `winPercentage` / points-per-game as a first-class sort key, and always display
`P` (games played) prominently. FIBA ranks by win% for precisely this reason. `TieBreakerCriterion`
already has `WIN_PERCENTAGE` in the enum — it's just not the default.

### 2.3 A player cannot exist without an email address

```
POST /players {"firstName":"Mumbere","lastName":"Katembo", ...}
→ 400 "Email is required to create a new user for the player."
```

`Player.userId String @unique` — **mandatory**. Every player must own a user account, which must
have a unique email. A coach registering a 12-man roster in Goma needs 12 email addresses.

This is the single biggest market-fit defect in the product. It makes the first useful action —
"put my team into the system" — impossible for your actual users. Most of these players are 16–24
year olds with a phone and WhatsApp, not an inbox they check.

*Fix:* make `Player.userId` nullable. A Player is a **roster entry**; a User is **someone who logs
in**. Link them opportunistically later (claim-your-profile). This is one migration and it unblocks
your entire onboarding story.

### 2.4 Two players in the same organisation cannot share a name

```
POST /players {"firstName":"Jean","lastName":"Bisimwa"}
→ 409 "A player with a similar name already exists (slug: jean-bisimwa)."
```

`@@unique([slug, tenantId])` on Player, with a hard 409 instead of auto-suffixing. In a 12-team
league that's ~144 players drawn from a pool where Kambale, Mugisha, Bahati and Muhindo repeat
constantly. I hit this collision within 8 inserts of realistic Congolese names.

*Fix:* auto-suffix the slug (`jean-bisimwa-2`) like teams already do. Never 409 a human for having
a common name.

### 2.5 Registration takes 11 seconds

`POST /auth/register` blocked for **11.3 seconds** in my run — argon2 hashing plus a synchronous
SMTP send. On a Goma 3G connection that is an abandoned signup.

*Fix:* fire the verification email async (don't await the transport in the request path).

### 2.6 `/public-games` returns a 500 on the default request

```
GET /public-games          → 500 Internal server error
GET /public-games?date=... → 200 []
```

`date` is documented `required: true` but never validated, so `new Date(undefined)` reaches Prisma
as `Invalid Date`. This is your **most public endpoint** — the "today's games" view, the thing an
anonymous fan hits first — and it 500s when called without params.

*Fix:* default to today when `date` is absent. Two lines.

### 2.7 Referees and coaches are 400 lines of unreachable code with passing tests

```
src/referees/  → dto/ services/     (no controller, no module)
src/coaches/   → dto/ services/     (no controller, no module)
GET /referees  → 404
GET /coaches   → 404
```

`RefereesModule` and `CoachesModule` do not exist. The services are never instantiated. Yet
`referees.service.spec.ts` and `coaches.service.spec.ts` both **pass**, which is worse than having
no tests — it's a green check mark on a feature that cannot be reached.

You asked me to seed referees. I could not: the feature has no HTTP surface.

### 2.8 League slugs are machine codes

```
"Kigali Premier Division"  → slug: demokgld1m
"Championnat Goma D1"      → slug: lbg7d1m
```

Teams slug correctly (`apr-bbc`). Leagues get `<tenantcode><division><gender>`. Your public URLs
are `elenem.site/leagues/lbg7d1m` — unshareable, unmemorable, invisible to Google. For a product
whose growth channel is "the fans share the standings link", this is a direct tax on distribution.

### 2.9 Test suite: 9 failures

`jwt.strategy.spec` (5), `permissions.service.spec` (1), `sport-rules.controller.spec` (1),
`tenants.service.spec` (1). Mostly stale DI mocks. But the `PermissionsService` one is the real
bug already logged as Phase 5.3 — `getPrismaWhereForScope` emits invalid filters for resources
with no `leagueId` scalar.

---

## 3. The ugly — where the effort went and didn't come back

### 3.1 79% of the sidebar led nowhere

I resolved every sidebar entry against the filesystem. Before today:

| Surface | Items | Real page | Placeholder | **404** |
|---|---|---|---|---|
| Tenant admin | 29 | 7 | 2 | **20** |
| League admin | 23 | 5 | 2 | **16** |
| Team admin | 15 | 1 | 1 | **13** |
| System admin | 21 | 5 | 5 | **11** |
| **Total** | **88** | **18** | **10** | **60** |

Seventy of eighty-eight navigation items were a lie. Team admin was 93% dead — and three of its
items (`Help`, `FAQs`, `Issues`) pointed at `/tenant/operations/*`, a copy-paste from another file.

Meanwhile four *real, finished* pages were orphaned — not linked from anywhere:
`/admin/games` (158 lines), `/admin/seasons` (159), `/league/games` (208), `/team/users`.

You were right that this was costing you. Every time you opened the app you saw a monument to
unfinished work, and the finished work was hidden behind it.

**Fixed today** (see §6).

### 3.2 The brand colour does not exist

`tailwind.config.ts` is Tailwind **v3** syntax. The project runs Tailwind **v4**, which does not
auto-load that file — it needs an `@config` directive in the CSS, and there isn't one. So the
`primary` palette defined in that config is never registered.

I pulled the compiled stylesheet off the dev server and grepped it:

```
ring-primary-500     → 0 occurrences   (30 usages in source)
border-primary-500   → 0 occurrences   (28 usages in source)
text-primary-600     → 0 occurrences   ( 8 usages in source)
```

**143 `primary-*` class usages across the codebase generate zero CSS.** Every focus ring and input
border that was supposed to carry your brand colour renders as nothing. This is a large part of why
the app "has no identity" — the identity was written, it just never compiled.

*Fix:* define `--color-primary-50 … 900` inside the existing `@theme` block in `globals.css`.
One block, and 143 dead classes come alive at once. Highest visual-payoff-per-line change available.

### 3.3 Four brand colours, one product

```
/admin  → indigo      /tenant → blue
/league → purple      /team   → emerald
```

The app changes colour depending on your permission level. You already diagnosed this — you were
right. A user who is both a league admin and a team admin watches the product change identity as
they navigate. **Fixed today**: unified to one accent.

### 3.4 The UI language is half French, half English, in the same viewport

The public header renders `Solution · How it works · Pricing · contact` directly above a French
hero and above a French footer. The tenant sidebar mixed `Dashboard`, `Analytics`, `Teams` with
`Parametres` and `Gestion d'utilisateurs`. The league sidebar mixed `Tableau de Bord` and
`Classements` with `Overview` and `Analytics`.

There is a `useI18n.ts` hook — 25 keys, hand-rolled, used in **exactly one file**
(`PublicHeader.tsx`). No i18n library is installed. Roughly 520 user-facing string literals sit
inline in JSX. Default locale is `'en'`, for a product launching in **Goma, DRC**.

The hook is also client-only with a `localStorage` read in `useEffect`, so it renders English on
the server and swaps to French after hydration — a guaranteed flash of the wrong language.

### 3.5 React Query was adopted in 1 file out of 67

`MASTER_PLAN` Phase 2.2 set React Query + per-module services as the standard.
`services/` contains `tenants.ts` and `users.ts`. **1 file** uses `useQuery`; **66** still use the
`useState + useEffect + api.get` triad. The pattern is right and proven — it just hasn't spread.

### 3.6 There is no fixture generator

```
grep -rln "roundRobin|generateFixtures|generateSchedule|fixture" src/   → 0 results
```

Your #1 stated priority — the scheduling engine — **does not exist in any form**. Games are created
one at a time. My 6-team single round robin took 15 separate API calls. A realistic 12-team double
round robin is **132 games created by hand, one form at a time**.

This is the gap between "impressive demo" and "a league organiser will actually use this".

### 3.7 Payload weight

```
/features  482 KB   /  176 KB   /pricing  156 KB   /games  61 KB
```

The marketing page is nearly half a megabyte of HTML before images. The footer says
« Conçu pour mobile ». On Goma mobile data that page costs real money to open.

---

## 4. Are we solving *their* problem or *ours*?

You asked the sharpest question in your whole brief. Honest scorecard against what a Goma league
actually suffers:

| Real pain | Status |
|---|---|
| Standings computed manually by one person, disputed every year | ✅ **Solved.** The engine is real and correct in structure. |
| An auditable, published-as-you-go table nobody can argue with | ✅ **Solved.** Audit fields + public standings. |
| Nobody knows when or where the next game is | 🟡 Games exist and publish; no notification, no reschedule flow |
| Teams have played unequal numbers of games | ❌ **Actively wrong** (§2.2) — reproduces the drama you're fixing |
| Getting a 12-man roster into the system | ❌ **Blocked** (§2.3, §2.4) — needs 12 email addresses, rejects common names |
| Building a season calendar | ❌ **Absent** (§3.6) — 132 manual forms for a 12-team season |
| Entering a score from the venue, on a phone | ❌ Desktop-shaped; no mobile score entry, no offline |
| Assigning referees | ❌ Model exists, module is dead code (§2.7) |
| French-first interface | ❌ Defaults to English, mixed in-page (§3.4) |
| Cheap on mobile data | ❌ 176–482 KB pages (§3.7) |
| Registration fees / fines / money | ⬜ Not needed for a free launch — correctly ignorable |
| Player transfers, sponsorships, ticketing, messaging, invoices | ⬜ **Built as sidebar entries only.** Nobody asked for these. |

The pattern is clear: **the hard, valuable half is done. The easy, mandatory half is missing.**

You built the standings engine — genuinely difficult, and the thing you personally needed. You did
not build the boring plumbing that lets someone *get their data in* (bulk roster entry, fixture
generation, phone-friendly score entry). And you spent real effort on twelve categories of feature
— finances, ticketing, sponsorships, transfers, messaging, integrations — that no Goma league has
ever asked any software for.

The good news: the missing half is *much* cheaper than the half you finished.

---

## 5. The competition-model question

This is the real architecture question in your brief, so it gets a real answer.

### What's wrong today

`League` is doing three jobs at once:

1. **The organisation** — "Ligue de Basketball de Goma", a physical body with a president, an
   address, affiliated clubs. (It even carries a `businessProfile` for this.)
2. **The competition** — "Championnat D1 Messieurs", a thing with a format and a winner.
3. **The structural node** — via an unused `parentLeagueId` self-relation.

Your instinct was right: treating a league as a competition and giving it a `businessProfile` to
represent the physical org was the oversight. Everything downstream inherits it:

- `competitionType` lives on `League`, but format varies **per phase**: one season is round robin
  *then* playoffs. One league, one season, two formats. The current model cannot express this.
- `LeagueStanding @@unique([teamId, seasonId])` — exactly **one table per season**. No group tables.
  No per-phase tables. The moment you have Groupe A / Groupe B, the model breaks.
- `Game.stage` is a flat enum (`REGULAR | PLAYOFF | FINAL`) with no bracket, no round, no
  progression. It labels a game; it cannot structure a tournament.
- `parentLeagueId` is stored and filterable but **never traversed** — no recursion, no tree, no
  inherited permissions. It is a flat FK wearing a hierarchy costume.
- `Tenant` has no parent either, so FEBACO → Ligue du Nord-Kivu → Ligue de Goma is unrepresentable
  at both levels.

### The insight that stops your brain melting

You listed the formats as if they were a taxonomy to enumerate: UCL format, LaLiga format, NBA
format, hybrid, group-based, knockout… That framing is what makes this feel infinite. **Don't
enumerate formats. Decompose them.**

Every competition format in world sport is a **sequence of phases**, and there are only **three**
kinds of phase:

- `LEAGUE` — everyone plays everyone, N legs → produces **one table**
- `GROUPS` — M pools, round robin inside each → produces **M tables**
- `KNOCKOUT` — bracket, N rounds, 1 or 2 legs → produces **a bracket**

Compose those three in order and you have all of it:

| Competition | Phases |
|---|---|
| LaLiga, Premier League | `LEAGUE(2 legs)` |
| Championnat de Goma | `LEAGUE` → `KNOCKOUT` (playoffs) |
| Coupe du Congo | `KNOCKOUT` |
| UEFA Champions League | `LEAGUE(1 leg, 36)` → `KNOCKOUT(2 legs)` |
| FIFA World Cup | `GROUPS(8×4)` → `KNOCKOUT` |
| NBA | `LEAGUE(conferences)` → `KNOCKOUT(7 games)` |

Three phase types. Not twenty formats. **This is the whole idea**, and it is the difference between
a weekend of work and a rewrite you never finish.

### The one migration that matters

Insert `Stage` between `Season` and `Game`:

```prisma
model Stage {
  id        String       @id @default(cuid())
  seasonId  String
  name      String       // "Saison régulière", "Play-offs", "Phase de groupes"
  order     Int          // 1, 2, 3 — phases run in sequence
  format    StageFormat  // LEAGUE | GROUPS | KNOCKOUT
  legs      Int    @default(1)
  advancing Int?         // "top N from this stage qualify"
  groups    Group[]
}

model Group {           // only used when format = GROUPS
  id      String @id @default(cuid())
  stageId String
  name    String        // "Groupe A"
}
```

Then:
- `Game` gains `stageId`, `groupId?`, `round?` (knockout round), `bracketSlot?`
- `LeagueStanding` re-keys from `@@unique([teamId, seasonId])` to
  `@@unique([teamId, stageId, groupId])`

**Backfill is trivial and lossless:** every existing season gets one auto-created stage
`{name: "Saison régulière", order: 1, format: LEAGUE}`; every existing game points at it; every
existing standing re-keys to it. Zero data loss, zero behaviour change on day one — and groups,
playoffs, cups and brackets all become expressible.

Two tables, four columns, one backfill. That is the entire structural fix.

### What to do about hierarchy — my recommendation: nothing, yet

Splitting `League` into `Organisation` (a tree: FEBACO → Nord-Kivu → Goma, with divisions and
M/F versions as leaves) plus `Competition` (owned by an org, has editions) is the *correct* model.
It is also a large, risky refactor that touches every service and every scope check.

**Defer it.** Here is why that's safe: today `League` ≈ "a competition run by one tenant", which
is completely adequate for a single-league customer — which is every customer you will have in
your first year. The org-hierarchy problem only bites when a federation wants to see all its
provinces in one account and inherit admin rights down the tree. **That is a 2027 problem, not a
launch problem.** When FEBACO actually asks, you will have revenue and a much better idea of what
they need than you do now.

Do `Stage` (weekend of work, unlocks playoffs — which is what killed your first product).
Skip `Organisation`/`Competition` until someone pays you to care.

### On "am I hardcoding a SaaS into local context?"

You worried that starting from the Congolese format means baking in local assumptions. It doesn't —
because Congolese basketball is *regular season + playoffs*, which is literally `LEAGUE → KNOCKOUT`.
Building that as a two-phase sequence costs the same as hardcoding it, and gives you the World Cup
and the Champions League for free. **Start local, model generic. This one is not a trade-off.**

---

## 6. Changed today

**Sidebar purge.** All four navigation trees now live in one file,
[`components/layouts/nav-items.ts`](../components/layouts/nav-items.ts), under one rule: *an entry
may only exist if its destination renders real content today.*

```
                items    all destinations verified to exist
  admin      21 →  7     ✅   (recovered orphaned /admin/games, /admin/seasons)
  tenant     29 →  7     ✅
  league     23 →  7     ✅   (recovered orphaned /league/games)
  team       15 →  2     ✅   (recovered orphaned /team/users)
  ─────────────────────
  TOTAL      88 → 23     ✅   0 broken links (was 70)
```

Also in that change:
- **One accent colour** (`APP_THEME_COLOR = 'blue'`) replaces indigo/blue/purple/emerald.
- **One icon library** — lucide throughout, dropping the `react-icons/fi` + phosphor mix
  (`MASTER_PLAN` Phase 9.4, done for the nav).
- **All labels in one file**, so translating the admin shell later is a single-file edit.
- Four layout files went from 95–108 lines each to 16.

`tsc --noEmit` clean; all three dashboards compile and serve.

> Nothing was deleted from the *product* — only from the *navigation*. Every removed destination
> was a 404 or a placeholder. The features are still in `MASTER_PLAN.md` where they belong.

---

## 7. Recommended MVP scope

Ordered by "what stops a Goma league organiser using this on Monday".

**Ship-blockers — roughly a week of work:**

1. Make `Player.userId` nullable; auto-suffix player slugs (§2.3, §2.4) — *unblocks roster entry*
2. Fixture generator: round robin, 1–2 legs, over a date range (§3.6) — *132 forms → 1 click*
3. Seed `LeagueRules` from sport defaults (§2.1) — *basketball scored as basketball*
4. Win% / points-per-game ranking + visible games-played (§2.2) — *the table stops being wrong*
5. Define `--color-primary-50…900` in `@theme` (§3.2) — *143 dead classes come alive*
6. Default `/public-games` to today (§2.6) — *the public homepage stops 500ing*
7. Human-readable league slugs (§2.8) — *shareable links*
8. Async the registration email (§2.5) — *11s → instant*

**Then, before inviting anyone:**

9. Bulk roster entry — paste or CSV a team sheet, no emails required
10. Phone-first score entry for one game (the only screen that must be perfect on mobile)
11. Pick a language strategy and execute it (§8, Q3)
12. `Stage` migration (§5) — playoffs, before your first season ends and history repeats

**Explicitly not now:** finances, ticketing, sponsorships, transfers, messaging, integrations,
analytics, custom domains, Stripe, realtime. All still in `MASTER_PLAN.md`. None of them close a
free user.

---

## 8. Open questions

Answers to these change what gets built next.

1. **Who is the design partner?** Is there a specific Goma league that will run its 2026/27 season
   on this? Everything above re-ranks depending on whether we're building for one named league or
   for "leagues in general".
2. **Basketball only at launch, or multi-sport?** Committing to basketball alone lets us hardcode
   good defaults everywhere and delete a lot of conditional logic.
3. **Language: French-only, or FR/EN toggle?** French-only at launch is cheaper, more focused, and
   probably right for Goma. An FR/EN toggle is ~3× the work and serves nobody who exists yet.
   *(I made the sidebars French for org-facing surfaces and English for `/admin`, on the assumption
   that `/admin` is only ever you. Easy to flip — it's one file.)*
4. **What is the first screen a non-admin sees?** Standings, or today's fixtures? That decides what
   the public site and the future mobile app are built around.
5. **Who enters scores in practice** — a league official at a desk that evening, or someone at the
   venue on a phone? Different products. This decides whether offline support matters.
6. **Do players need accounts at all in v1?** If not (my recommendation), roster entry becomes
   trivial and §2.3 disappears rather than being worked around.
7. **Do referees matter for launch?** Enabling them is ~a day (the services exist, they just need a
   controller + module). Deleting them is an hour. Both beat leaving them as dead code with green
   tests.
8. **Does anything real depend on the `DEMOKGL` / `DEMOGMA` seed data**, or can I reset the local DB
   to one clean, realistic Goma basketball league for development?
9. **What's your actual launch date target?** The ship-blocker list above is about a week. Knowing
   whether you have one week or three changes how much of §7's second block we attempt.

---

## 9. Shipped (2026-08-27, after the decisions in §8)

Decisions taken: **ship-blockers first · players are roster entries, not accounts · French-only ·
stay multi-sport.** Staying multi-sport made item 3 more important, not less — the sport defaults
now have to be right for every sport, not just hardcoded for basketball.

| # | Ship-blocker | Verified |
|---|---|---|
| 1 | `Player.userId` nullable + player slugs auto-suffix | `POST /players` with no email → `mumbere-katembo`; same name again → `-2`, `-3` |
| 2 | **Fixture generator** `POST /games/generate-fixtures` | 12 teams × 2 legs → 132 fixtures, 22 matchdays, **one call, 2.2s** |
| 3 | `LeagueRules` seeded from sport defaults | new BASKETBALL league → `WIN_PERCENTAGE`, 2/1/0, FIBA tie-breakers |
| 4 | Win% / points-per-game ranking | see the before/after table below |
| 5 | `--color-primary-50…900` in `@theme` | `ring-primary-500` etc. now present in compiled CSS (was 0) |
| 6 | `/public-games` defaults to today | `200` with no params (was `500`) |
| 7 | Human-readable league slugs | `championnat-provincial-nord-kivu` (was `libago9d1m`) |
| 8 | Registration email sent async | **11.3s → 0.35s** |

**Plus one defect found while fixing #3/#4 that was not in the original list:**

`LeagueRules.tieBreakerOrder` stores Prisma's `TieBreakerCriterion`, but the standings comparator
switches on the dictionary's `TieBreakerEnum` — and the two vocabularies disagree
(`GOAL_DIFFERENCE` vs `GOALS_DIFFERENCE`, `GOALS_FOR` vs `GOALS_SCORED`). The code cast between
them (`r as TieBreakerEnum`), so the default order written at every league creation
(`POINTS, GOAL_DIFFERENCE, GOALS_FOR`) matched nothing and fell through to `default: return 0`.
**Every configured tie-breaker in the system was a silent no-op.** Now translated explicitly in
`sport-rules/utils/league-rules-from-sport.ts`, with unrepresentable criteria dropped rather than
ignored.

### The ranking fix, on real data

Twelve-team league, results entered with teams on different numbers of games:

```
rank  team               P   W   L   Pts   Win%
1     BC Karisimbi       2   2   0    4    1.000
2     Katindo BC         2   2   0    4    1.000
3     BC Majengo         3   3   0    6    1.000
4     Kivu Stars         3   3   0    6    1.000
…
10    Panthers BC        2   0   2    2    0.000
12    AS Goma            2   0   2    2    0.000
```

Both directions were wrong before and are right now:
- **Top:** the 6-point teams no longer outrank the 4-point teams — all four are unbeaten, and are
  separated by tie-breakers rather than by who happened to play an extra fixture.
- **Bottom:** Panthers and AS Goma hold **2 points** (2 games, 0 wins) yet rank *below* teams on
  **1 point** (1 game, 0 wins). Under the old sort, losing more games earned you a higher position.

### New API

```
POST /games/generate-fixtures
{ seasonId, legs: 1|2, startDate, daysOfWeek?: [6,0], intervalDays?, kickOffTime?, dryRun? }
```

Circle-method round robin with a bye slot for odd team counts and home/away alternating by round
parity (verified: every team 11 home / 11 away over 132 fixtures, every ordered pair exactly once).
`dryRun: true` previews without writing. Each fixture goes through `createGameScoped`, so scope,
conflict and slug rules all still apply; a clashing fixture is reported and skipped rather than
aborting the run.

### ⚠️ Deploy hazard found while migrating

`prisma migrate dev` refused to run: replaying the 64 migration files produces a **different
schema than the live database**. The live DB matches `schema.prisma` (it has `hashed_rt`,
`password_reset_token`, `VenueCourt.tenantId`; it does not have `emailVerified`) — so at some point
changes were applied with `prisma db push` instead of a migration.

`prisma migrate status` reports "up to date" because all 64 rows are recorded as applied, which
hides this completely. **The consequence: `npx prisma migrate deploy` on a fresh production
database — exactly what `MASTER_PLAN.md` §A Step 2 puts in the Railway start command — would build
the wrong schema.**

Today's migration was therefore hand-written and registered with `prisma migrate resolve --applied`,
leaving your data intact. **Before deploying anywhere, baseline the migration history**: diff
`schema.prisma` against a replay of the migrations, commit the difference as one catch-up
migration, and verify by replaying all of them into an empty database.
