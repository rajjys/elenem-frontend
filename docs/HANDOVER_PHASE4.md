# Handover — Phase 4, items 15 to 17

> Written 2026-09-08, at the close of Phase 3. Paste the block below into a new conversation.
> Everything above the line is context for whoever writes the prompt; everything below it is the
> prompt.

---

Continuing Elenem, a multi-tenant sports-league SaaS for Goma/Kinshasa basketball.
Two repos, both clean and committed (NOT pushed):

```
/Users/macbook/Code/elenem-frontend
/Users/macbook/Code/elenem-backend
```

**Read first, in order:**

1. `docs/ROADMAP_V2.md` — §3 Phase 4 is why you are here. Also §6 (customer answers), §11 (what
   Phase 3 shipped), §12 (known and deliberately unfixed).
2. `docs/GAME_AND_STANDINGS.md` — §0 is the multi-sport argument that governs everything, §1 is the
   scoresheet that produces the only player data the product has.
3. `docs/STAGES_AND_PLAYOFFS.md` — Phase 3's design and what it deliberately left out (§16).
4. `docs/SEASON_AND_DASHBOARDS.md` — the season's state machine and the three dashboards.
5. `docs/CALENDAR_MODULE.md` — §0 is the most important paragraph in the repo.
6. `docs/ANALYSIS_2026-08.md` — the original audit.
7. `docs/Homologation, classement et calendrier.pdf` — the federation's real signed bulletins.
   Extract the page images rather than rendering the PDF: the headless viewer will not paint it.
   `python3` over the file, pulling the embedded JPEGs (`\xff\xd8\xff` … `\xff\xd9`), works.

**Run it:**

```
backend   cd elenem-backend && npm run start:dev     (:3333)
frontend  cd elenem-frontend && npm run dev          (:3000)
logins    CREDENTIALS.local.md at the backend root. Password ElenemDev2026!
reseed    stop backend; psql "postgresql://postgres:1234@localhost:5432/postgres"
            -c 'DROP DATABASE IF EXISTS elenem WITH (FORCE);' -c 'CREATE DATABASE elenem;'
          npx prisma migrate deploy; start backend; node scripts/seed-dev.mjs
```

**NOTE** — kill 3333 with `lsof -ti:3333 | xargs kill -9`. The auth throttler 429s on tight login
loops; wait it out with `until curl ... | grep -q 200; do sleep 5; done`, never a bare `sleep`.
Playwright's `waitForURL` never fires on the dashboard; poll `page.url()` instead. Playwright lives
at `~/.npm/_npx/e41f203b7505f1fb/node_modules/playwright` with the browser at
`~/Library/Caches/ms-playwright/chromium_headless_shell-1155/chrome-mac/headless_shell`. Give Next
a long first-compile wait (10s+) on a route you have just created, or you will screenshot a spinner.

**Non-negotiable conventions:**

- React Query + `services/<module>.ts` + `parseResponse`. Never `Schema.parse()`, never raw axios,
  never `useState/useEffect/axios` for server state.
- Design tokens only. Never a raw palette colour, never `dark:`. `positive`/`negative` mean win/loss;
  `cat-1..4` for identity (there are exactly 4). Anything destined for paper uses
  `[data-surface="document"]`.
- Flat routes (`/game/[id]`) are for identifiable resources; pages live under their section
  (`/tenant/calendar`, `/league/seasons/[seasonId]/format`). `ctx*Id` params carry one scope across
  a *set* of pages; a leaf resource uses a path param.
- Never `prisma db push`. After a schema change verify
  `SHADOW_DATABASE_URL=postgresql://postgres:1234@localhost:5432/elenem_shadow npx prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --exit-code`
  returns **0**.
- All user-facing strings French. Backend error messages too.
- Commit messages: no `Co-Authored-By` trailer. Long explanatory bodies are wanted; keep writing
  those.

**Working state — everything below is green as of this handover:**

- Backend suite: **115 passing, 0 failing.**
- Frontend lint: **0 problems.** Both repos typecheck clean.
- Every screen, for all four roles (system / organisation / competition / club): **no 4xx, no page
  errors.**
- Migration baseline: **0**.

**The database has live user data in it.** The owner uses the app while you work. Goma D1 Messieurs
has a four-phase format they composed themselves — « Saison régulière → Phase de 6 → Demi-finales →
Finales » — and six clubs assigned to pools. Do not reseed, do not tidy it. Prefer an isolated
throwaway tenant (`tenantCode` starting `ZZT`), clean it up afterwards with a transaction, and diff
the seeded standings before and after to prove you put things back.

