# The Calendar Module — design and plan

> Written 2026-08-30, before any code. This is the module we agreed not to rush: the most complex
> and the most political in the product.
>
> Companion to `ROADMAP_V2.md` (which schedules it as Phase 2 item 3c and Phase 3 items 10–11).
> Where the two disagree, this document wins for the calendar specifically.

---

## 0. The one thing that must not be forgotten

**The first user of this module is not the person who decides the calendar.**

On day one at LIPROBAKIN the operator is a community manager. He is not in the room where the
fixture list is agreed. The calendar is decided elsewhere — a committee, a WhatsApp group, a sheet
of paper — and reaches him as a **final draft** he must publish, plus **results** he must record.

Everything below follows from this. Concretely:

- **Recording a calendar decided elsewhere is a first-class path, not a fallback.** It gets the
  same design attention as generating one. If the module only generates, our first customer cannot
  use it at all.
- **Generation is the second act.** It becomes valuable when a league decides Elenem is where the
  calendar lives — which is a decision about trust and internal politics, not about features.
- **Nothing may require authority the operator does not have.** No step may block on "confirm the
  venue allocation" if he cannot confirm anything.

The module therefore has two front doors into the same calendar:

| Door | Who | What they do |
|---|---|---|
| **Record** | community manager, day one | Type or import the fixtures already agreed. Enter results. |
| **Generate** | league secretary, later | Draft a fixture list from teams + rules, study it, publish it. |

A single `Game` table underneath. The generator writes drafts; the recorder writes facts. Both end
as the same published fixture.

---

## 1. Where it lives, and why not on the season

An earlier proposal put this at `/season/fixtures?ctxSeasonId=…`. **That was wrong**, and the
reason is worth keeping written down:

`Season` belongs to a `League`. A season-scoped screen can therefore only ever show one
competition. But the thing actually being done is **allocating shared halls and shared matchdays
across every competition at once** — LIPROBAKIN's men's, women's and D2 share one calendar. A
per-season screen forces: generate men's → look → generate women's → discover the clash → go back.

**The calendar is a tenant-level object.** One physical Saturday in one hall is a single resource
regardless of how many competitions want it.

```
/calendar                      the tenant's calendar, all competitions
/calendar/generate             the draft workspace
/calendar/import               record a calendar decided elsewhere
```

The screen takes a **set of seasons** as input, never exactly one.

### Permission is a separate axis from scope

The hard question was: should the generator know about men's/women's/D2 together, given that one
day those might be run by different people?

The resolution: **conflict detection is always tenant-wide; generation scope is a permission
question.** These are different things and conflating them is what made the question feel hard.

- Conflict detection already spans leagues (shipped in `feat(venues)`, `6186e43`). A D2 manager
  who cannot see D1 still gets refused a hall D1 has booked. This is the floor and it never
  changes.
- Generation takes `seasonIds[]`. A tenant admin passes three; a D2 admin passes one. The engine
  does not care why it got the list.
- A competition you cannot edit appears on the calendar as **busy/free**, never as fixtures with
  handles on them.

So independence costs us a read-permission on the calendar view, not a different engine. **Deferred
past V1** — LIPROBAKIN has one operator today — but the shape is chosen so it does not require a
rewrite.

---

## 2. What makes a calendar valid here

Gathered from the customer conversations; this is the domain, not a wish list.

### 2.1 Slots are derived from game length, not fixed

If the first game is at 13:30 and a game averages 90 minutes, the day's slots are 13:30, 15:00,
16:30, 18:00… The organiser sets **average game duration** and the day's **opening window**; the
slots fall out. Two or three games per day per hall is the normal shape.

Basketball is not 120 minutes despite the current `DEFAULT_GAME_MINUTES = 120` constant — 4×10
plus stoppages runs closer to 100. **Duration must be an input, defaulted per sport, not a
hard-coded buffer.** (`venue-logistics.service.ts` already isolates that constant in one place for
exactly this reason.)

### 2.2 Divisions have priority, and it is about slots

> "You don't set the last game of the day as a D2 while having a D1 at 13:30." — and in Goma, D2
> is planned later but must use the empty slots left by D1 and D1F.

This is **ordered slot allocation**, not optimisation. Competitions are ranked; each takes the best
remaining slots in turn. Two ordered lists and a loop — no solver.

Default order: D1 Messieurs → D1 Dames → D2 → everything else. **Editable**, because that ordering
is a political decision inside the federation and we should not encode ours.

### 2.3 Days of the week differ per competition

D1 plays weekends and Wednesdays; D2 takes whatever is left. So the day-of-week window is **per
competition**, not global.

### 2.4 The venue has its own diary

