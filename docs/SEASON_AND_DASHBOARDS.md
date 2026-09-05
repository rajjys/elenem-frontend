# The season's life, and the four dashboards

> Written 2026-09-05, before any code. Companion to `ROADMAP_V2.md` §10.1, which opened item 14a,
> and to item 14. Where this and the roadmap disagree, this wins for these two items.
>
> Everything below was checked by running it: against the seeded database, against a throwaway
> organisation created and destroyed for the purpose, and through the real app in a browser. The
> commands are named so the claims can be re-verified.

---

## 0. The thing the roadmap got slightly wrong, and why it matters

`ROADMAP_V2` §10.1 says `League.currentSeasonId` is "a pointer nothing maintains". That reads as a
tidiness complaint, and it is not one. Two things are actually true:

- **It is maintained** — `createSeasonScoped` sets it, `deleteSeasonScoped` clears it
  (`seasons.service.ts:460`, `:618`).
- **It is the write target for every fixture in the product.** `CreateGameDto` has no `seasonId`
  field at all. `_validateScopeAndInputs` reads `league.currentSeasonId` and uses it
  (`games.service.ts:668`). There is no way, anywhere, to put a fixture in any other season.

So the defect is not staleness. It is that **creating a season silently redirects every write in
the competition**, and that a caller who names a season is not obeyed. Proved on a throwaway league:

```
POST /calendar/publish { seasonId: S1, fixtures: [...] }
  → 201 { createdCount: 1 }
  → the created game's seasonId is S2
```

S1 was `COMPLETED` and would have refused the fixture. S2 accepted it, the caller was told
`createdCount: 1`, and nothing anywhere says the fixture went somewhere else. The same run showed
the second half of it:

```
GET /games/standings/view?leagueId=…     (no seasonId — what every screen sends)
  → S2's table: empty
```

A club administrator cannot pass a `seasonId` — `GET /seasons` refuses them by design
(`GAME_AND_STANDINGS` §3.5). So **the day a league creates next season, every club's standings
screen goes blank**, and the table they came for is unreachable from their surface.

None of this can happen today because every league has exactly one season and nobody has made a
second. All six seeded seasons are `ACTIVE`. The product has never been in any other state.

---

## 1. Which of the nine statuses are real

`SeasonStatus` has nine values in Prisma and **eight** in `schemas/enums.ts` — the frontend has
never known about `DELETED`. Here is every place a season's status changes what may happen,
found by reading, not by grepping for the word:

| Gate | Where | States |
|---|---|---|
| Refuse a new fixture | `games.service.ts:675` | `ARCHIVED · CANCELED · COMPLETED` |
| Refuse creating a second season | `seasons.service.ts:393` | `PLANNING · SCHEDULED · ACTIVE · PAUSED` |
| Refuse a league admin editing it | `seasons.service.ts:522` | `COMPLETED · ARCHIVED` |
| Refuse creation | `seasons.service.ts:391` | `UNKNOWN` |

That is the whole list. Which means:

- **`PAUSED` gates nothing.** It is not in the refusal list for fixtures, so a paused season behaves
  exactly like an active one.
- **`ARCHIVED` and `COMPLETED` gate the same two things.** They are one state with two names.
- **`SCHEDULED` and `PLANNING` gate the same one thing.** Also one state with two names.
- **`DELETED` is a decoy.** It is written by the soft-delete path, and it is also freely settable by
  `PUT /seasons/:id`, where it does nothing. Verified: a season set to `DELETED` by PUT is still
  returned by `GET /seasons/:id`, is still the league's `currentSeasonId`, and **still accepts new
  fixtures** — because `DELETED` is not in the refusal list. Deletion is `deleted_at`. The enum
  value is a trap wearing the name of a destructive act.
- **`UNKNOWN`** is a Prisma-default artefact that creation already refuses.

### There is no transition machine, and the field is a free-text choice

`UpdateSeasonDto` carries `status` and `PUT /seasons/:id` writes it. Ten arbitrary jumps in a row,
every one a 200:

```
SCHEDULED → ACTIVE → PAUSED → COMPLETED → ACTIVE → CANCELED → ARCHIVED → PLANNING → UNKNOWN → DELETED
```

`COMPLETED → ACTIVE` and `ARCHIVED → PLANNING` are un-completing a season by typing a word into a
dropdown, with no audit entry and no reason asked. Compare `Game`, which for the same nine-value
problem has an explicit transition map, verbs rather than a field, refusals in French naming both
states, an optimistic-locking `version` column, and an `AuditLog` row behind every move
(`game-state.service.ts:128`). A season is a bigger object than a game and has none of it.

