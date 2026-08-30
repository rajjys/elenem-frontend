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

### 4.1 — Calendar view, read-only *(~3 days)*
The month grid over **existing** games. No generation. Immediately useful: it is the first time
anyone can see the tenant's whole calendar. Also the honest first slice for a community manager who
only records.

### 4.2 — Record what was decided elsewhere *(~3 days)*
- Add a fixture to a slot from the calendar.
- **Import completed results from a spreadsheet** — the agreed mid-season path. Upload, review,
  confirm, record. Scoped to *results*, not schedules.
- This is the slice that makes the module usable by our actual first user.

### 4.3 — Generation, single competition *(~4 days)*
`POST /games/generate-fixtures` gains `gameDurationMinutes` and `dayWindows`. Output is a **draft**,
never written. Existing games respected as §2.6. Insight panel v1.

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