The hall hosts other events. Blackout dates and opening hours already exist as models
(`VenueAvailability`, `VenueBlackout`) and are already read by `checkVenueAvailability` — they have
simply never had a UI. The calendar must show them as unavailable, not as free.

### 2.5 Match weighting — deliberately NOT in V1

The idea: a #1 vs #20 fixture is worth less than #8 vs #9, so weight fixtures by the standings of
the two teams and spread the good ones.

**Cut, and here is why**, so we do not relitigate it: it needs standings that do not exist in round
one, and a wrong weighting makes the calendar actively worse than no weighting. Manual reordering
in the draft gives most of the value at none of the risk. Revisit when a league asks.

### 2.6 Existing games are inputs, never regenerated

The heart of the engine. Every already-played, live, or scheduled fixture is read as:

- an **occupied slot** (that hall, that hour, is gone), and
- an **existing pairing** (A vs B in this leg already exists, do not create it again).

A league adopting Elenem in February has half a season behind it. Generating over that is the
failure mode that would lose us the customer.

---

## 3. The draft is the product

Nothing is written to `Game` until Publish. The workspace is where the study happens.

**The calendar view** — a month grid; each cell a day; each day its slots; each slot occupied or
free, coloured per competition. This is the "study, draft, analyse, validate" surface. Most of the
design effort belongs here, not in the generator.

**The insight panel** (your idea, and the strongest one in the list). Computed from the draft plus
existing games:

- *"BC Virunga has 11 fixtures, should have 12. Missing: vs AS Vita, vs Chaux Sport."*
- *"VC Manita vs VC Kabasha already exists in this leg — 14 March."* (link to it)
- *"Saturday 21 March 15:00 — no hall free. Three fixtures unplaced."*
- *"Gymnase Tata Raphaël is blacked out 3–7 April; 6 fixtures moved."*

These are the checks a secretary does by hand today. Doing them automatically is the value.

---

## 4. Build order

Slices that are each testable, so we never disappear for a fortnight.

### 4.1 — Calendar view, read-only *(~3 days)* — **shipped**
The month grid over **existing** games. No generation. Immediately useful: it is the first time
anyone can see the tenant's whole calendar. Also the honest first slice for a community manager who
only records.

### 4.2 — Record what was decided elsewhere *(~3 days)* — **shipped**
- Add a fixture to a slot from the calendar.
- **Import completed results from a spreadsheet** — the agreed mid-season path. Upload, review,
  confirm, record. Scoped to *results*, not schedules.
- This is the slice that makes the module usable by our actual first user.

### 4.3 — Generation, single competition *(~4 days)* — **shipped**
Output is a **draft**, never written. Existing games respected as §2.6. Insight panel v1.
See §7 for what actually landed, which differs from this line in one place: the endpoint is
`POST /calendar/draft`, not a flag on the old generator. Reasons in §7.

### 4.4 — Multi-competition, ordered allocation *(~4 days)*
`seasonIds[]` + priority order. The D1 → D1F → D2 pass. Venue placement in the same pass, optional
per fixture.

### 4.5 — Publish, reschedule, audit *(~3 days)*
Commit a draft. Move a fixture with a reason. An audit trail, because the point of the product is
that nobody argues about what changed.

**Total ≈ 17 days.** Not a sprint. Slices 4.1 and 4.2 alone are worth shipping.

---

## 5. Questions, answered 2026-08-30

1. **Spreadsheet shape for 4.2** — there is no existing file and there does not need to be. **We
   design and publish a downloadable template** a league manager can keep the schedule and the
   results in. Primary information only; no formulas, no computed standings — the calculation is
   the thing they are coming to us to stop doing by hand. The template is the contract the
   importer reads.
2. **Venue on a fixture: optional.** Both launch customers use one hall, so requiring it would buy
   nothing and block publishing.
3. **Who may publish a draft** — a tenant admin by default; a league admin publishing their own
   competition is fine when they have only taken empty slots. A 2027 problem, recorded so the
   permission axis in §1 is not designed away in the meantime.
4. **Game duration is settled** — see §2.1 and `common/utils/game-duration.util.ts`. Basketball
   100, football 120, volleyball 100, rugby 110, and so on for every sport in the enum. These are
   slot lengths (warm-up, half-time and changeover included), not playing time, and every one is
   editable on the calendar screen.

---

## 6. Decisions already taken

