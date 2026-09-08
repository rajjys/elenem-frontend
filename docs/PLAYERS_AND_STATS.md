# Players, the leaderboard, and the twenty pages that render their own name

> Written 2026-09-08, at the opening of Phase 4. Covers items **15**, **16** and **17** of
> `ROADMAP_V2.md` §3, and closes the accent-matching question left open in §12.
> Where this and the roadmap disagree, this wins for these three items.

---

## 0. The finding that decides item 15

**`PlayerSeasonStat` is read in seven places and written in none.**

| Where | What it does | What it does today |
|---|---|---|
| `players.service.ts` ×4 | `include: { playerSeasonStats: { take: 5 } }` on every detail query | returns `[]`, always |
| `players.service.ts:854` | refuses to delete a player who has season stats | never fires |
| `seasons.service.ts:596` | refuses to delete a season that has player stats | never fires |
| `leagues.service.ts` ×3 | counts them for the analytics comparison | reads `0`, always |

Nothing aggregates `PlayerGameStat` into it. So "meilleur marqueur / moyenne par match / matchs
joués" — the four things the owner asked for — have no source today, and two delete guards that
read as safety are decoration.

That is the same fork the team standings faced, and the settled answer there is often quoted as
"recompute, never accumulate". **The precedent is more specific than that, and it matters here:**
the team side *does* keep a stored aggregate (`TeamSeasonStat`, `LeagueStanding`). What it refuses
is accumulation and editing, not storage. So "the standings do it" is not on its own an argument
for a `PlayerSeasonStat`.

The argument has to be made on its own terms, and it comes out the other way.

### 0.1 Why a table earns a stored aggregate and a leaderboard does not

A standings row carries `rank`, and a rank is not a property of a club — it is a property of the
club *relative to every other club*, after tie-breakers that read head-to-head results. You cannot
compute one row without computing all of them, and the answer is read on four dashboards, three
standings screens, the export and the public site. Storing it is how it stays stable between the
screen and the printed sheet somebody signs.

A leaderboard row carries no such thing. `Σ value × weight` over one player's rows is complete on
its own; the ordering is `ORDER BY`, and nobody signs it. It is one `GROUP BY` over a table that is
already keyed the right way.

### 0.2 The arithmetic, at this customer's scale

LIPROBAKIN's larger championship is 25 clubs, one leg — 300 fixtures, twelve players a side, so
about **7 000 `PlayerGameStat` rows in a full season**. The seeded database has 55, across three
games out of 256 completed. Scanning 7 000 rows keyed by `gameId` and reducing them in JS is
sub-millisecond work. There is no performance argument for the second table, and there will not be
one for several years.

### 0.3 The decisive argument: it cannot express the scope the screen needs

`PlayerSeasonStat` is keyed `@@unique([playerId, seasonId, teamId])`. The leaderboard has to be
filterable by **phase** — Goma D1 Messieurs is running « Saison régulière → Phase de 6 →
Demi-finales → Finales » right now. Keeping the table means re-keying it to `stageId` the way
`LeagueStanding` was in Sprint A: a migration, a backfill, and a recompute hook — paid in full, to
store something that has never held a row.

And the hook is not one hook. `PlayerGameStat` is written by `deleteMany` + `create` in
`box-score.service.ts`, and it would also have to be recomputed when a game is deleted, when a
result is corrected, when a game is reverted out of `COMPLETED`, and when a player is transferred
between clubs mid-season. Each of those is a place a second source of truth can quietly disagree
with the sheet it came from — on a product whose whole claim is a record nobody disputes.

> ### Decision 1 — `PlayerSeasonStat` is deleted.
>
> A player's season line is derived from `PlayerGameStat`, the way it is derived on their own page
> and in the box score's own totals. One source of truth, no hook, no backfill, no drift.
>
> The two delete guards that read it go with it. The player guard already checks
> `playerGameStat` on the line above, so it loses nothing; the season guard is covered by its
> `teamSeasonStat` and `leagueStanding` checks, which fire on any season that has been played into.
> The analytics counts become `playerGameStat` counts, which is the number they were always
> reaching for.

### 0.4 `minutesPlayed` is deleted too