---

## What you are here to do

**Phase 4, items 15 → 16 → 17.** Item 18 (the translation pass) is post-V1. Item 14 is done.

The owner's framing, in their words:

> 4.15 is very important. Especially the player part. Leagues actively track player stats so having
> it is also very important… For user management we can keep it simple for now… I do not see the
> player module as something requiring a lot of work as the building blocks are already there.
> Maybe have a stats page as well for players — best scorer, ppg, volume 3, matches played… Each
> player showing a list of games he played this season and stats, the basic stuff a league admin
> wants to see.

**Work the way this project has worked all along: analyse first, argue the design, get the decisions
settled, write them into `docs/`, then implement in sprints — verifying by running the real app with
Playwright, not by assuming.** Push back hard where the plan is wrong; the owner would rather be told
than watch it fail. After each sprint, say what you built, where you are, and what is next.

---

## Item 15 — players, and the questions to settle first

### The building blocks that exist

- **`PlayerGameStat`** — one row per player per game, with `stats Json` keyed by the codes the
  *sport* declares in `sport-rules/utils/sport-stat-columns.ts` (basketball: `3PT`, `2PT`, `FT`,
  fouls). Each column has a `weight`; **a total is `Σ value × weight` and is never stored**. Written
  by the box score (`GET/PUT /games/:id/box-score`), which reconciles against the final score.
  Read `GAME_AND_STANDINGS` §1 before touching any of it: *a sport's vocabulary is data, a sport's
  arithmetic is one function*, and every screen that reads a stat must go through the column list
  rather than naming a three-pointer.
- **`Player`** — roster entries, `userId` nullable (they are not accounts). Slug auto-suffixes.
  Bulk paste exists (`components/players/bulk-roster-dialog.tsx`).
- **`PlayersListView`** — one component across four scopes, the pattern the whole app follows.
- `/league/players`, `/tenant/players`, `/team/roster` all render real data.

### The finding that should shape the design

**`PlayerSeasonStat` is read in five places and written in none.** Nothing aggregates
`PlayerGameStat` into it. So "best scorer / PPG / games played" has no source today.

That is the same fork the team standings faced, and it was settled: `processGameResult`
**recomputes rather than accumulates**, and `GAME_AND_STANDINGS` §3.2 says a derived table is not
editable because *a screen implying you can edit it is lying about where the authority lives*.

So the first question to argue is: **does `PlayerSeasonStat` earn its existence, or is a player's
season line derived from `PlayerGameStat` the way a club's is derived from its games?** A stored
aggregate is a second source of truth that can disagree with the sheet it came from — and this
product's entire claim is a record nobody disputes. Consider deleting it. If it stays, it needs the
recompute hook the team stats already have, and a reason why the extra table is worth it.

### What the owner wants on screen

- A **stats page** — best scorer, PPG, volume of threes, matches played. Note that "best scorer" and
  "volume 3" must come from the sport's column definitions, not from hardcoded keys, or the product
  becomes a basketball product (`GAME_AND_STANDINGS` §0).
- **A player's own page** — the games they played this season and their line in each.
- Item 15's original wording is *"modal-first: quick view in a dialog with real content — photo,
  team, number, position, season line; CTA to the extended page. Most work never leaves the list."*
  That instinct is still right and it matches how the calendar's day panel works. `/player/page.tsx`
  is currently a stub rendering the words "Player Page"; `/player/[playerId]` does not exist.
- Leaderboard scope: it belongs to a **stage**, not a season, for exactly the reason a table does —
  read `STAGES_AND_PLAYOFFS` §2 before deciding.

### Things to check rather than assume

- Whether a player's stats should follow them across a mid-season transfer. `PlayerSeasonStat` is
  keyed `[playerId, seasonId, teamId]`, which says they should not.
- What the published bulletin says about players. The federation's own notifications do **not**
  carry player statistics — the owner has said leagues track them, so find out whether the artefact
  is internal or published, because that decides whether a leaderboard needs an export.
- `minutesPlayed` exists on both stat models and nothing writes it. Decide whether it is real.

---

## Item 16 — the remaining pages onto the templates

The owner does not remember what this was for. It is: `components/ui/page-templates.tsx` exports
`ListPage`, `DetailPage`, `FormPage` and `EmptyState`, and roughly **twenty routes are still
eleven-line stubs rendering their own name** — `/tenant/analytics`, `/league/analytics`,
`/tenant/edit`, `/team/edit`, `/team/posts`, `/league/posts`, `/coach`, `/account/profile`, several
public pages, and `/player` itself.