| Decision | Where |
|---|---|
| Calendar is tenant-level, takes `seasonIds[]` | §1 |
| Conflict detection always tenant-wide; generation scope is a permission | §1 |
| Recording ≠ generating; recording ships first | §0, §4.2 |
| Ordered slot allocation by division priority, editable | §2.2 |
| Match weighting cut from V1 | §2.5 |
| Existing games are inputs, never regenerated | §2.6 |
| Mid-season entry via spreadsheet of completed results | §4.2 |
| Venue placement optional in V1 | §2.4, §4.4 |
| Nothing written until Publish | §3 |
| Import template is ours to design; no existing file to match | §5.1 |
| Game durations are slot lengths, per sport, editable | §2.1, §5.4 |


---

## 7. What 4.3 actually shipped (2026-09-01)

### The endpoint moved, and the `dryRun` flag is gone

The plan said `POST /games/generate-fixtures` would *gain* `gameDurationMinutes` and `dayWindows`.
It did not; it was deleted, and drafting lives at `POST /calendar/draft` with publication at
`POST /calendar/publish`. Two reasons, both worth keeping written down:

- **`dryRun` is a flag you can forget to set, and the cost of forgetting is 132 games written to a
  league's season.** §3 says nothing reaches `Game` until Publish. A boolean that decides whether
  a request is a preview or a permanent act cannot enforce that; two endpoints with two names can.
  The draft endpoint has no code path that writes.
- **The calendar is the tenant-level object and the draft belongs to it.** Leaving generation
  under `/games` re-anchored it to a season, which is exactly the mistake §1 exists to prevent —
  and 4.4's `seasonIds[]` would have had to move it anyway.

The old `FixtureGeneratorService`, its DTO, its controller route and the `/tenant/schedule` and
`/league/schedule` screens are all deleted. `scripts/seed-dev.mjs` now drafts and publishes like a
human does rather than taking a shortcut around the module's own rule.

### Where it lives

```
/tenant/calendar/generate      the draft workspace, whole organisation
/league/calendar/generate      the same component, one competition
```

Under the section, not flat: a workspace is a page, and only an identifiable resource earns a
flat route.

### The draft is drawn on the calendar, not beside it

§3 said most of the design effort belongs in the calendar view, and that turned out to be
literally the right instruction. Draft fixtures are handed to `CalendarView` as ordinary entries
with `status: 'DRAFT'` and drawn as dashed outlines over the fixtures that already exist. Every
behaviour the grid already had — the competition filter, the day panel, the year map, the phone
agenda — works on them without knowing what they are.

A list of matchdays, which is what the old generator produced, cannot answer the question a
fixture list is actually judged on: *does this collide with the calendar we already have.*

### The planner is pure

`src/calendar/fixture-planner.ts` has no Prisma, no Nest and no HTTP. It is handed teams, slots,
the pairings that already exist and the instants each club is already committed to, and it returns
placed, unplaced, already-existing and free. 14 unit tests, no database.

Two rules it encodes that were not obvious from the plan:

- **A matchday does not share a day with another matchday.** When a round's fixtures are placed the
  cursor moves past the last day it touched, even if slots remain on it. "Journée 3" is something
  a league announces; a round smeared across the start of the next one stops being announceable.
  It is also what leaves the tail-end slots free for the division below, which is §2.2's mechanism.
- **Leg 2 is the reversed ordered pair.** So a league half-way through its season drafts only its
  return fixtures, and re-drafting after publishing is a no-op. Verified on real data: D1 Dames
  with 15 played fixtures drafts exactly the 15 that are missing, publishes them, and a second
  draft returns *"Rien à générer : cette compétition a déjà tous ses matchs."*

### Three bugs the first publish found

Worth recording because none of them were in the calendar module.

1. **`_validateConflicts` used a flat 120-minute slot for every sport.** The planner spaces
   basketball fixtures 100 minutes apart, correctly; the conflict checker then refused the second
   one for clashing with the first. Two of the three fixtures in the very first published draft
   were rejected and they were right to be surprised. The duration now comes from the sport, the
   same source the calendar derives its slots from. This also means a basketball league could not,
   until now, put two games 100 minutes apart in one hall *by hand either*.

2. **`deleteGameScoped`'s permission chain only threw on a mismatch,** so a tenant admin whose
   tenant *matched* fell past every branch into the final `else`. Nobody below a system admin
   could delete a game in their own organisation. Rewritten as "who may" rather than "who may not".

3. **`updateGameScoped` passed `gameId` where `currentSeasonId` was expected and no
   `excludeGameId`,** so rescheduling a fixture checked it against itself and the duplicate-matchup
   check silently matched nothing. The seed had been swallowing the resulting conflicts with a
   comment saying it was "the system working".

### What is deliberately still missing

- **The draft is not persisted.** It lives in the client between generating and publishing. That
  is honest for 4.3 and it is what makes "publish exactly what was on screen" true — the fixtures
  are sent back rather than regenerated. 4.5 decides whether a draft needs to survive a reload.
