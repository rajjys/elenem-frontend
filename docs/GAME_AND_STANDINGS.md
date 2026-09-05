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

## 3.6 Bands (2026-09-04)

Off by default, and that is the decision rather than the omission. A green top eight is a promise
the federation has made about its playoff, and LIPROBAKIN's number changes every season (§6, A4) —
shipping a guessed default would put a promise on screen nobody had made.

Stored as **counts, not ranks** (`qualificationCount`, `relegationCount` on `LeagueRules`), because
that is how the rule is stated out loud — "the top eight qualify" — and because it stays correct
when a club withdraws mid-season. Read against the table's own length, so four relegation places in
a league of six colour the bottom four rather than everything below rank two. Where the two would
meet in a short table, qualification wins: telling a club it is both through to the playoff and
going down is worse than telling it neither.

Rendered as a stripe on the rank cell, not a wash over the row — the row already carries the
reader's own club, and two full-width tints fighting each other is how a table stops being
readable. It is also how the published bulletin marks it. The legend appears only when a band
exists; a coloured stripe with no key is decoration.

## 3.7 The rules screen, and why saving does not recalculate

`/league/settings/rules` was a stub rendering the words "Rules Settings Page". It now sets the
ranking metric, the points per outcome, the tie-break order and the bands — with the points rule
previewed live in the same words the table will state it.

**Saving does not recalculate.** Changing what a win is worth invalidates every row of every season
this competition has played, and quietly rewriting history because somebody opened a settings
screen is precisely what this product exists not to do. The screen says the table is now stale and
offers the rebuild as a second, deliberate act.

The rules live on the standings surface rather than in `PUT /leagues/:id/settings`, which can also
write `LeagueRules` as part of a blob no screen uses. Two writers is drift; if that endpoint ever
gets a UI, its rules half should defer here rather than grow a second set of defaults.

---

## 3.8 The export (2026-09-04)

The artefact the module exists to replace. LIPROBAKIN's committee computes the table by hand,
sends it to a designer, and the designer rebuilds it in Photoshop for social media — **every
matchday**. Removing the hand calculation was the first half; this is the half that makes switching
obvious rather than merely helpful.

**Two outputs, because two different people want them.**

- **PDF, through the browser's own print.** Not generated on the server, and the reason is the
  requirement: what the operator adjusts has to be what comes out. A server-rendered PDF means
  tuning fields blind and downloading to find out. The type also stays vector and selectable, which
  a raster PDF (`html2canvas` + `jsPDF`) would lose on a document that gets signed — and it keeps
  Chromium out of a deployment headed for Railway.
- **Excel, from the server**, for whoever wants to *work* with the numbers: real numeric cells, one
  row per club, nothing merged in the way of a sort. No formulas — working the table out is what
  they are paying us to stop doing, and a workbook that recomputed it would drift from the product
  the first time a rule changed.

**One renderer.** `StandingsDocument` is both the preview and the print, so "customisable" means
something: there is no second implementation to drift.

### The document surface

A printed bulletin is on white paper whatever the reader's screen is set to. Using tokens directly
would have previewed dark and printed dark-on-white with inverted bands; using raw hex in the
component would have put the palette back into a screen, against the standing rule.

So `[data-surface="document"]` re-declares the light token values on itself, in `globals.css`. It is
a **surface**, not an escape hatch — components inside it keep using tokens, which is the point.
The print rules live beside it (`[data-print-target]`, `[data-print-hide]`), so the next printable
document does not reinvent them.

### What the reference bulletins changed (2026-09-05)

`docs/Homologation, classement et calendrier.pdf` is EUBAGO's own notification, and it is not "a
table with a title" — it is a **formal act of a committee**:

- a **letterhead** naming the chain of bodies, Republic down to urban entente;
- a **reference number** (`NOTIFICATION N° 006/EUBAGO/10-1/CE/2026`), because it is filed and cited;
- an **object** line and a **preamble** citing the articles of the regulation the ranking is made
  under;
- the table;
- **two signatures** side by side, over stamps.

None of that is decoration. It is what makes the sheet an official document rather than a
screenshot, and reproducing it is the reason a league would stop sending the numbers to a designer.
Each is a field the organisation fills in once.

Not reproduced: the per-matchday breakdown of PM and PE (columns 1…5 under each). It is the same
information our `P.M`/`P.E` totals carry, spread across five columns, and we do not store results
by round. Worth revisiting if they ask.

### Three bugs the first version shipped with

- **The print printed the form.** `@page` nested inside `@media print` makes Lightning CSS — which
  Tailwind v4 parses this file with — drop the *entire* media block. Silently: nothing warned, and
  the rule simply was not in `document.styleSheets`. `@page` sits at the top level now. The lesson
  is narrower than it looks: *verifying that an element renders is not verifying that printing
  works*, and only `page.pdf()` or `emulateMedia('print')` tells you.
- **The signature was pinned to the foot of an A4 sheet**, so a ten-row table printed with a hand's
  width of nothing in the middle. The document's height is its content's.
- **The app's canvas printed as a grey block** filling the rest of the page below a short document.
  Paper is white; `@media print` says so.

`@page` also carries `margin: 0`, because the document has its own 14mm padding. A page margin on
top of it would quietly print narrower than what was approved on screen, which breaks the only
promise this screen makes.

### Smaller decisions