`season-form.tsx` renders all eight frontend values in a raw dropdown with English labels
(`Unknown`, `Planning`, `Scheduled`…). Several of the choices it offers are guaranteed 400s:
creation refuses `UNKNOWN` outright, refuses a running status on a season that already ended, and
refuses a finished status on a season that has not started.

### Two more fields say the same thing

`Season.isActive` is a second truth source — `games.service.ts:672` requires `isActive: true`
independently of `status` — and `deleted_at` is a third. Three fields, overlapping, none of them
derived from the others.

### Recommendation: four states

Each one has to forbid something the others allow, or it is a label.

| State | What it means | What it forbids | What it enables |
|---|---|---|---|
| **`PLANNING`** | being set up; nothing has been played | nothing | fixtures may be added and moved freely |
| **`ACTIVE`** | being played | — | results, the live table, the published bulletin |
| **`COMPLETED`** | over, and the table is final | new fixtures, new results | the next season may open |
| **`CANCELED`** | abandoned | new fixtures, new results | the table means nothing and says so |

**Cut, with the reason so it is not relitigated:**

- **`SCHEDULED`** — "dates are finalised" is a fact about the calendar, and the calendar module
  already has a publish step that means exactly that (`POST /calendar/publish`). A second
  published-flag on the season is two writers on one fact, which `GAME_AND_STANDINGS` §3.7 already
  ruled against for `LeagueRules`.
- **`PAUSED`** — it forbids nothing today and I cannot name what it should forbid. A season halting
  in Goma is real; what actually happens is that individual fixtures are `POSTPONED`, which the game
  machine already handles with a reason and an audit row. A season-wide pause changes what the
  dashboard *says*, and that is a note, not a state.
- **`ARCHIVED`** — its only distinct meaning would be "keep it out of the pickers", which needs a
  league with ten seasons. LIPROBAKIN has one. Revisit when a picker is actually crowded.
- **`UNKNOWN`** — a season always has a state.
- **`DELETED`** — removed from the enum. Deletion is `deleted_at`.
- **`isActive`** — dropped or derived. One field decides.

Migration is lossless: `SCHEDULED → PLANNING`, `PAUSED → ACTIVE`, `ARCHIVED → COMPLETED`,
`UNKNOWN → PLANNING`, `DELETED` rows already carry `deleted_at`.

---

## 2. What moves a season between them

The roadmap asks whether anything happens automatically, and what breaks the first time it fires on
a league mid-correction. That second half is the whole answer.

**`PLANNING → ACTIVE` — automatic, on the first result recorded.**

Not on a date. A season whose start date has passed with no game played is still pre-season, and
that is LIPROBAKIN's ordinary shape: their published calendar (`docs/Homologation…pdf`, p.6) ends
with a `BARRAGE` whose fixtures are marked *SI NECESSITE* and a `FINALE` whose teams are `GAME 1 /
GAME 2 / GAME 3` placeholders. Dates in this competition are the plan; results are the fact. The
transition is safe to automate because it is monotonic and only *opens* things — nothing that was
allowed in `PLANNING` becomes forbidden in `ACTIVE`.

**`ACTIVE → COMPLETED` — never automatic.**

This is the one that would break. The obvious trigger is "every fixture has a result" — and it would
fire on LIPROBAKIN's regular phase the moment the last regular fixture is scored, because §6 A4 says
the playoff format is decided *after* they see how much calendar is left. The season would close
itself, refuse the playoff fixtures the committee then agrees, and the operator would meet a French
refusal with no idea what changed. A league mid-correction is worse: a result entered wrongly and
fixed a week later would close and reopen the season on its own.

So the product **offers** it — when every fixture on record has a result, the league's screen says
so and puts the verb next to it — and a person commits it, with a reason, audited. That is also what
the federation does: page 6 of the bulletin ends with a signed line reading *FIN DE LA SAISON
SPORTIVE 2025-2026*. Closing a season is an act of a committee, not the expiry of a date.

**`COMPLETED → ACTIVE` — allowed, deliberate, audited.**