It exists on both stat models. Nothing in `src/` reads or writes either one — the string appears
nowhere outside `schema.prisma`.

It is also the exact shape of the mistake `GAME_AND_STANDINGS` §0 was written about: a typed column
for one sport's quantity, sitting beside the mechanism that replaced typed columns. If a league
ever wants minutes, it is four lines in `sport-stat-columns.ts` with `weight: 0` — recorded,
scoring nothing — and no migration.

---

## 1. What the leaderboard is, and the one place I disagree with the handover

### 1.1 One sortable table is all four of the owner's asks

> *"a stats page as well for players — best scorer, ppg, volume 3, matches played"*

Four leaderboards, as stated. But `sport-stat-columns.ts` already declares what basketball records
(`FG3 · FG2 · FT · PF`), what each unit is worth, and what the total is called. So the screen is:

```
#   Joueur          Club     MJ   3 pts   2 pts   LF   Ftes   Pts   Moy.
```

— every column sortable, ordered by `Pts` descending on open. *Best scorer* is the default sort,
*volume 3* is a click on `3 pts`, *matches played* is a click on `MJ`, *PPG* is a click on `Moy.`
And the same screen, in a football league, is `Buts · PD · CJ · CR` with no code change, because
the column list arrives from the server the way it already does for the scoresheet.

Asking for four screens and building one is not a shortcut here — it is the §0 rule applied. Four
hardcoded leaderboards would each name a basketball statistic.

### 1.2 Where the handover is wrong: the leaderboard is season-first, not stage-only

The handover says the leaderboard "belongs to a **stage**, not a season, for exactly the reason a
table does". The reason a table belongs to a stage is that **a table is the instrument that decides
who advances** — pooling regular-season results into the *phase de 6* table would corrupt the thing
the competition is settled by. That reason does not transfer. A leaderboard decides nothing.

And the question a league actually asks is *"who was the best scorer this season"*, not *"who was
the best scorer in the semi-finals"*. The award, if there is one, is for the season.

> ### Decision 2 — the leaderboard defaults to the whole season, with the same phase switcher the
> table has.
>
> `Toute la saison` is the first option and the default. Each phase follows it, in order. The
> switcher appears only when the season has more than one phase — the same rule
> `standings-view.tsx` already applies to its season picker, so every competition with a single
> `LEAGUE` phase sees no control at all.
>
> Unlike the table, a `KNOCKOUT` phase is offered: points scored in a final are points scored, and
> `StageFormat` only governs whether a phase yields a *table*.

### 1.3 A minimum, or the per-game column is a lie

Sort by `Moy.` with no floor and the leader is whoever played once and scored eleven. So the screen
carries a **`Min. matchs`** field, default `1`, applied to every sort. Visible rather than implicit:
a hidden qualifier is how a leaderboard becomes something to argue about, which is the one thing
this product exists to prevent.

### 1.4 A transfer: the player is one person, the line is one club's

`PlayerGameStat` carries `teamId` per row, which is the right model and already the case — each
line records the shirt they were wearing. So:

- The leaderboard **aggregates by player**, not by `(player, team)`. A scorer who moved clubs in
  February is one scorer.
- The `Club` cell names the club of their **most recent appearance in scope**, and marks it when
  there was more than one.
- The player's own game log shows each game against the club they played it for, so the whole
  history is legible without a second row on the leaderboard.

This is the opposite of what `PlayerSeasonStat`'s `[playerId, seasonId, teamId]` key implied, and
it is a further reason that key was wrong.

### 1.5 The empty state is the honest one, and it will be the common one

Three of 256 completed fixtures in the seeded database have a sheet. That is not a seeding
oversight to paper over — it is what a leaderboard looks like in a league where the community
manager enters final scores from the stands and types up a scoresheet only when someone sends him
a photo (`ROADMAP_V2` §6, A3).

So the screen states **how many of the completed fixtures in scope have a sheet**, the way the
standings screen states `pendingResults`. `4 feuilles sur 27 matchs joués` is the difference
between a leaderboard that is wrong and one that is incomplete, and only one of those is somebody's
fault. Without it, the first thing the owner sees is a top scorer on 38 points and no way to know
why.