- The footer names the **organisation**, not the competition. The bulletin signs off "Pour la
  LIPROBAKIN"; an earlier draft reached for the league's name and printed "Pour la Championnat Goma
  D1 Messieurs", wrong about the body and wrong about the article. `getStandingsView` now carries
  the organisation's name, crest and town.
- The signature block sits at the **foot of the page**, with room for a signature and a seal
  between the title and the name. A block with no gap makes a document look unsignable.
- Alternate row tinting, because a fifteen-row table on paper without one gets read across the
  wrong line — the commonest complaint about a printed standings sheet.
- The fields are remembered **per competition in `localStorage`**. The same secretary signs the same
  way every Saturday, and retyping their own name fifteen times a season is the friction that sends
  somebody back to Photoshop. Server-side persistence belongs with export templates, later.

---

## 4. Not built, and why

- ~~PNG for WhatsApp~~ — **built.** One tall image rather than paginated pages, because the
  destination is a phone: a photo scrolls and a two-page attachment does not get opened. Rasterised
  by `html-to-image` from the very node on screen, at 2× so it survives being zoomed into.
- **Export templates on the server.** The signature and city live in the browser, which loses them
  when the operator changes machine. One field's worth of retyping, and the right home is a
  per-organisation template rather than a column bolted to `LeagueRules`.
- **Lineups submitted before a match.** Appearances are recorded (§1.5); a *lineup* — a club
  declaring its squad in advance — is a different feature and nobody has asked for it.
- **Long rosters.** A youth club with twenty-five registered players gets twenty-five ticked rows
  and has to untick the seventeen who did not travel. Fine at LIPROBAKIN's roster sizes and wrong
  at a youth league's; the fix when it is needed is probably to default the ticks off and let the
  first typed number tick the row, which is already the behaviour.

## 5. Answered

**The women's Héritage row** — 2W/14L/3FI published as 13 where the formula gives 15 — is an
arithmetic slip in the hand calculation, not a deduction. The export does not need a manual
adjustment column, and the row is a fair example of the thing this product exists to end.

---

## 6. The sheet, second pass (2026-09-04)

### 6.1 The bug that mattered most

Adding a player wiped everything typed so far. The sheet reseeded its whole draft from every server
response, and adding a name refetches — so the one action a long entry session needs most often
silently erased the entry session.

The draft is seeded **once** now and *reconciled* against later responses: names that are new
appear, and nothing already on screen is touched. Worth stating as a rule, because the same shape
will recur wherever a form both reads and writes the same resource: **a refetch may add to a
draft; it may never overwrite it.**

### 6.2 Nothing is written when nothing changed

`Enregistrer` and `Corriger le score` fired a write and a success toast whether or not a digit had
moved — a lie about what just happened, and an audit entry saying the score was corrected to the
value it already had. Both compare against the state the dialog *opened* in, which is also why
opening a fresh sheet (where every player starts ticked) and closing it counts as no change.

### 6.3 Who played

A squad of twenty turns up eight strong, and a player who took the floor and neither scored nor
fouled was indistinguishable from one who stayed at home: both produced no row. **The row is the
appearance.** A line of zeroes is now a meaningful statement.

Numbers imply presence, so typing one ticks the box; the reverse does not hold, so unticking clears
the numbers rather than leaving the sheet holding figures for a player it also says was absent.

The whole roster starts ticked on a sheet nobody has filled in — the list *is* the squad that was
submitted, so "everyone played" is the right first guess at LIPROBAKIN's roster sizes and the
operator unticks the absentees.

### 6.4 A name typed twice is one person

The sheet can add a player in four keystrokes, which is exactly why it needed a guard: the fastest
way to enter a roster is the fastest way to acquire the same human twice. The two cases that
actually happen are *already on this team* (somebody did not scroll) and *on another team* (a
transfer nobody told the product about) — and both have a better answer than a second record. The
add is refused with the matches and their clubs, offering **Transférer ici**; `force: true` is the
deliberate override.

Matched on accent- and case-folded names in JS rather than in SQL, because the database runs under
C collation and `mode: 'insensitive'` is accent-blind there — Kasereka and Kaséréka would compare
as two people.

---

## 7. The match page, second pass (2026-09-04)

The first version was the calendar's parts on a wider background: a scoreboard, a sheet, a
collapsible and a rail of buttons, in the order they were built.

**Tabs**, because the questions arrive in three kinds: *Aperçu* (the facts, and once a sheet exists
the top scorer and a column-by-column comparison), *Feuille de match*, *Historique*.

**The history is sentences.** "Match déplacé — de samedi 3 octobre à 14:30 à dimanche 4 octobre à
16:10", the actor, and the reason quoted. It is read by a secretary answering a club, and
`SCORE_CORRECTED` over a JSON blob is not a sentence they can repeat. Game creation is audited now
too — every other change was, so the trail on a match moved twice began mid-story.

**The actions are separated.** Reporting, cancelling and deleting are three consequences: one keeps
the match and loses its date, one voids it, one removes it from the season. The calendar stacks
them behind one entry because it has room for one; here each is its own line with its consequence
in four words, and each dialog asks for the reason the club is owed.

**The breadcrumb names the match, not the kind.** `LIBAGO › D1 M › ASG – HIM` rather than
`… › Match` — the last crumb should be the one thing that distinguishes this page from every other
page of its kind. Ancestor links also drop a `ctx` parameter the reader's own token already
implies: LIBAGO's own admin was being handed a twenty-five-character identifier in a link they
might well copy and send.
