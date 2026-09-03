# The match page, the scoresheet, and the standings screen

> Written 2026-09-03, alongside the work. Companion to `ROADMAP_V2.md` (Phase 3 items 11, 12, 13)
> and `CALENDAR_MODULE.md`. Where this and the roadmap disagree, this wins for these three screens.

---

## 0. The question underneath all of it

**We are one customer into a multi-sport product, and every screen we build is a chance to
accidentally become a basketball product.**

The box score made that concrete. `threePointers`, `twoPointers` and `freeThrows` were Prisma
columns, DTO fields, service arithmetic and three headers in a dialog. Nothing was *wrong* — it was
exactly what LIPROBAKIN's officials write on their FIBA sheet. But a volleyball league would have
needed a migration to record a single number, and the fourth column basketball itself wants
(fouls) would have deepened the same hole rather than exposing it.

The rule that comes out of it, and that the rest of this document applies:

> **A sport's vocabulary is data. A sport's arithmetic is one function.**

Not a plugin system, not a rules engine — a table of column definitions and a weighted sum. The
cost of writing it down properly was about an hour; the cost of not doing so compounds with every
screen that reads a stat.

---

## 1. The scoresheet

### 1.1 Columns are declared, not written

`src/sport-rules/utils/sport-stat-columns.ts` gives each sport its columns: a stable `code`, a
French `label`, a short `abbr`, a `weight`, a `max`, and a group. `PlayerGameStat.stats` is a JSON
map keyed by those codes. The API returns the column list beside the rosters; the dialog renders
whatever it is handed. The client contains no sport-specific string at all — including the sentence
explaining the scoring rule, which is built from the same weights.

Two properties do the real work:

- **`weight: 0` records without scoring.** This is what let fouls arrive without a schema change,
  and it separates *what we track* from *what counts*. Assists and cards land the same way.
- **`reconcilesWithFinalScore` is per sport.** Summing the sheet and comparing it to the result is
  the officials' own last check in basketball and football. In volleyball the result is *sets*, so
  the same check would report a discrepancy on every correctly-entered sheet. A check that cries
  wolf is worse than no check, so the sport says whether it applies.

Sports nobody has asked for get an empty column list, which the UI reads as "no sheet here yet"
rather than offering basketball's columns to a golf league.

These are code constants rather than rows in a table, deliberately. They are the sport's shape.
The things a *league* genuinely varies — points for a win, tie-break order — already live in
`LeagueRules`.

### 1.2 It opens after the final whistle

Typing up a scoresheet is administrative work done after the game, often days after. The button
now waits for a played fixture and the server refuses one anyway, in French, saying what to do
instead. Before the match the slot is empty — lineups would live there, and remain unasked-for.

### 1.3 A name can be added from the sheet

The omission that made the whole screen unusable in the situation it exists for. Rosters in this
market are not finished when the season starts: clubs are still recruiting in the opening weeks,
and in youth competitions the squad is known on the morning of the game. A sheet that can only name
players registered in advance is a sheet that does not get typed up.

`POST /games/:id/box-score/players` takes what the paper carries — a family name, optionally a
given name, a shirt number and a position. Deliberately **not** `POST /players`, which wants a
tenant, a league and a sport the operator has no reason to know and the client would have to
assemble and could get wrong. The game supplies all three and bounds the team to the two playing,
so the endpoint cannot reach into a third club. The roster row itself is `PlayersService`'
job — the collision-safe slug and the club membership must not drift between the places a name
arrives.

The form stays open and clears after each save, because a squad arrives as a list.

### 1.4 Naming

The drawer offered **"Feuille de match"** and, directly beneath it, **"Fiche complète du match"** —
two near-identical French phrases, one opening a dialog and one leaving the calendar for a route
with no page.

The sheet keeps its name. "Feuille de match" is what the paper in the operator's hand is called;
inventing a better term than the customer's own is a way of being wrong in a way they cannot tell
you about. It gains a caption — *points par joueur* — and the other link says **where it goes**:
**"Ouvrir la page du match"**. One change instead of two.

---

## 2. `/game/[gameId]`

### 2.1 Why a page exists at all

The calendar's day panel already scores, moves, corrects and deletes a fixture without leaving the
grid, and that was the right call (`CALENDAR_MODULE` §8). So a match page has to justify itself.
Three reasons, and it is scoped to exactly these:

1. It is the **shareable address** of a match. A link into a 22rem drawer is not something you can
   send someone.
2. It has **room the drawer does not**. The scoresheet is five columns across two rosters; on the
   calendar it must overlay the grid as a dialog, here it is simply the content.
3. It shows **what happened to this fixture** — the audit trail, the answer to "why is this on
   Sunday now", which existed only inside a collapsible inside the editor dialog: the last place
   somebody asking that question would look.

Everything else it does, it does by mounting the calendar's own `ScoreDialog` and `FixtureDialog`.
A fixture must not be movable in two subtly different ways depending on the screen it was found
from.

### 2.2 The route: a path parameter, not `ctxGameId`

The proposal on the table was `/game/dashboard?ctxGameId=…`, on the grounds that a game is one
resource reachable by four roles and the `ctx*Id` model is how this product does that.

The `ctx*Id` model does something narrower than that. It exists so a **set** of pages can share one
scope — `/league/teams`, `/league/players` and `/league/calendar` all meaning the same league. A
match has one page. There is nothing for the parameter to be shared with, and `scope.gameId` was
being computed and read by nothing.