Today a league admin who closes a season cannot reopen it: `seasons.service.ts:522` refuses a
`LEAGUE_ADMIN` any update to a `COMPLETED` season. That is a one-way trap on the role that runs the
competition. And reopening is a real event — page 1 of the same bulletin is *Notification 005:
Homologation des résultats*, a committee ratifying five days of results after the fact under
articles 371 and 372 of the RGS. Results in this domain are corrected weeks later by design.

**`→ CANCELED` — deliberate, with a reason.**

**Nothing else is automatic. No cron, no date-triggered job.** A date-triggered job in Goma fires on
a calendar that has already slipped, and the first thing the operator learns is that the software
has an opinion they cannot override. That is the opposite of `CALENDAR_MODULE` §0.

The mechanism is `GameStateService`'s, copied deliberately: a transition map, verbs not a field,
refusals in French naming both states, an `AuditLog` row with a `reason` column. `status` comes out
of `UpdateSeasonDto` entirely — it is not a property of a season any more than a game's status is a
property of a game.

---

## 3. `currentSeasonId` — keep it, and invert who decides it

The tempting answer is "derive it and delete the column". That is wrong, and the reason is precise.

Derived as *the latest by start date*, or *the one whose dates contain today*, it breaks the first
time somebody plans ahead — which is exactly what a season-management screen is for. Create the
2027-28 season in April while 2026-27's playoffs are still running and the derived answer flips to
next season: every club's standings screen goes blank, and they cannot pass a `seasonId` to argue.
That is the same failure as §0, arrived at from the other direction.

Derived as *the one that is `ACTIVE`* is closer, but it is a query dressed as a rule, and it has no
answer during pre-season, when there is exactly one season and nothing has been played.

**Keep the column. Change three things:**

1. **Creation stops stealing it.** A new season takes the pointer only if the league has none.
   Today `createSeasonScoped` assigns it unconditionally.
2. **The state machine maintains it.** Closing the current season hands the pointer to the league's
   `ACTIVE` season, or to its only `PLANNING` one, or clears it. Opening a season takes it.
3. **The create rule relaxes.** Today you cannot create next season until you close this one —
   `seasons.service.ts:393` refuses while any of `PLANNING · SCHEDULED · ACTIVE · PAUSED` exists.
   That is backwards: planning next season while the current one finishes is the normal thing. The
   rule becomes **at most one `ACTIVE` season per league**, any number `PLANNING`.

And the writes must honour it rather than working around it:

- `CreateGameDto` gains `seasonId`, optional, defaulting to the current one and **validated against
  the league** when supplied.
- `POST /calendar/publish` passes the `seasonId` it was given, so a draft studied for one season
  cannot be published into another.

Those two are a bug fix, not a refactor. They are the difference between `currentSeasonId` being a
default and being an ambient global.

---

## 4. The season's own screen should not exist

`ROADMAP_V2` §10.1 asks what a season's screen is for, given that the calendar, the standings and
the games are already tenant- or league-scoped and none of them wanted to be season-scoped. Argued
honestly, the answer is: nothing.

Every job a season screen might hold already has a home, and a better one:

| Job | Where it lives, and why that is right |
|---|---|
| fixtures | the calendar — tenant-level, because one hall on one Saturday is one resource (`CALENDAR_MODULE` §1) |
| the table | `/league/standings`, which already carries a season picker when there is more than one |
| the points rule, the bands | `/league/settings/rules` (`GAME_AND_STANDINGS` §3.7) |
| the clubs, the rosters | `/league/teams`, `/league/players` |
| a result | the calendar's day panel, or `/game/[id]` |

What is left with no home is **the four acts on the season itself** — open it, close it, reopen it,
cancel it — plus its name, its dates, and its history. That is three buttons and a timeline. It is
the same shape as a game's verbs, and `CALENDAR_MODULE` §8.1 already decided where those go: beside
the thing, not on a page of their own.

`/season/page.tsx` renders the words "Season Page" and `/season/[seasonId]/dashboard` renders
"Season Dashboard" — the same stubs `/game/manage` and `/game/dashboard` were before
`GAME_AND_STANDINGS` §2.4 retired them. `/season/layout.tsx` is worse: a one-item sidebar naming
itself, which is exactly the pattern §2.3 of that document condemned for stranding a reader on a
leaf. And `/season/create` redirects a tenant admin to `/tenant/seasons`, which is a 404.

**Retire `/season`, `/season/[seasonId]/dashboard`, `/season/layout.tsx` and `/season/create`.**