`scripts/seed-dev.mjs` also gains box scores on a share of the completed fixtures it scores, so the
screen has something to be right about in development. It does not touch the live tenant.

### 1.6 No export, and the reason is in the reference bulletins

`docs/Homologation, classement et calendrier.pdf` is EUBAGO's own signed notification, and it
carries a letterhead, a reference number, a preamble citing the regulation, the table, and two
signatures over stamps. It carries **no player statistics at all** — not a top scorer, not an
appearance count.

So the leaderboard is an **internal artefact**, not a published one. It gets no
`[data-surface="document"]` treatment, no PDF, no signature block. The standings export earned all
of that by replacing a document a committee signs every matchday; this replaces nothing, because
nothing exists. Revisit the day a league asks to publish one.

---

## 2. The player's own page, and the modal in front of it

Item 15's original wording — *"modal-first: quick view in a dialog with real content; CTA to the
extended page. Most work never leaves the list"* — is right and it is how the calendar's day panel
already behaves.

### 2.1 The dialog

A row in `PlayersListView` becomes clickable, and opens on: photo, name, shirt number, position,
club, competition, and the season line — `MJ`, each of the sport's columns, the total and the
average. Below it, the last five games with their line. Then **« Ouvrir la fiche du joueur »**.

The list keeps its edit and delete buttons; opening the dialog is what clicking the *name* does.
Three surfaces get it at once — `/tenant/players`, `/league/players`, `/team/roster` — because they
are all one component.

### 2.2 `/player/[playerId]`

Identity header, the season line, the same season/phase switcher, and the **game log**: date,
opponent, home or away, the result, their line in the sport's own columns, and a link to
`/game/[gameId]`. Sortable by date descending.

Its chrome follows `GAME_AND_STANDINGS` §2.3 — **the sidebar of whoever is reading**, not a
one-item menu naming the player. A league admin keeps the league's menu; a club admin keeps the
club's. Content follows the resource, navigation follows the role.

The breadcrumb names the player, not the kind: `LIBAGO › D1 M › Kasereka Mumbere`.

### 2.3 `/player` is deleted

There is no list at `/player` — `/tenant/players`, `/league/players` and `/team/roster` are the
three lists, each scoped to a role that has one. `/player/page.tsx` renders the words "Player
Page", is linked from nothing, and would be a fourth list with no scope to be a list *of*.

Same argument that retired `/season` in item 14a: every job it might have held has a better home,
and what is left over is nothing.

---

## 3. Item 16 — twenty pages, and the question is which ones should exist

`components/ui/page-templates.tsx` exports `ListPage`, `DetailPage`, `FormPage` and `EmptyState`.
**Thirty-one routes import nothing from the application at all** — they render a hardcoded string,
usually their own name in English, occasionally « En developpement. Revenez plus tard ».

`ANALYSIS_2026-08` §3.1's rule governs before any of them is built: *a navigation entry may only
exist if its destination renders real content today.* `nav-items.ts` already obeys it — **not one
of the thirty-one is in a sidebar.** They are reachable only by typing the URL, or through the
handful of links listed below.

So the work is mostly deletion, and the question for each is: **is anything pointing at it?**

### 3.1 Delete — nothing links to them, and nothing should (12)

| Route | Why |
|---|---|
| `/player` | §2.3 |
| `/coach` | A coach is not a role this product has. `ROADMAP_V2` never mentions one; no endpoint is scoped to `Role.COACH` beyond a read |
| `/tenant/tickets` | A ticketing feature nobody asked for, on a free MVP for Goma |
| `/tenant/analytics`, `/league/analytics`, `/admin/analytics` | Three empty analytics screens. The dashboards *are* the analytics, and item 14 rebuilt them around the number that matters |
| `/admin/announcements`, `/admin/data`, `/admin/settings`, `/admin/roles`, `/admin/users/permissions` | Platform-operator screens for a platform with one operator, who is the person reading this |
| `/team/page.tsx` | A landing page in front of `/team/dashboard`. `/tenant/page.tsx` is the same shape and goes with it |

### 3.2 Build — something links to them today, and it is broken (5)