What actually buys "one UI for every role" is that the **server resolves the resource and attaches
the permissions** — `_validateUserScope` on a game already knows the tenant, the league and both
clubs. The URL contributes nothing to that.

Meanwhile `/game/abc123` is a link that survives being pasted into WhatsApp, and
`/game/dashboard?ctxGameId=abc123` is not — which matters for a product whose distribution is
people sharing results.

`useScopeContext` reads the id from the path and resolves the chain upward from the game's own
payload, so the breadcrumb reads `LIBAGO › D1 M › Match` with nothing appended.

### 2.3 The chrome belongs to the reader, not to the game

`/season/[seasonId]` and `/post/[postId]` each render a one-item sidebar naming themselves, which
is a menu with nothing in it. Worse, on a leaf it *strands* the reader: every way back into the app
disappears the moment they open a fixture.

So the game's layout renders **the sidebar of whoever is reading** — a league admin keeps the
league's menu, a tenant admin the organisation's, a club admin the club's. Content follows the
resource; navigation follows the role. That is the same split as everywhere else in the product,
stated for the first time.

### 2.4 Retired

- `/game/[gameId]/dashboard` — a live-score console with increment buttons, built for a courtside
  scorer this market does not have (`ROADMAP_V2` §1.2).
- `/game/manage` — rendered the words "Game Management page".
- `/game/create` — a 690-line wizard the calendar's fixture dialog replaced. "Nouveau match" on the
  dashboards now opens the calendar, which is where the rest of that Saturday is visible.

---

## 3. Standings

### 3.1 Who could not see it

A tenant admin had no entry point at all: the page lived under `/league`, nothing in the
organisation's sidebar pointed at it, and reaching it meant knowing to drill into a competition
first. At LIPROBAKIN the person who publishes the table every matchday **is** the tenant's
community manager — so the one screen he needs was the one his sidebar did not have.

A club administrator had the same problem and a worse version of it: where their club stands is the
single fact they open the product for. `/league/*` is gated to competition administrators in the
middleware, so they get `/team/standings` — the same `StandingsView`, on their own surface, with
their row marked.

One component for three scopes, the way `CalendarView` is one component for two.

### 3.2 There is almost nothing to do here, and the design says so

A table is derived from completed games. You cannot edit a row, and a screen implying you can is
lying about where the authority lives. So there is **one** control, it is quiet, and it is for the
single case the engine cannot notice: the point system or the tie-break order changed underneath a
table already computed. Results already recompute rather than accumulate, so *Recalculer* is never
the fix for a row that looks wrong — the fix for that is the result that is wrong.

### 3.3 What the screen owes the reader instead

The artefact this replaces is a table a committee computes by hand and a Secretary signs. A
hand-made table survives because it can be **checked**. So:

- **When it was computed**, stated plainly.
- **How many results it is derived from**, and **how many played fixtures have no result entered**.
  The gap between those two is the honest answer to "why is my club's record wrong", and it was
  invisible. It is the difference between a table that is wrong and a table that is incomplete, and
  only one of those is somebody's fault.
- **The points rule, written out in the table's own column names**: `PTS = 2 × MG + MP — un FI vaut
  0 point au lieu de 1`. Built from the numbers the engine is using, so it can never describe a
  rule that is not in force — which a hand-written caption eventually would. This is the thing a
  hand-made table has and a generated one usually loses.

### 3.4 Columns are the sport's here too

`MJ · MG · MP · FI · P.M · P.E · +/- · PTS` is LIPROBAKIN's published bulletin, character for
character. A football federation reads `MJ · G · N · P · BP · BC · DB · Pts`. Same eight
quantities, different names — plus one real difference: **basketball has no draws**, so an `N`
column would be zeroes on every row for ever.

`FI` also had to be made real. `LeagueStanding.forfeits` has existed since the model was written
and was never written to, while the points rule is `2·MG + (MP − FI)` — a table that cannot show
forfeits cannot show how its own points were arrived at.

On a phone the table keeps `MJ`, `+/-` and `PTS`. Eight numeric columns at 390px push `PTS` off the
right edge, which puts the one column the reader came for behind a horizontal scroll.

### 3.5 The season is optional

`GET /games/standings/view` defaults to the competition's current season. Not a convenience: a club
administrator is refused by `GET /seasons` — they administer a team, not a competition — so a
screen that had to name a season could not show them the table their own club is in. "The current
one" is what every caller means unless they are offering a season picker.

---

## 4. Not built, and why

- **Qualification and relegation bands.** Needed for the export (roadmap 13), not for reading the
  table. There is no configuration for them yet and inventing a default — "top 8 are green" — would
  put a promise on screen that the competition has not made.
- **The export itself.** Next. The two published images in `docs/` are the pixel target and the
  table now produces every column and every caption they carry.
- **Point system and tie-break editing.** `/league/settings/rules` is still a stub. The values are
  now *displayed* under every table, which is the half that makes the other half safe to build:
  there is somewhere for a change to become visible.
- **Lineups and appearances** (Phase 3 item 12 remainder) — still unasked-for.

## 5. Still to ask the customer

**The women's Héritage row.** 2 wins, 14 losses, 3 forfeits scores 15 under `2·MG + (MP − FI)` and
is published as 13. Every other row in both tables checks out. Either it is a two-point deduction
applied by hand or it is an arithmetic slip, and the answer decides whether the export needs a
manual adjustment column. **Worth asking before the export is built around the formula** — it is a
precise little example of the thing this product exists to end.