The lesson from `ANALYSIS_2026-08` §3.1 applies before any of them are built: **a navigation entry
may only exist if its destination renders real content today.** So the first question for item 16 is
not "how do we build twenty pages" but "which of these twenty should exist at all" — several are
almost certainly deletions, and `/tenant/tickets` is a ticketing feature nobody asked for.

---

## Item 17 — S3

Logos and photos. Blocking for the public site (`ROADMAP_V2` §1.3), so it comes after 15 and 16 but
before Phase 5. `utils/upload.ts` already carries the presigned-PUT path and the one deliberate
`eslint-disable` in the codebase (a presigned upload must not carry our Authorization header,
because signing the URL *is* the authorisation).

---

## One decision the owner has asked for, with the research already done

**Accent-blind matching.** `ROADMAP_V2` §12 lists it as a deploy-time collation decision. **That
framing is wrong and the research below corrects it — say so.**

Verified on this machine (Postgres 18.4, database collation `C`, provider `c`):

| | |
|---|---|
| `'Kaséréka' ILIKE '%kasereka%'` under `C` | **false** |
| the same under `fr-FR-x-icu` | **still false** — no ordinary collation folds accents |
| `unaccent('Kaséréka') ILIKE unaccent('%kasereka%')` | true |
| `'Kaséréka' = 'kasereka' COLLATE fold` (ICU, `und-u-ks-level1`, `deterministic=false`) | true |
| `LIKE` with that collation | **works** — a Postgres 18 improvement; it was impossible before |
| `ILIKE` with that collation | **ERROR: nondeterministic collations are not supported for ILIKE** |

That last row is the whole problem. Prisma's `mode: 'insensitive'` emits `ILIKE`, and there are
**51 of them** across 13 services, mostly on `name`, plus `firstName`/`lastName`/`slug`/
`description`. Under a non-deterministic collation every one of them would **throw**, so adopting it
means deleting all 51 — and any single one missed turns a cosmetic miss into a runtime 500.

**So the options, costed:**

- **(a) Non-deterministic ICU collation.** Elegant, and Postgres 18 finally makes `LIKE` work with
  it. But: 51 call sites must lose `mode: 'insensitive'`, a miss is a crash rather than a silent
  miss, Prisma has no schema-level collation support so it lives in a hand-written migration that
  may fight the `migrate diff` baseline rule, and every index on those columns is rebuilt.
  **This is the one with real risk. It is not free.**
- **(b) `unaccent` + expression indexes.** Requires `$queryRaw` for every affected search, which
  loses Prisma's composition — and these queries AND in the role-scope filters. Rewriting 51 of
  those by hand is where a tenant-isolation bug gets born. **No.**
- **(c) A folded shadow column**, e.g. `Player.searchName`, written by the app beside the slug
  (which every write path already computes) and searched with an ordinary `contains`. Prisma-native,
  ordinarily indexable, no raw SQL, no collation, no drift. Costs a column per searchable model, a
  backfill, and the discipline of keeping it in sync. The folding function already exists —
  `box-score.service.ts:25`, used for the duplicate-name guard (`GAME_AND_STANDINGS` §6.4).
- **(d) Leave it.** Case-insensitivity already works; only accents do not fold, and the one place it
  is correctness-critical is already handled in JS.

**Recommendation to put to the owner: (c), scoped to the names people actually search — players and
teams — not all thirteen columns.** It carries no crash risk, needs no collation, and reuses a
helper that exists. It is roughly half a day. Explicitly recommend *against* (a) for a free MVP
launch: it converts a cosmetic defect into a crash surface, and it fights the repo's own
migration-baseline rule.

---

## Standing context you will need

- **Phase 3 shipped without**: seeding a bracket from the qualifying table, two-legged series,
  automatic promotion when a semi-final is decided, and the public bracket. All deliberate, all in
  `ROADMAP_V2` §12.
- **A club administrator** is refused `GET /seasons` and `GET /leagues/:id` by design. Their screens
  no longer ask. If you add a player screen for them, do not reintroduce the question.
- **`League.competitionType`** is stored, mapped into three DTOs, and read by nothing. Format lives
  per stage now. Decide whether it survives.
- The seed's `resultRounds` only scores fixtures whose date has passed, so dev data no longer
  contains matches played in the future.