| Route | Who points at it |
|---|---|
| `/account/profile` | The user menu and the navbar avatar, on every page, for every role |
| `/team/edit` | Nothing links it — and nothing else exists. A club cannot correct its own name |
| `/league/posts`, `/team/posts`, `/admin/posts` | `post/create` **redirects here on success**. Publishing a post today lands the author on « En developpement » |

`/tenant/posts` is real and in the sidebar. The other three are the same list at another scope, so
they are one component, mounted four times, like every other list in this product.

#### Corrected while building: two of the four "edit" stubs are duplicates, not gaps

`/tenant/edit` and `/league/edit/[leagueId]` were on the build list until the code was opened.
**`/tenant/settings` already edits the organisation** — name and business profile — and
**`/league/settings/general` already edits the competition** — name, division, gender, visibility,
active state and the current season. Building either stub would have been a second editor for a
resource that has one, which is how two screens start disagreeing about what a competition is
called.

So they move to the deletion list, and `leagues-table.tsx`'s « Modifier » action — the only link
either of them had — now points at `/league/settings/general`, which works.

**`/team/edit` is the real gap and is built.** The organisation has a settings screen and a
competition has one; a club has neither, so a club that spelt its own name wrong at registration had
no way to correct it and no way to set a crest. Scoped to the four fields
`UpdateTeamProfileByTaDto` lets a club administrator change — status, visibility, the competition
and the home venue are a league administrator's, and the DTO says so.

### 3.3 Phase 5, with the rest of the public side (6)

`/about`, `/api`, `/docs`, `/legal`, `/terms` (linked from `PublicFooter`), and `/(public)/standings`
and `/(public)/teams` and `/(public)/leagues` (the root-domain marketing pages). Plus
`public_tenant/.../playoff`, `.../stats`, `.../players`, `.../news`.

These are the public site, and the public site is item 19. Building them now would be building them
twice. What they get in this phase is **a single honest placeholder component** rather than nine
different English strings — one line each, in French, saying the page is coming with the public
launch. That is not a nav promise: nothing in an authenticated sidebar points at them, and the
footer links are the site's own furniture.

> ### Decision 3 — item 16 is fourteen deletions, five builds and one shared placeholder.
>
> Not "twenty pages onto the templates". Twelve routes had nothing behind them and nothing pointing
> at them; two more turned out to duplicate a screen that already works.

---

## 4. Item 17 — S3

After 15 and 16, before Phase 5, because the public site cannot ship without crests and photos
(`ROADMAP_V2` §1.3). `utils/upload.ts` already carries the presigned-PUT path and the codebase's
one deliberate `eslint-disable` — a presigned upload must not carry our `Authorization` header,
because signing the URL *is* the authorisation.