Season management becomes **`/league/seasons`, rebuilt** — the competition's *editions*, which is
the customer's own word for them: the published calendar is headed *31ème ÉDITION*. One row per
season with its state, its dates, how many fixtures it holds and how many have results, the verbs
that are legal from where it is, and creation in a dialog on the same page. The list is where the
acts belong because the acts are about *which* season, and the list is the only place that shows
more than one.

This is not "we ran out of time for the season screen". It is the same conclusion the calendar
reached about `/season/fixtures` and the match page reached about `/game/dashboard`, for the same
reason: a screen has to earn its address.

---

## 5. The dashboards

`ROADMAP_V2` item 14 describes four screens showing "the same season-blind counter grids". That
understates it in two places and overstates it in one.

### What is actually on screen

**`/team/dashboard` (373 lines) is not season-blind — it is fiction.** It fetches nothing. It
renders a hardcoded English club called *Lightning Strikers*, "Premier League Division A · Founded
2018", four players named Marcus Johnson, Alex Rivera, David Chen and Sarah Williams, their goals
and assists, three fake results against Thunder Bolts and Fire Dragons, and three fake
announcements. Logged in as `coach.vir@libago.cd`, the breadcrumb says `VIR › Tableau de bord` above
a club that does not exist.

**And that club administrator has no sidebar at all.** `useSidebarEligibility` requires
`ctxTenantId && ctxLeagueId && ctxTeamId` on a `/team/*` route, and reads the league from
`user.managingLeagueId`, which is `null` for a team admin — their league is on
`user.managingTeam.leagueId`. Verified against `/auth/me` and in the browser on all three team
pages: zero navigation links. `getPostAuthRedirect` sends every team admin to `/team/dashboard`, so
a club's entire experience of the product is one fake page with no way off it. The `/team/standings`
entry added for them in the standings work is in `nav-items.ts` and has never been reachable.

**`/admin/dashboard` (659 lines) is also entirely fabricated** — "$89,230 monthly revenue", 324
tenants, four named support tickets, five services' uptime percentages. `/admin` is only ever the
founder (`ANALYSIS_2026-08` §8 Q3), so it is not a launch blocker, but a screen invented for a demo
is worse than an empty one on the surface where you check whether something is wrong.

**`/league/dashboard` (540 lines) is real data with four defects**, all confirmed in the browser:

- **"Prochains Matchs" 400s on every load** and is permanently empty. It sends
  `status=SCHEDULED&status=LIVE` as a repeated parameter; `GetGamesParamsDto` declares
  `status?: GameStatus | GameStatus[]` but validates with `@IsEnum(GameStatus)` and no
  `{ each: true }`, so an array is always rejected. Reproduced directly:
  `GET /games?status=SCHEDULED` → 200, `GET /games?status=SCHEDULED&status=LIVE` → 400. It is the
  only caller in the frontend that sends an array. On a competition with 63 unplayed fixtures the
  panel reads *Aucun match programmé*.
- **"Billets vendus (Aujourd'hui) · 0 · +3.6% from last season"** — the value is a literal `0`, the
  trend is a literal `3.6`, and half the card is in English.
- **"0.0% from last season"** on Équipes and Athlètes: `getLeagueMetricsScoped` only computes a
  delta when `compareTo` is passed, and the page never passes it. And "Matchs Joués · +30.0%" is
  `gamesPlayedRatio` — a completion ratio — rendered green with a plus sign as though it were growth.
- **An `N` column** for draws on a basketball table, all zeroes for ever. `GAME_AND_STANDINGS` §3.4
  removed it from the standings screen and it survived here. Every team's avatar also renders the
  letter **L**, because the card passes `name="logo"` and the fallback takes the initial.