- **`matchday` is computed and then thrown away.** `Game` has no column for it, so the round a
  fixture belonged to is lost at publication. It is wanted (a league announces journées) and it is
  a migration, so it belongs with 4.5 or the `Stage` work, not here.
- **One competition at a time.** `seasonIds[]` and the D1 → D1F → D2 ordered pass are 4.4. The
  planner already reports its free slots, which is the input that pass needs.


---

## 8. The calendar became writable (2026-09-02)

`4.1` shipped a calendar you could read and nothing else. Every write bounced to `/game/create`
— a 690-line page-sized wizard — and the one action the day panel offered pointed at
`/game/manage`, a route that renders the words "Game Management page". The screen that showed you
the problem could not fix it.

Leaving mattered more than the clicks it cost. What you decide when you place a fixture is *this
hall, this Saturday, this hour, given everything else already on that day*, and the only surface
holding all of it is the grid you were just looking at. A separate page asks the same questions
with the answers removed.

### 8.1 Six editable things are three concerns

The temptation is to group by column — day, time, venue, status, score, stats — and end up with
six flows. The useful axis is different: **what else must be true for the change to be legal, and
what does it invalidate downstream.** On that axis it collapses.

| Concern | What it is | Constraint | Downstream | Where it lives |
|---|---|---|---|---|
| **Slot** | day + time + hall + court | the venue and team conflict window | nothing | the calendar |
| **State** | verbs from a machine | the server's transition map | nothing | the calendar |
| **Result** | score, then lineups and stats | terminal; `COMPLETED` has no exits | rebuilds the table | its own dialog, and later the game screen |

- **Day, time, hall and court are one edit.** You never move a fixture to Tuesday without
  choosing an hour, and you never change hall without re-checking the hour. Splitting them would
  be an artefact of the form. It is also exactly what a drag gesture expresses — *this fixture,
  that slot* — which is why direct manipulation drops onto this shape rather than needing another.
- **State is never a field.** It is the two or three moves legal from where the fixture is now.
  A dropdown of nine statuses would let an organiser type an illegal transition and receive a 409
  for it. Reporting and cancelling demand a reason, because those are the two that cost somebody
  a journey.
- **A result is not a property.** It is entered courtside from a paper sheet, it is terminal, and
  it rebuilds the standings. Its own dialog: two big number fields, first one focused, forfeit as
  a checkbox. A2 and A3 say one community manager types a whole weekend in a sitting, so this is
  a batch surface, not a form.

### 8.2 The pairing is the fixture's identity

Teams are not editable and `UpdateGameDto` has never accepted them. The slug is built from the
pairing, every shared link carries it, and once a score exists the two numbers hang off it.
Changing who plays is a cancelled fixture and a new one — which is also what the league actually
did, and what the audit trail should say.

The one exception is **inverting home and away**, which is not a different match, it is the same
match typed the wrong way round. Its own endpoint, it regenerates the slug, and it is refused
once a score exists because home and away then say which club scored what.

### 8.3 A change says why

`AuditLog` already existed and was global; only the state machine and auth ever wrote to it. Every
move, correction, inversion and deletion now does, and the table gained a first-class `reason`
column rather than burying it in the `after` blob. `GET /games/:id/audit` reads it back with the
actor's name resolved, and the fixture editor shows it — a record only the database can see is
not the feature.

**This was pulled forward out of 4.5 deliberately.** Dragging a fixture is the easiest possible
way to move one, which makes it the easiest possible way to lose track of who moved it and why.
Shipping frictionless moves before accountability is backwards for this product specifically.

### 8.4 Discoverability, on an empty month

The day cell is the target. A `+` sits in its free space and strengthens on hover; the whole
empty area is clickable, so it is discoverable by trying rather than by knowing. It does **not**
replace the date number — that is how the eye navigates a month — and it does not rely on hover
alone, which does not exist on a phone.

The label next to it appears only when the month holds nothing, which is the case a new
organisation actually meets: thirty-five silent boxes whose only way in was guessing that the date
number opened a panel with a link inside it. In a month with fixtures on it, twenty-five
repetitions of the word "Ajouter" down the weekday columns of a league that plays weekends is
noise, so there it waits for the pointer. An empty month also carries a banner naming the two
doors, because a season is better generated whole than typed in day by day.

### 8.5 Still to come

- **Drag and drop.** Dropping on a day has no *hour*, so the honest first version is: drop opens
  the editor pre-filled with the new day and you pick the slot. Free dragging needs the cell to
  render slots rather than chips, which is a bigger change to the grid.
- **Lineups and per-player stats** — Phase 3 item 12, and not calendar work.
- **`/game/create` survives** as a full-page path, but nothing in the calendar needs it any more.