Scoped to what the product renders today: the organisation crest (which the standings export
already reads), club logos, and player photos (which §2.1's dialog is built around). Written up
when it starts.

---

## 5. Accent-blind matching: the framing in `ROADMAP_V2` §12 was wrong

§12 filed this as "a deploy-time collation decision". It is not one, and the verification says so.
On this machine (Postgres 18.4, database collation `C`, provider `c`):

| | |
|---|---|
| `'Kaséréka' ILIKE '%kasereka%'` under `C` | **false** |
| the same under `fr-FR-x-icu` | **still false** — no ordinary collation folds accents |
| `unaccent('Kaséréka') ILIKE unaccent('%kasereka%')` | true |
| `'Kaséréka' = 'kasereka' COLLATE fold` (ICU, `und-u-ks-level1`, `deterministic=false`) | true |
| `LIKE` with that collation | **works** — new in Postgres 18; impossible before |
| `ILIKE` with that collation | **ERROR: nondeterministic collations are not supported for ILIKE** |

The last row is the whole problem, because Prisma's `mode: 'insensitive'` emits `ILIKE`. There are
now **59 of them across 17 service files** — the handover counted 51 across 13 a fortnight ago, so
the number is *growing*, which is itself an argument.

- **(a) Non-deterministic ICU collation.** Elegant, and Postgres 18 finally makes `LIKE` work with
  it. But all 59 must lose `mode: 'insensitive'` or throw; a single one missed turns a cosmetic
  miss into a runtime **500**; Prisma has no schema-level collation support, so it lives in a
  hand-written migration that fights the `migrate diff` baseline rule; and every index on those
  columns is rebuilt. **Recommended against, explicitly.** For a free launch it converts a cosmetic
  defect into a crash surface, and the 59 grows every sprint.
- **(b) `unaccent` + expression indexes.** Needs `$queryRaw` for every affected search, losing
  Prisma's composition — and these queries `AND` in the role-scope filters. Hand-rewriting 59 of
  those is where a tenant-isolation bug gets born. **No.**
- **(c) A folded shadow column.** `Player.searchName` and `Team.searchName`, written beside the
  slug — which every write path already computes — and searched with an ordinary `contains`.
  Prisma-native, ordinarily indexable, no raw SQL, no collation, no drift. The folding function
  already exists at `box-score.service.ts:25`, where it guards against the same human typing the
  same name two ways.
- **(d) Leave it.** Case-insensitivity already works. Only accents fail to fold, and the one place
  it is correctness-critical — a name typed twice on a scoresheet — is already handled in JS
  (`GAME_AND_STANDINGS` §6.4).

> ### Decision 4 — (d). Left as it is, for the free launch.
>
> **Decided 2026-09-08 by the owner, against the recommendation above, and the reasoning holds up.**
> The defect is cosmetic and it is bounded: case-insensitivity already works, so the search box
> fails only on the accent, and only for somebody who types one when the record does not (or the
> reverse). The one place folding is *correctness*-critical — the same human entered twice on a
> scoresheet — is already handled in JS at `box-score.service.ts:25` (`GAME_AND_STANDINGS` §6.4),
> and that is the case that costs a league its record.
>
> What (c) would have bought is half a day of nicer search on a screen the launch does not turn on.
> What it would have cost is two columns, a backfill migration, and a synchronisation rule that
> every future write path has to remember — on a repo whose standing convention is that a derived
> value is derived. Given the launch is free and two weeks out, this is the right trade.
>
> **Revisit when** a roster passes a few hundred names in one competition and somebody complains
> that search cannot find them. `Player.searchName` remains the answer; nothing here forecloses it,
> and this section is the write-up.
>
> Explicitly **not** revisited: option (a). It converts a cosmetic miss into a runtime 500 across
> a call-site count that has grown from 51 to 59 in a fortnight.

---

## 6. The sprints

Each ends with something verifiable in the running app, against the live tenant's own data where it
is safe to read and an isolated `ZZT…` tenant where it is not.

### Sprint A — the model, and the endpoint

`PlayerSeasonStat` and `minutesPlayed` deleted, with the dead guards and analytics counts they fed.
`GET /players/stats/leaderboard` and `GET /players/:playerId/stats`, both resolving league, season
and phase server-side the way `getStandingsView` does — because a club administrator is refused
`GET /seasons` and `GET /leagues/:id` by design, and a screen that had to name a season could not
show them their own players. Backend tests for the aggregation, the phase filter and the minimum.

*Done when:* the endpoints answer correctly for all four roles, `migrate diff` returns 0, and the
suite is green.

### Sprint B — the screens

`PlayerStatsView`, one component for three scopes, mounted at `/tenant/stats`, `/league/stats` and
`/team/stats`, in the shape `StandingsView` established. `PlayerQuickView` on the three list
surfaces. `/player/[playerId]` with the game log. `/player` deleted. Three sidebar entries, added
only once the pages render real content.

*Done when:* every one is verified in the browser for all four roles, with no 4xx and no page
error, and the empty-state count reads correctly on a competition with no sheets.

### Sprint C — item 16

The twelve deletions, the five builds, the shared placeholder. No accent work: §5's Decision 4
leaves it.

*Done when:* no route renders an English string naming itself, every link that pointed at a stub
now reaches a page, and lint and typecheck are at zero in both repos.

### Sprint D — item 17

S3. Written up when it starts.

---

## 7. Sprints A, B and C, as built (2026-09-08)

### The proof it was worth doing

The leaderboard on Goma D1 Messieurs, opened as its league administrator, reads:

```
3 feuilles de match sur 27 matchs joués. Les autres n'ont qu'un score final. Ouvrir le calendrier

#   Joueur              Club            MJ   3 PTS  2 PTS  LF  FTES   PTS↓  MOY.
1   Josue Muhindo #4    Nyiragongo BC   2    6      7      2   6      34    17.0
2   Fiston Furaha #5    Nyiragongo BC   2    5      5      4   4      29    14.5
3   Grace Zawadi #8     Katindo BC      1    3      4      2   2      19    19.0
```

Every one of those numbers already existed in the database and no screen had ever shown one.

### What Sprint A did

- **`PlayerSeasonStat` dropped**, with `PlayerGameStat.minutesPlayed`. The table was empty in every
  database it has ever existed in, so the migration lost nothing.
- **Two dead guards made real.** `seasons.service.ts` refused to delete a season with player
  statistics and had never once fired; it counts `PlayerGameStat` now, which is what a season
  actually accumulates. `players.service.ts` lost its duplicate check — the line above it already
  counted the right table.
- **`participatingPlayerCount` is no longer permanently zero.** Its own comment says "players that
  played at least one game this season" and it counted a table nothing wrote. It is a distinct count
  over the scoresheets, which is that sentence.
- **`assertCanReadLeague` extracted** to `common/permissions/league-access.ts` and shared with
  `StandingsService`. The leaderboard and the table ask the identical question of the identical
  reader; two copies is how one of them ends up answering differently.
- `GET /players/stats/leaderboard` and `GET /players/:playerId/stats`, with **15 tests**.

### What Sprint B did

`PlayerStatsView` at `/tenant/stats`, `/league/stats` and `/team/stats`; `PlayerQuickView` behind
every name on all three roster surfaces; `/player/[playerId]` with the game log; `/player` deleted.
Three sidebar entries, added only once the pages rendered real content.

The club's screen opens on its own players and carries a **« Mon club » / « Tout le championnat »**
toggle. §1.4 claimed the filter did not lock them in; without the toggle that claim was false, since
a club administrator has no other control to clear.

### What Sprint C did

Fourteen deletions, five builds, one shared placeholder across nine public routes, and one link
repointed. `/post/create` no longer redirects anybody onto « En developpement ».

The posts list was rebuilt on React Query as one component for four scopes rather than copied to
three more routes: it was the last `useState` + `useEffect` + bare `api.get` list in the app, and
spreading that shape would have been the wrong way to fix a broken redirect.

### Found by using it

- **A Radix `Select.Item` refuses `value=""`.** « Toute la saison » as the empty string threw on
  first render — the whole screen replaced by an error boundary. An empty string is how a Select is
  *cleared*, so an option carrying one is indistinguishable from no selection. The sentinel lives on
  the client; the server still receives an omitted `stageId`.
- **A hardcoded « Retour aux joueurs » would have refused two roles.** `/league/*` is gated to
  competition administrators in the middleware, so the player page's back link is resolved from the
  reader's role — and omitted for a system administrator, who has no roster screen at all. A back
  link that refuses you is worse than none.
- **Three of 256 completed fixtures had a sheet**, which is why §1.5's coverage statement exists.
  The seed now types one up on roughly one game in three, and every seeded sheet reconciles exactly
  with its final score (verified: 34 of 34 team-sides on a throwaway database).

### Verified

- Backend suite **130 passing, 0 failing** (115 before, plus 15).
- Frontend lint **0 problems**; both repos typecheck clean. The four new backend files add **0** to
  the backend's pre-existing lint count.
- Migration baseline **0**.
- Every new and changed screen opened in the real browser as all four roles: **no 4xx, no page
  error.** Tenant isolation confirmed at the endpoint — LIPROBAKIN's administrators are refused
  LIBAGO's leaderboard in French, and LIBAGO's club administrator is allowed it.
- **The owner's data is untouched.** `PlayerGameStat` 55, `Player` 706, `LeagueStanding` 64 —
  identical before and after. The seed change was verified on a throwaway database (a second API on
  :3334 against `elenem_seedcheck`), which was dropped afterwards.