It also holds ~90 lines of `hidden` English dead markup ("Quick Actions / Manage Teams / Schedule
Game"), and it is `useState + useEffect + axios` throughout — five sequential fetches — against the
React Query convention that is supposed to be mandatory.

**`/tenant/dashboard` (428 lines) is the healthiest** and still has: `TenantDetailsSchema.parse()`
and `PaginatedLeaguesResponseSchema.parse()` instead of `parseResponse`; the same fabricated
ticket-sales card; **`$0` printed on every league card**, in Goma; English toasts and error strings;
an English "Quick Actions" heading; and a quick action pointing at `/tenant/admin/add`, which does
not exist.

### Which of the four are genuinely different screens

The precedent is `CalendarView` (one component, two scopes) and `StandingsView` (one component,
three). Applied here by asking what each reader opens the product to find out:

- **Tenant admin** — our actual first user, the community manager: *what do I owe this weekend,
  across all three competitions?* Results missing, this weekend's fixtures, which tables are ready to
  publish. Cross-competition by nature: LIPROBAKIN publish men's, women's and D2 together (§6 A5),
  and the EUBAGO bulletin proves it — one signed page, `(M)`, `(F)` and `(D2)` fixtures interleaved.
- **League admin** — the same question with the fan-out removed, plus the things only they own: the
  rules, the season's state, roster completeness.
- **Team admin** — *where do we stand, when do we play next, who is on the sheet.* They administer
  nothing they can change except their roster. Different questions, different verbs, one club.

So **three screens, not four**:

- **`OrganiserDashboard`, `scope: 'tenant' | 'league'`** — one component. The tenant scope fans out
  over competitions; the league scope is the same panels with one row.
- **`ClubDashboard`** — genuinely different, and genuinely absent. It has to be built, not redesigned.
- **`/admin/dashboard`** — out of scope for launch. Delete the fiction, keep real counts, leave the
  design alone.

### What each shows in each phase

The point of item 14a is that this table can finally be written, because the state is now trustworthy
and the tenant scope can show competitions in *different* states — which is the real case. The
EUBAGO bulletin publishes the men's table as *phase de 6* and the women's as *général* on the same
sheet on the same day.

**Pre-season (`PLANNING`)** — what is missing, each line linking to the thing that fixes it.
Competitions with no clubs; clubs under the roster minimum; a season with no fixtures; the calendar
as the single primary action, per `CALENDAR_MODULE` §9.

**In-season (`ACTIVE`)** — what needs attention, and one number first:

> **Résultats manquants** — fixtures whose date has passed with no score entered.

`getStandingsView` already computes exactly this and states it on the standings screen; no dashboard
shows it. For a community manager entering a weekend of results in one sitting it is *the* number,
and it is the honest answer to "why is my club's record wrong" (`GAME_AND_STANDINGS` §3.3). Then:
this weekend's fixtures per competition; whether the table is ready to publish and when it last was;
halls blacked out in the next fortnight.

**Post-season (`COMPLETED`)** — the outcome. Champion, the final table, the export, and exactly one
forward action: open the next season.

---

## 5bis. Decisions taken (2026-09-05)

All four settled with the user after the argument above. Recorded here so they are not relitigated.

| Question | Decision |
|---|---|
| How many statuses | **Four** — `PLANNING · ACTIVE · COMPLETED · CANCELED`. `SCHEDULED`, `PAUSED`, `ARCHIVED`, `UNKNOWN` and `DELETED` are cut, for the reasons in §1. |
| The season's own screen | **Retired.** `/season`, `/season/[seasonId]/dashboard`, `/season/layout.tsx` and `/season/create` are deleted; the verbs live on a rebuilt `/league/seasons`. |
| Automatic transitions | **One.** `PLANNING → ACTIVE` on the first result. Closing is always a person, with a reason, audited. No cron. |
| The dashboards | **Three.** `OrganiserDashboard` with a `scope` prop for tenant and league, a `ClubDashboard` built from real data, and `/admin/dashboard` de-fictionalised but not redesigned. |

---

## 6. Order of work

Two sprints for 14a, one for 14. Two one-line fixes come first because they are live breakage on
screens item 14 is about to rebuild.

**Sprint 0 — the two live breakages** (an hour)
`@IsEnum(GameStatus, { each: true })` so the league dashboard's fixture panel returns data, and
`useSidebarEligibility` reading `managingTeam.leagueId` so a club administrator can navigate.

**Sprint 1 — the season's life, server side**
The four-value enum and its migration; a `SeasonStateService` shaped like `GameStateService`
(transition map, verbs, French refusals, audit with a reason); `status` out of `UpdateSeasonDto`;
`currentSeasonId` owned by the machine and the create rule relaxed to one `ACTIVE`; `seasonId`
honoured by `createGameScoped` and passed through by `publish`; the automatic `PLANNING → ACTIVE` on
first result; every season refusal translated.

**Sprint 2 — the season's life, on screen**
`/league/seasons` rebuilt as the editions list with the verbs and creation in a dialog; `/season/*`
retired; the status badge and `SeasonForm` down to four states with no status dropdown.

**Sprint 3 — item 14**
`OrganiserDashboard` phase-aware over React Query and a `services/dashboard.ts`; `ClubDashboard`
built from real data; `/admin/dashboard` de-fictionalised.

---

## 6bis. Built — Sprint 0 and Sprint 1 (2026-09-05)

### Sprint 0 — the two live breakages

- `GetGamesParamsDto.status` normalises to an array and validates with `each: true`. The league
  dashboard's *Prochains Matchs* panel returns fixtures for the first time.
- `useSidebarEligibility` reads the club administrator's competition from `managingTeam.leagueId`.
  `UserSchema` gained the field its own `BasicTeam` interface had always declared.

### Sprint 1 — the season's life, server side

**The enum is four values.** `20260905090000_season_four_states` rebuilds the Postgres type and
maps the five removed values losslessly. It also drops `Season.isActive`, which was a second
vocabulary for the same fact — `games.service` required `isActive: true` while the standings read
`status`, and nothing kept them agreeing.

The backfill is *honest* rather than merely valid: an `ACTIVE` season with no completed game becomes
`PLANNING`, which is the same rule the state machine applies forwards. On the seeded database that
correctly moved Championnat Goma D2 Messieurs — 15 fixtures, no results — into pre-season, so the
case the dashboards need is now present in dev data for free.

**`SeasonStateService`** is `GameStateService`'s shape for the larger object: a transition map,
verbs at `POST /seasons/:id/transitions`, refusals in French naming both states, and an `AuditLog`
row with the `reason` column behind every move. `status` is gone from `UpdateSeasonDto` and from
`CreateSeasonDto` — and because the API runs `forbidNonWhitelisted`, a caller that still sends one
is **refused rather than silently ignored**, which is the right failure for a field that used to
decide something.

The transitions:

```
PLANNING  → ACTIVE | CANCELED
ACTIVE    → COMPLETED | CANCELED
COMPLETED → ACTIVE          (reopening, deliberately legal)
CANCELED  → PLANNING
```

`COMPLETED → ACTIVE` is there because the federation's *Homologation des résultats* bulletin ratifies
five days of results after the fact — a result corrected a fortnight late is the ordinary case here.
Before this, a league admin who closed a season could neither edit it nor reopen it.

**One automatic move**, in `processGameResult`, which is the single point every result passes
through: a `PLANNING` season becomes `ACTIVE` on its first result. Audited with
*« Premier résultat enregistré »*. It refuses rather than throws if the competition already has an
`ACTIVE` season, because saving a score must never fail over a pointer.

**`currentSeasonId` has one author.** `SeasonStateService.syncCurrentSeason` derives it — the
`ACTIVE` season, else the oldest `PLANNING` one, else nothing — and creation, deletion and every
transition call it. Creation no longer claims the pointer, `PUT /leagues/:id` no longer accepts it
(a second writer that could aim it at a completed season), and the create-time refusal is gone
entirely: a season is always created in `PLANNING`, so creating one cannot break the one invariant
that matters, which is enforced on the move to `ACTIVE` instead.

**The write target and the read default are now different questions**, which is what the whole §0
failure came down to:

- *Where does a new fixture go?* `league.currentSeasonId` — and `CreateGameDto` finally has a
  `seasonId` to override it with, which `POST /calendar/publish` now passes, so a draft studied for
  one season can no longer be published into another.
- *Whose table is "the standings"?* `currentSeasonOf` — the `ACTIVE` season, else **the most recent
  season that actually produced a result**. The two answers differ in exactly one case and it is the
  case that mattered: the day a league closes 2026-27 and plans 2027-28, the pointer moves (rightly,
  that is where the next fixture belongs) and a table read through it would have gone blank for every
  club that cannot name a season.

Every message an organiser can provoke from the seasons module is now French.

### Verified on a throwaway organisation, created and destroyed

| | |
|---|---|
| creation with `status` in the body | `400 property status should not exist` — refused, not ignored |
| creation without it | `PLANNING`, and the league's pointer follows |
| `PUT /seasons/:id { status }` | `400` — the field no longer exists |
| `PLANNING → COMPLETED` | `409 « Une saison en préparation ne peut pas devenir terminée. »` |
| a move with no reason | `400 « Indiquez la raison — ce changement touche un classement déjà publié. »` |
| first result recorded | season opened itself, `PLANNING → ACTIVE`, audited |
| planning next season while one runs | allowed; pointer stays on the season being played; new fixtures still land there; the table survives |
| `POST /calendar/publish { seasonId: S2 }` | the fixture lands in **S2** |
| closing the season | pointer hands over to the planned season; fixtures into the closed one are refused in French; the default table stays on the last season that was played |
| editing a closed season | `409 « Cette saison est terminée. Rouvrez-la pour la modifier. »` |
| reopening it | allowed, audited with its reason |
| opening a second season | `409 « … est déjà en cours dans cette compétition. »` |

Migration baseline verified clean (`prisma migrate diff --from-migrations --to-schema --exit-code`
→ 0). The seeded data was checked unchanged afterwards apart from the intended D2 backfill.

`scripts/seed-dev.mjs` no longer sends a status. The path it takes — create, publish fixtures,
record results, season opens itself — is the one covered by the table above, but the script has not
been run end to end since the change, because reseeding would have destroyed data in use.

---

### Sprint 2 — the season's life, on screen

**`/season`, `/season/[seasonId]/dashboard`, `/season/layout.tsx` and `/season/create` are gone**,
along with `SeasonForm`, `SeasonsTable` and `SeasonsFilters`. `/season/create`'s success handler had
redirected a tenant administrator to `/tenant/seasons`, a route that has never existed;
`SeasonsTable` linked to `/season/dashboard` and `/season/edit/:id`, neither of which existed
either. Four screens' worth of navigation pointing at nothing.

**`SeasonsView`**, one component with a `scope`, serves `/league/seasons` and `/admin/seasons` —
the shape `CalendarView` and `StandingsView` settled on. Both pages are now four-line wrappers.
Creation is offered only in the league scope: a season belongs to a competition, and the
platform-wide list is not standing in one.

A season is a **card**, not a table row, because what the screen is *for* is the verbs, and each
one carries its consequence in a few words before you commit to it — the same shape the match
page's actions took (`GAME_AND_STANDINGS` §7):

- *Ouvrir la saison* — « Les résultats comptent à partir de maintenant. »
- *Terminer la saison* — « Le classement devient définitif. La saison suivante peut s'ouvrir. »
- *Annuler la saison* — « Plus aucun match ni résultat, et le classement ne veut plus rien dire. »
- *Rouvrir la saison* — « Pour corriger un résultat homologué en retard. Le classement peut changer. »

Every move except opening asks for a reason, and the submit stays disabled until there is one. The
client offers verbs and the server is the authority — the same split the calendar's fixture dialog
uses, so a stale screen cannot make an illegal move stick.

**The card carries what the season holds**: fixtures on record and how many have a result, each
linking to the screen that owns it. When they are equal and non-zero the card says so and promotes
the close — *offering* it, never performing it, because the playoff fixtures LIPROBAKIN agree a
week later have to be able to land.

**Two more writers of `currentSeasonId` turned up and are gone.** `/league/settings/general` had a
« Saison Actuelle » dropdown that PUT the field to `/leagues/:id` — a picker that could aim the
write target for every new fixture at a season that finished last year. It now states which season
is being played and links to where seasons are moved. (Sprint 1 had removed the field from
`UpdateLeagueDto`, so this screen would have started 400ing; it was found by grepping for the
retired routes rather than by the screen being visited.) The league dashboard's inline
create-season dialog went the same way — both of its branches led to the stub.

`SeasonRow` and the mutations live in `services/seasons.ts` on React Query, and the create, update,
filter and pagination Zod schemas that used to sit in `schemas/season-schemas.ts` are deleted: a
second set of shapes beside the service is how `isActive` came to disagree with `status`.

### Verified through the browser, on a throwaway competition

| | |
|---|---|
| a season with every fixture scored | « Toutes les rencontres ont un résultat », close promoted |
| creating a second season while one runs | allowed, lands *En préparation* |
| opening it while the first is running | refused; the server's French sentence reaches the operator as a toast |
| closing with no reason | submit disabled; enabled once a reason is typed |
| after closing | *Terminée*, and the only verb offered is *Rouvrir la saison* |
| reopening | « ZZ Saison A est rouverte », back to *En cours* |
| deleting an empty season | removed; a season with fixtures has no bin at all |

Also checked on the seeded data: Goma D2, which the Sprint 1 backfill put in `PLANNING`, renders as
pre-season with no close offered; the platform-wide list names the organisation and competition on
each card.

---

### Sprint 3 — item 14, the dashboards

**Three screens, from four.** `OrganiserDashboard` with a `scope` serves `/tenant/dashboard` and
`/league/dashboard`; `ClubDashboard` serves `/team/dashboard`; `PlatformDashboard` serves
`/admin/dashboard`. All four pages are four-line wrappers. 2,000 lines of page component became
three components and one service.

**One endpoint each**, in a new `DashboardModule`, rather than five sequential list calls per
screen. That is a change of kind: the old dashboards could not have shown the number this one leads
with, because no response they made carried it.

#### The number

> **Résultats manquants** — fixtures whose date has passed with no score entered.

It is the first thing on the organiser's screen, and only when it is not zero. On the seeded LIBAGO
it reads **21**, across three competitions, with the eight oldest listed and a line saying the list
is a sample. Oldest first: the fixture that has waited longest is the one a club is asking about,
and it is the one distorting the table.

`getStandingsView` has computed this per league since the standings work; no dashboard showed it.
What they showed was *Ligues · Équipes · Athlètes* — three counts that do not change from one
Saturday to the next — beside a ticket card whose value was the literal `0` and whose trend was the
literal `3.6`.

#### The three phases, on one screen

Each competition is a card, and its season's state decides the body. Verified on the seed, which
after Sprint 1's backfill carries all three at once:

| | |
|---|---|
| **PLANNING** | *« 14 rencontres sont passées sans résultat. La saison s'ouvrira d'elle-même au premier score saisi. »* — plus any blocker: clubs with no players, no fixtures at all |
| **ACTIVE** | played / total with a progress bar, missing results, and *Publier le classement* |
| **COMPLETED** | who finished top, the final table, and one move forward: *Ouvrir la saison suivante* |
| **CANCELED** | says the table does not stand |
| no season | says a competition without one cannot receive a match, and offers to create it |

The pre-season line is the state machine surfaced as a next action: the operator learns that one
typed score starts the season, which is not otherwise discoverable.

#### The club

`ClubDashboard` is a separate component rather than the organiser's at a narrower scope, because a
club asks different questions and administers nothing it can change here except its roster — so it
carries almost no verbs. Rank out of N, points, played/won/lost, a five-match form guide read from
the results themselves, next fixtures and last results. BC Virunga renders as 5th of 10 on 8 PTS,
form V-D-V-V-D.

What it replaces fetched nothing at all: a hardcoded English club called *Lightning Strikers*,
"Premier League Division A · Founded 2018", four invented footballers with goals and assists.

#### The platform

`/admin/dashboard` reported "$89,230 monthly revenue", 324 tenants, four named support tickets and
five services' uptime percentages — 659 lines of arrays written into the component. Elenem charges
nobody, has no ticketing system and no uptime monitor. Not redesigned, per the decision, only made
true: what exists, results recorded this week, and **organisations signed up with no fixture at
all** — the one number on that screen that should make somebody pick up a phone.

#### A seed bug the new screens exposed

190 completed games were dated in the future, because the seed scored the first N rounds regardless
of whether their dates had passed. Every one of them was a « Demain 16:10 · 78 – 67 » under a club's
*Derniers résultats*, and none counted as an overdue result on the organiser's. `seed-dev.mjs` now
scores only fixtures that have actually happened. **Not verified end to end** — reseeding would have
destroyed data in use.

---

## 7. Verified by running it

- Six seeded seasons, all `ACTIVE`, one per league — the product has never been in another state.
- Every status reachable from every other by `PUT /seasons/:id`: ten jumps, ten 200s.
- A season set to `DELETED` by PUT still returns from `GET`, is still `currentSeasonId`, and still
  accepts fixtures.
- Creating a second season moves `currentSeasonId` to it; new fixtures land there; the default
  standings view returns the new season's empty table.
- `POST /calendar/publish { seasonId: <a COMPLETED season> }` returned `createdCount: 1` and wrote
  the fixture into a different season.
- Season refusals come back in English: *"Cannot create a new season. The league already has an
  active season (PLANNING, SCHEDULED, ACTIVE, or PAUSED)."*
- `GET /games?status=SCHEDULED&status=LIVE` → 400; the league dashboard's fixture panel is
  permanently empty.
- A team admin has zero sidebar links on `/team/dashboard`, `/team/standings` and `/team/roster`.
- `/tenant/admin/add` and `/tenant/seasons` are linked from live screens and do not exist.

Done on a throwaway organisation created for the purpose and deleted afterwards; the seeded data was
verified unchanged (6 seasons, 90/136/300 fixtures, pointers intact).
