# `Stage`, and what a playoff actually is

> Written 2026-09-06, before any code. The design analysis for `ROADMAP_V2` Phase 3 items **7**
> (the `Stage` migration) and **8** (the playoff composer) — the last two items of Phase 3 and the
> two the roadmap has called "the long ones" since it was written.
>
> Every claim about current behaviour below was read out of the code, not remembered. Where this
> and `ANALYSIS_2026-08` §5 disagree, §5 is four months older and this wins.

---

## 0. What is there today

Six facts, all verified, and each one shapes a decision further down.

**`Game.stage` exists and is dead.** A `GameStage` enum — `REGULAR · PLAYOFF · FINAL · FRIENDLY ·
OTHER` — with `@default(REGULAR)` on `Game`. `grep -rn "\bstage\b" src/` returns nothing outside
the schema. Nothing writes it, nothing reads it, no DTO exposes it. It is a label that was going to
be a structure and never became one.

**`League.competitionType` is the same story one level up.** `ROUND_ROBIN · KNOCKOUT ·
GROUP_STAGE_KNOCKOUT · SWISS`, stored, mapped into three DTOs, and read by nothing that changes
behaviour. It does not appear in the frontend at all.

**The standings engine has no idea what a phase is.** `recomputeTeamSeasonStats` selects
*every* completed game in the season:

```ts
where: { seasonId, deletedAt: null, status: COMPLETED, OR: [{homeTeamId}, {awayTeamId}] }
```

So the first playoff game ever played will increment two clubs' `gamesPlayed` and `points` in the
regular-season table, silently. This is not a future risk; it is what would happen this season.

**`LeagueStanding @@unique([teamId, seasonId])`** — and `TeamSeasonStat` the same. Exactly one table
per season. Groupe A and Groupe B are not expressible, and neither is "the regular table" plus "the
playoff table".

**The recording path genuinely does not care.** `_validateConflicts`'s duplicate-matchup check is
scoped to *the same day*, not the season:

```ts
dateTime: { gte: startOfDay, lt: endOfDay }
```

So creating a playoff fixture between two clubs who already met in the regular phase is accepted
today. The venue and team-clash checks are about halls and hours and are correctly phase-blind.

**The *generating* path cares, and would break.** `fixture-draft.service` reads
`existingPairings` across the whole season, deliberately — "a fixture played in October is still a
fixture that exists, and drafting January must not recreate it." Drafting a knockout stage would
find nearly every pairing already taken and refuse to place any of them.

And two stubs are waiting: `app/public/.../playoff/page.tsx` renders the words `PlayoffPage`.

---

## 1. Is `Stage` a season descriptor?

Yes — with one sharpening that changes what gets built.

`Season → Stage[] → Game`, stages in order, three formats. That is `ANALYSIS_2026-08` §5 and it is
still right. Three phase types compose every format in world sport, and Congolese basketball is
`LEAGUE → KNOCKOUT`, so building it generically costs the same as hardcoding it.

The sharpening: **a stage is not an attribute of a season, it is the thing a table is *of*.**

Look at what the customer publishes. `NOTIFICATION N° 006/EUBAGO` is headed *CLASSEMENT DU
CHAMPIONNAT LOCAL 2026* and its own preamble says:

> le classement **phase de 6** Version masculine et **général** version féminine

Two competitions in one organisation, on one signed sheet, on the same day — one publishing a
*phase* table and the other a *général* table. The season is the container the federation names once
(« FIN DE LA SAISON SPORTIVE 2025-2026 »). The **phase is the unit a classement belongs to**.

So `LeagueStanding` re-keys from the season to the stage, and once you accept that, `Stage` is a
first-class object with a name people say out loud, not a descriptor. Their own words for these
things are already on the page: *PLAYOFFS 2026*, *BARRAGE 2026*, *FINALE 2026*, *phase de 6*.

### What a stage is, and what it deliberately is not

```prisma
model Stage {
  id        String
  seasonId  String
  name      String       // "Saison régulière", "Phase de 6", "Barrage", "Finale"
  order     Int          // 1, 2, 3 — they run in sequence
  format    StageFormat  // LEAGUE | GROUPS | KNOCKOUT
  legs      Int    @default(1)
  advancing Int?         // "the top N from this stage go through"
  groups    Group[]      // only when format = GROUPS
}
```

**No status field, and that is a decision rather than an omission.** The season needed a state
machine because closing one is a decision with consequences somebody must own — the pointer moves,
the table becomes final, the next season may open. A stage has no equivalent act. Its boundary is
decided by *the next stage's fixtures existing*: when the committee settles the playoff format and
the fixtures are entered, the regular phase is over, and that entry **is** the transition. A
`Stage.status` would be a second thing to maintain that nothing would gate, which is precisely the
audit we just finished on `SeasonStatus` (`SEASON_AND_DASHBOARDS` §1).

**No `currentStageId` pointer either.** We spent two sprints removing an ambient pointer that
decided where every fixture landed; adding a smaller one a fortnight later would be a poor lesson.
"Which stage is being played" is derivable and cheap: the highest-`order` stage that has a completed
game, or `order: 1` if none has.

---

## 2. Standings: agreed, and two decisions hiding inside it

> *"it is going to alter the way standings fetches games, how table is calculated"*

Right, and it is the load-bearing half of the whole item. `seasonId` becomes `stageId` in the
recompute query, `LeagueStanding` re-keys to `@@unique([teamId, stageId, groupId])`, and
`TeamSeasonStat` with it.

Two things follow that the framing does not name.

### 2.1 A knockout stage has no table, and saying so saves a great deal

If every stage produces standings, somebody has to decide what `rank` means in a two-legged
semi-final, and the answer is nothing. So:

> **`LEAGUE` and `GROUPS` produce tables. `KNOCKOUT` produces a bracket.**

`StageFormat` earns its keep by declaring what the stage *yields*, which is the same job
`sport-stat-columns.ts` gives `weight: 0` and `reconcilesWithFinalScore` — the data says what
applies, and no screen has to know. A recompute triggered by a result in a knockout stage does
nothing to a table, because there is no table to do it to.

### 2.2 `/league/standings` needs a stage switcher, and it already knows how

The screen currently resolves "the current season" and shows a season picker **only when there is
more than one** (`standings-view.tsx`). Stages need exactly the same treatment, with the same rule:
one stage, no control; more than one, a switcher. A competition with a single `LEAGUE` stage — which
is every competition on day one, and most of them for ever — sees no change at all.

The default is the stage being played, derived as in §1.

### 2.3 What the published bulletin gains

`StandingsDocument` has a free-text `subtitle` and a `matchday` field the operator types by hand.
With stages, *phase de 6* stops being something they type and becomes something the document knows —
which is the same argument §3.3 of `GAME_AND_STANDINGS` made about the points rule: a caption built
from the engine's own numbers can never describe a rule that is not in force, and a hand-typed one
eventually will.

---

## 3. The calendar: right, except in one place

> *"calendar doesnt care that much"*

Largely right, and the code agrees more than you might expect.

**Recording does not care.** The duplicate-matchup guard is same-day scoped, so two clubs meeting
again in a playoff is already legal. Venue availability, hall conflicts and "a club cannot be in
two places at once" are about rooms and hours, and stay phase-blind — correctly, because a hall
does not know what phase is being played in it. That is `CALENDAR_MODULE` §1's separation holding
up: **conflict detection is tenant-wide, everything else is a permission or a filter.**

**Generating does care, in exactly one line.** `fixture-draft.service` reads `existingPairings`
across the whole season. That read must become stage-scoped, or drafting a knockout finds every
pairing already used and places nothing. One query, and the comment above it needs rewriting because
its reasoning changes: a fixture played in October is still a fixture that exists *in that stage*.

**And the grid must name the stage, without changing colour.** The competition stays the colour
axis — chips are the legend and hall allocation is what the calendar is for. But the fixture card
and the day panel should say « Play-offs · Demi-finale », because *why are these two playing again*
is the first question a reader has when a pairing repeats, and today the grid gives no answer.

So: two small changes, neither structural. Your instinct holds.

---

## 4. Where I disagree: the playoff nav-link

> *"I also see playoff having it's own nav-link and being it's own page"*

A bracket needs its own **view** — it is neither a table nor a month grid. Agreed entirely.

I do not think it should be its own **nav item**, and the reason is the strongest evidence in the
whole product.

`ROADMAP_V2` §6 A4, in the customer's own words: the playoff format **changes every season**.
Sometimes 8 teams, sometimes 6 in two groups of three, sometimes 4 for the women. And their own
published calendar prints not one knockout but **three named phases in sequence**:

```
PLAYOFFS 2026        6 fixtures over 4 days
BARRAGE 2026         « SI NECESSITE »
FINALE 2026          GAME 1 / GAME 2 / GAME 3
```

A permanent sidebar item labelled **Play-offs** is therefore:

- **a promise on a competition that has none** — D2 may never reach one, and a menu entry is a
  statement that the thing exists;
- **wrong-named more often than right** — the phase is called *Barrage*, or *Finale*, or *phase de
  6*, and calling it Play-offs is us renaming the customer's own document;
- **singular where the domain is plural** — EUBAGO ran three knockout phases in one season;
- **a second place to look for "how is this competition going"**, splitting the answer across two
  sidebar entries that both mean *results*.

That last one is the same failure `ANALYSIS_2026-08` §3.1 spent a day undoing: eighty-eight nav
items of which seventy led nowhere, because every feature got a link whether or not it had a
destination.

### What I would build instead

**No new nav item.** `/league/standings` becomes the competition's *results* screen and gains a
stage switcher, exactly as it already gained a season picker. When the selected stage is a
`KNOCKOUT`, it renders a bracket instead of a table. Same screen, same URL shape, one more control
that only appears when it has more than one option.

The published-artefact argument holds either way: `?stage=…` is as shareable as `/league/playoff`,
and the export already lives on this screen.

**Composition is a different screen, because it is a different act.** `GAME_AND_STANDINGS` §3.2:
*a screen implying you can edit a table is lying about where the authority lives*. Assembling
stages — how many advance, best-of-three or single game, two legs or one — is structure, and this
product puts structure in settings (`/league/settings/rules` holds the points system and the bands).

Which raises something I have to own.

### 4.1 This is the first thing that gives a season-scoped screen a reason to exist

Two weeks ago I argued `/season/[seasonId]` should be deleted because every job it might hold had a
better home, and we deleted it. That argument was **"nothing needs one today"**, and it was right
about the four verbs. A season's *shape* — its stages, in order, with how many advance from each —
is a genuinely season-scoped thing, and it is bigger than a verb on a card.

I proposed starting on the season card and reopening the route only if the composer outgrew it.
**That was overruled, and on reflection the overrule is better.** Composing a season's format is not
a verb — it is a workspace: several stages, each with a name, an order, a format, a leg count and a
qualification rule, read and rearranged as a set. `CALENDAR_MODULE` §7 already drew this line for
the draft workspace — *"under the section, not flat: a workspace is a page, and only an identifiable
resource earns a flat route"* — and a composer is the same kind of thing.

So `/league/seasons/[seasonId]/format` opens, deliberately, and it is the first screen in the
product that is genuinely season-scoped. Two rules from the screens we retired come with it, and
they are the reason this is not a reversal:

- **It renders the reader's own chrome**, never a one-item sidebar naming itself. That was the
  actual defect in `/season/layout.tsx` — `GAME_AND_STANDINGS` §2.3 — and it is what stranded a
  reader on a leaf.
- **It lives under its section**, not at a flat `/season/[id]`. The retired route's other sin was
  claiming a top-level address for a page nobody could reach; this one is reached from the season
  it belongs to.

---

## 4bis. Decisions taken (2026-09-06)

Settled with the user after the argument above.

| Question | Decision |
|---|---|
| Placeholder fixtures | ~~Nullable teams, bounded to knockout stages~~ — **superseded by §9.** A separate `PlannedFixture` model whose sole verb is to become a `Game`. The reasoning that overturned this is worth reading before the section it replaces. |
| The playoff's home | **A stage switcher on `/league/standings`**, rendering a bracket when the stage is a `KNOCKOUT`. No new nav item. §4. |
| Where stages are composed | **`/league/seasons/[seasonId]/format`** — a real season-scoped page, against my recommendation of a card panel. §4.1, rewritten. |
| Does a stage have a status | **No.** Which stage is being played is derived. §1. |
| Sequencing | **Migration first, composer second** — refined to three sprints in §12, since placeholders and the bracket separated from the composer once they stopped being a column on `Game`. |

---

## 5. Adding a game: the paradigm shift you sensed, named precisely

> *"adding a new game is very much bound to the competition stage or the paradigm shifts entirely"*

This is the sharpest of the five, and it is right twice over — once obviously and once not.

### 5.1 The obvious half

`Game.stageId` is required. Today the season comes from `league.currentSeasonId` (overridable since
last sprint); there is no equivalent pointer for stages and §1 says there should not be. So the
fixture dialog gains a stage selector, under the rule the calendar already uses for competitions and
the standings screen for seasons: **one option, no control; more than one, a required choice.**
After the backfill every season has exactly one stage, so nothing changes on screen until somebody
composes a second.

It matters more than a dropdown, though, because the stage decides **which table the result lands
in**. That makes it the same class of field as the season — and the same failure is available: put
the fixture in the wrong stage and a club's record is wrong in a way nobody can see.

### 5.2 The half that actually shifts the paradigm

**A bracket has fixtures before it has teams.**

Page 6 of `docs/Homologation, classement et calendrier.pdf` books the ISC hall for
`FINALE 2026 · GAME 1` on Saturday 10 July, and for `BARRAGE` fixtures marked *SI NECESSITE* — a
match that may not be played at all. Neither has teams. Both have a date, an hour and a room.

`Game.homeTeamId` and `Game.awayTeamId` are non-null, and the slug, the conflict checks, the box
score, the calendar chip and the standings query all assume both. So the domain wants something the
model forbids. Three ways out:

**(a) Nullable teams everywhere.** One migration, then every screen must handle "a match with no
teams" for ever. The slug is built from the pairing; `_validateScopeAndInputs` counts two teams in
the league; the standings query joins on them; the chip renders `VIR · HIM`. This is the paradigm
shift, and it is expensive in proportion to how rarely it is used.

**(b) A bracket is a structure of slots; a `Game` exists only when both teams are known.** The
bracket page draws its shape from `Stage.advancing` and `round`, and fixtures materialise as real
rows when the feeding results arrive. Nothing in `Game` changes at all. This is the same rule
`CALENDAR_MODULE` §3 already lives by — *nothing is written to `Game` until it is a real fixture* —
and it is very cheap.

Its cost is precise and it is the customer's actual practice: **the hall cannot be booked for a
final whose teams are not known**, because a slot that is not a `Game` holds no slot and the venue
checker cannot protect it. EUBAGO book that hall three weeks ahead.

**(c) Nullable teams, bounded to knockout stages, with one rule stated once.** A fixture with an
unknown side is a **placeholder**: it holds a slot, it appears on the calendar so the hall is
booked, its name comes from the bracket position (« Finale · Match 1 ») rather than from a pairing,
it cannot take a result, and the standings never see it. The moment the feeding result arrives, the
teams are filled in and it becomes an ordinary fixture with an ordinary slug.

**I recommended (c)** on the grounds that (b) is cheaper only because it declines to model
something the customer demonstrably does.

> **Superseded — see §9.** A fourth option was put to me and it is better than all three: a
> *separate model* that occupies a calendar slot and whose only verb is to become a `Game`. It
> keeps (c)'s ability to book the hall for an undetermined final while making the teamless state
> unrepresentable on `Game` at all. The reasoning is in §9; this section is left standing because
> the three options are the argument that the fourth one answers.

---

## 6. What the migration actually is

Building on `ANALYSIS_2026-08` §5, with what four months of building has added:

```
+ Stage   { seasonId, name, order, format, legs, advancing }
+ Group   { stageId, name }                     -- only for GROUPS

  Game            + stageId, groupId?, round?, bracketSlot?, matchday?
                  − stage           (the dead GameStage enum)
  LeagueStanding  @@unique([teamId, seasonId]) → @@unique([teamId, stageId, groupId])
  TeamSeasonStat  the same re-key
```

Three notes on that list.

**`matchday` belongs here.** `CALENDAR_MODULE` §7 records that the planner computes it and throws it
away, that it is wanted because a league announces *journées*, and that it is a migration and
therefore belongs "with 4.5 or the `Stage` work". It is the latter: a matchday is a number *within
a stage*, and adding it separately would mean re-keying it later.

**Delete `Game.stage`.** Keeping a flat `GameStage` label beside a real `stageId` is the
`isActive`-beside-`status` mistake again, and we have just spent a sprint removing one of those.

**`League.competitionType` must not become a second source of truth.** Format lives per stage now.
Its only defensible remaining job is seeding the composer's first suggestion; if it cannot be that
honestly, it should go the same way.

**The backfill is lossless**: every existing season gets one stage
`{ name: "Saison régulière", order: 1, format: LEAGUE }`, every game points at it, every standing
re-keys to it. Zero behaviour change on day one — which is the property that makes this safe to do
before the composer exists.

---

## 7. What breaks that nobody has listed

Found by reading, not by guessing. None of it is hard; all of it is invisible until it bites.

| Where | What happens |
|---|---|
| `fixture-draft.service` | `existingPairings` is season-wide → a knockout draft places nothing (§3) |
| `dashboard.service` | `champion` is `rank: 1` of the season's table. With stages the champion is the winner of the last knockout stage, not the top of the regular one — the dashboard would crown the wrong club |
| `dashboard.service` | `fixtureCount` / `playedCount` / `missingResults` stay season-wide, and should: an organiser owes results across every phase. Worth stating so nobody "fixes" it |
| `standings-export` | `subtitle` and `matchday` are typed by hand; the phase becomes derivable (§2.3) |
| `results-import` | The spreadsheet importer matches fixtures within a season. Two clubs meeting twice across stages become ambiguous unless the sheet carries the phase |
| `getStandingsView` | `pendingResults` counts overdue fixtures season-wide. Correct for the organiser, wrong under a stage's own table — which needs its own count |
| `season-state.service` | The auto-open on first result is stage-blind and should stay so: a result in any phase means the season is running |
| `/public/.../playoff` | A stub rendering `PlayoffPage`. Retire it or build it — the public bracket is a real artefact, but it is Phase 5 |

---

## 8. What I would decide before writing any code

1. **Placeholder fixtures** — (b) no placeholders, or (c) nullable teams bounded to knockout stages
   so a hall can be booked for an unknown final. §5.2. My recommendation is (c); the argument for
   it is on page 6 of their own bulletin.
2. **The playoff's home** — a `Play-offs` nav item and page, or a stage switcher on
   `/league/standings` that renders a bracket. §4. I recommend the switcher and I have argued
   against your version; it is your product and your call.
3. **Where stages are composed** — a panel on the season card in `/league/seasons`, or a season
   screen reopened for the purpose. §4.1. I recommend starting on the card.
4. **Does a stage have a status?** I say no and derive "which stage is being played". §1.

Items 7 and 8 should then split roughly as: the migration and the standings re-key first, shipped
with a one-stage backfill that changes nothing on screen; the composer and the bracket second.

---

# Part II — Integration impact, and the placeholder question re-opened

> Added 2026-09-06 after the analysis above was read. Two things prompted it: a request for the
> impact on the rest of the product, and a counter-proposal on placeholder fixtures that is better
> than what §5.2 recommended.

---

## 9. Placeholders: I was wrong, and here is what changed my mind

§5.2 recommended nullable teams bounded to knockout stages, and that was taken as a decision. The
counter-proposal — **a separate model that behaves like a fixture but is not a `Game`, whose sole
job is to become one** — is better. Three of the four arguments for it hold up under inspection,
and the third is decisive.

### 9.1 "The frontend is not prepared to have a game with less than 2 teams" — verified, and worse than stated

`calendar-view.tsx:196` decides whether a dropped fixture's hour is free:

```ts
const sharedClub =
  o.home.id === entry.home.id || o.home.id === entry.away.id ||
  o.away.id === entry.home.id || o.away.id === entry.away.id;
```

Two teamless fixtures both carrying an empty or null side id would compare **equal**, and the grid
would report a club clash between two matches that have no clubs. That is not a null check somebody
forgot; it is a correct piece of code that a nullable team silently invalidates. `fixture-dialog`
reads `entry.home.id` to seed its selects, the chip renders `home.name — away.name`, and the delete
confirmation reads `home.shortCode — away.shortCode`. Every one of them is fine today and becomes a
place a null can leak.

### 9.2 "They don't even have the same actions" — the strongest argument, and it is arithmetic

| | `Game` | placeholder |
|---|---|---|
| move on the calendar | ✓ | ✓ |
| reorder in a day | ✓ | ✓ |
| cancel / delete | ✓ | ✓ |
| enter a score | ✓ | — |
| correct a score | ✓ | — |
| box score, per-player stats | ✓ | — |
| lineups | ✓ | — |
| invert home and away | ✓ | — |
| state machine (confirm, live, complete, postpone) | ✓ | — |
| **become a `Game`** | — | ✓ |

Three of ten actions overlap, and the one action that matters most to the placeholder does not
exist on a `Game` at all. Two objects whose verbs disagree that completely are two objects. Forcing
them into one row means every one of those seven `Game` actions grows a guard clause saying "not
if the teams are unknown" — seven places where the guard can be forgotten, on the object that
carries the results.

### 9.3 "I'm afraid of people creating games without teams and breaking the system" — the decisive one

This is the argument that changes the answer, and it is a design principle rather than a fear:

> **Make the invalid state unrepresentable, rather than representable-but-forbidden.**

Nullable columns on `Game` make "a match with no teams" expressible *everywhere in the product* —
in the fixture dialog, in the results importer, in a league stage, through `POST /games`, for ever.
What keeps it out of those places is discipline in six call sites. A separate table makes it
expressible **nowhere except a knockout bracket**, because there is no column to put it in.

That is the same reasoning `CALENDAR_MODULE` §7 used to reject `dryRun` in favour of two endpoints:
*"a boolean that decides whether a request is a preview or a permanent act cannot enforce that; two
endpoints with two names can."* The identical shape, one level down.

### 9.4 Where the framing needs adjusting

Two corrections, neither of them fatal to the proposal.

**"Probable game" is the wrong name, because it conflates two different things.** EUBAGO's calendar
prints both:

- `FINALE 2026 · GAME 1` on Saturday 10 July — **certain to happen, teams undetermined.**
- `BARRAGE 2026 · SI NECESSITE` — **may never happen at all.**

Those are different properties and the model should carry both: sides that are *labels* rather than
teams (« Vainqueur demi-finale 1 »), and a `conditional` flag for the fixtures that exist only if
the results require them. "Probable" describes the second and misdescribes the first.

**It is not free, and the costs should be named before agreeing.** A placeholder that occupies the
hall must be visible to the code that protects the hall:

| Cost | Size |
|---|---|
| `checkVenueConflict` must union the second table | one function, one file |
| `getCalendar` must return placeholders as entries | one query, one mapper |
| `CalendarSideSchema.id` becomes nullable, and §9.1's comparison guards it | one schema field, one line |
| the calendar needs a `PLANNED` branch beside the six existing `DRAFT` branches | six small sites |
| reorder within a day needs a rule | see §9.6 |
| the promote transaction | new, ~40 lines |

Against nullable teams, which costs guard clauses in seven `Game` actions plus the six calendar
sites plus the standings, the box score, the state machine, the match page and the public site —
and leaves the invalid state representable for ever.

**Verdict: the twin model, and §5.2's decision is superseded.**

### 9.5 What it looks like

```prisma
model PlannedFixture {
  id          String    @id @default(cuid())
  tenantId    String
  leagueId    String
  seasonId    String
  stageId     String    // KNOCKOUT stages only — refused elsewhere by the service
  round       Int?      // 1 = quarter-final, 2 = semi-final, …
  bracketSlot Int?      // position within the round

  /// What the two sides are before they are teams. « Vainqueur DF1 », « 2e du Groupe B ».
  /// This is the fixture's name, and it is what the calendar chip renders.
  homeLabel   String
  awayLabel   String

  dateTime    DateTime
  homeVenueId String?
  courtId     String?

  /// EUBAGO print « SI NECESSITE ». A fixture that exists only if the results require it, and
  /// which holds its hall until it is known either way.
  conditional Boolean   @default(false)
  notes       String?
  // …tenant, audit and soft-delete columns as everywhere else
}
```

**No `gameId` back-reference, and the row does not survive promotion.** Its sole purpose is to
become a fixture; once it has, it is gone, and the `AuditLog` carries the act — which is where this
product already keeps history. A promoted placeholder kept alongside its `Game` would be a second
row on the same Saturday that every query then has to exclude.

### 9.6 The one place it is genuinely awkward

`POST /calendar/reorder`'s invariant is that the requested times are **a permutation of the times
those fixtures already hold** — which is what makes "reorder" a meaningful word rather than a bulk
edit (`CALENDAR_MODULE` §8). Permuting times across two tables is doable but it doubles the
transaction and the refusal messages.

**First version: a placeholder sits in the day's stack and is not draggable**, exactly as a played
fixture is pinned there today with *joué — horaire figé*. Its label is « à définir — se déplace
depuis sa fiche », and its time is changed from its own editor. Reading the day in order still
works, which is what the stack is for; only the gesture is unavailable. Revisit if anyone asks.

---

## 10. Integration impact across the product

The sweep that was asked for. Ordered by how much each surface actually changes, and honest about
the ones that change not at all.

### 10.1 Onboarding — no new step, and that is the recommendation

The wizard is `league → season → teams`. The temptation is a fourth question — *what format is this
competition?* — and it should be resisted, for the reason `CALENDAR_MODULE` §9 already gave when
onboarding was trimmed to end at the calendar rather than at generation: **a league setting up for
the first time does not yet know, and asking makes them decide something they cannot.** LIPROBAKIN
decide their playoff format mid-season, based on how much calendar is left (§6, A4).

But the Champions League / World Cup case is real and dismissing it would be wrong. Someone setting
up a group competition should not have to create a `LEAGUE` stage and then convert it. The answer
is not a wizard question, it is **templates on the composer**, offered at the moment the organiser
is actually thinking about format:

- *Championnat simple* — one `LEAGUE` stage (the default; what every existing season gets)
- *Championnat + play-offs* — `LEAGUE(advancing: N)` → `KNOCKOUT`
- *Poules + phase finale* — `GROUPS(M pools, advancing: N)` → `KNOCKOUT`

The season is still created with one `LEAGUE` stage, and the onboarding's final step gains one
sentence pointing at the composer for anyone who needs something else. A default that is right for
ninety-nine seasons in a hundred, and a door for the hundredth.

### 10.2 Dashboards — the biggest change, and it is not cosmetic

> *"a dashboard should lead and not just inform"*

Right, and stages give it three new things to lead with. The first is the most valuable thing in
this entire document.

**Between stages is a state the product cannot currently be in, and it is the moment the organiser
must act.** The regular phase is complete, every result is in, and the playoff has not been
composed. Nothing else in the product will tell them. The card should say so and link to the
composer:

> **Phase régulière terminée.** Les 8 premiers sont connus. Composez la suite.

**In a knockout, a missing result is a blocker, not an incompleteness.** Today the dashboard says
*1 résultat manquant* and explains that the table is incomplete. In a knockout the same missing
result stops the next round from being drawn at all, and the sentence should say that instead:

> **Les demi-finales ne peuvent pas être composées** — 1 quart de finale sans résultat.

That is a materially stronger call to action, and it comes free from knowing the stage's format.

**In a group stage, progress is per group.** One bar per pool rather than one for the stage, because
"53% played" across four pools tells an organiser nothing about whether Groupe A can be settled.

And a fourth, smaller: **placeholders are a to-do.** « 3 rencontres à définir » — finals whose halls
are booked and whose teams are not yet known — belongs beside the missing results.

One thing that must **not** change: `missingResults`, `fixtureCount` and `playedCount` stay
season-wide on the organiser's screen. An organiser owes results across every phase, and narrowing
them to the current stage would hide the regular-season fixture nobody ever entered. Worth writing
down so nobody "fixes" it later.

### 10.3 The club surface — one real question

`/team/standings` shows the club's competition table with their row marked. In a `GROUPS` stage
there are M tables and the club is in one of them. The screen must resolve **the club's own group**,
not the first one — which the server can do, because it knows the team.

`/team/calendar` needs nothing: a club's fixtures are its fixtures whatever phase they are in. The
club dashboard's `standing` block needs the same group resolution, and its *rank out of N* becomes
rank within the group — which is what a club means anyway.

### 10.4 The published bulletin — the phase stops being typed

`StandingsDocument` has a free-text `subtitle` and a hand-typed `matchday`. With stages, *phase de
6* becomes something the document derives rather than something the secretary retypes every
Saturday — the same argument §3.3 of `GAME_AND_STANDINGS` made about the points rule.

A `GROUPS` stage means **several tables on one sheet**, which is not new: EUBAGO already publish
*VERSION MASCULINE* and *VERSION FEMININE* as two tables on one notification. The renderer takes a
list of tables rather than one, and the existing single-table case is a list of one.

### 10.5 Results import — a real ambiguity, already half-guarded

`results-import.service` builds `existingPairs` as a map keyed on the pairing across the whole
season. **Two clubs meeting twice — once in the regular phase, once in the final — collapse to one
entry**, and a row could be matched to the wrong fixture.

It is half-guarded already: the downloadable template's first column is `ID`, and a sheet filled in
from the template disambiguates itself. The exposure is a hand-built sheet, which is exactly what a
league that has not discovered the template will send. The template gains a **Phase** column and
the importer prefers `ID`, then `phase + pairing`, then refuses rather than guessing.

### 10.6 Fixture generation — one line, already identified

`existingPairings` becomes stage-scoped (§3). Worth restating that the *recording* path needs
nothing: the duplicate-matchup guard is same-day scoped, so two clubs meeting again in a playoff is
already legal today.

### 10.7 Surfaces that change nothing at all

Worth listing, because a migration this size invites the assumption that everything is affected.

- **The scoresheet and box score.** Per-player stats belong to a game, and a game belongs to a
  stage; nothing in the sheet reads either.
- **The match page.** It resolves one fixture and its audit trail. It gains a line naming the phase
  and nothing else.
- **Roster, players, teams, users, venues, blackouts.** A stage is not a scope.
- **`useScopeContext` and the breadcrumb.** A stage is a filter within a competition, not a level of
  the hierarchy — the same reason a season never became a scope.
- **Permissions.** No new axis: whoever may edit a competition may compose its stages.
- **The season state machine.** Auto-open on first result stays stage-blind: a result in any phase
  means the season is running.
- **The tenant calendar's conflict detection.** A hall does not know what phase is played in it.

---

## 11. Revised decisions

Superseding the table in §4bis where they differ.

| Question | Decision | Changed? |
|---|---|---|
| Placeholder fixtures | **A separate `PlannedFixture` model**, knockout-only, whose sole verb is to become a `Game`. Nullable teams on `Game` is rejected. | **Yes — §5.2(c) is superseded by §9** |
| The playoff's home | A stage switcher on `/league/standings`, rendering a bracket for `KNOCKOUT`. | no |
| Where stages are composed | `/league/seasons/[seasonId]/format` | no |
| Stage status | None. Derived. | no |
| Onboarding | **No new step.** Templates on the composer instead. | new |
| Dashboard | **Leads on the between-stages gap and on knockout blockers**, not just counts. Season-wide totals stay season-wide. | new |
| Sequencing | Migration → composer → placeholders and bracket. **Three sprints, not two.** | **Yes — §4bis said two** |

---

## 12. Implementation plan

Three sprints. Each one ends somewhere testable, and the first two are invisible to a league that
never composes a second stage — which is the property that makes this safe to start.

### Sprint A — the structure. No visible change.

**A1. Schema and migration.**
`Stage` and `Group` tables. `Game` gains `stageId` (required), `groupId?`, `round?`, `matchday?`,
and loses the dead `stage` enum column. `LeagueStanding` and `TeamSeasonStat` re-key from
`@@unique([teamId, seasonId])` to `@@unique([teamId, stageId, groupId])`.
Backfill: one `{ name: "Saison régulière", order: 1, format: LEAGUE }` per existing season; every
game and every standing points at it.

**A2. `StagesService`.** CRUD scoped like every other resource, plus a derived
`currentStageOf(seasonId)` — the highest-`order` stage holding a completed game, else `order: 1`.
No status, no pointer.

**A3. Standings goes stage-scoped.** `recomputeTeamSeasonStats` and `recalculateLeagueStandings`
select by `stageId`. `getStandingsView` resolves the stage the way it resolves the season, and
returns the stage's name and format alongside. A `KNOCKOUT` stage returns no table.

**A4. `Game` creation takes a stage.** `CreateGameDto` gains `stageId?`, defaulting to the season's
current stage and validated to belong to it — the same shape `seasonId` took last sprint.

**A5. The draft's pairing read goes stage-scoped**, and `matchday` is persisted at publication
instead of being computed and thrown away.

**A6. Dashboard correction.** `champion` reads the last stage's table, not the season's.

*How to test:* the migration diff is clean; the seeded standings are **byte-identical before and
after** (six competitions, same ranks, same points); every existing screen renders unchanged;
`missingResults` on the seeded organisation still reads the same number. Then, on a throwaway: add a
second `LEAGUE` stage by hand, move one completed fixture into it, and confirm the two tables
separate and neither counts the other's game.

### Sprint B — the composer.

**B1. `/league/seasons/[seasonId]/format`.** A real season-scoped page under its section, rendering
the reader's own chrome. Stages listed in order; each with a name, a format, a leg count and how
many advance. Add, rename, reorder, remove.

**B2. Templates.** *Championnat simple*, *Championnat + play-offs*, *Poules + phase finale*.

**B3. The season card names the shape** — « Saison régulière → Play-offs » — and links here.

**B4. The stage switcher on `/league/standings`**, appearing only past one stage, and the export's
phase line derived rather than typed.

*How to test:* on a throwaway, compose LIPROBAKIN's actual 2026 shape — a regular phase, then a
*phase de 6* — score fixtures in both, and confirm each table counts only its own; confirm the
published bulletin names the phase without anyone typing it; confirm a one-stage competition sees no
switcher and no change anywhere.

### Sprint C — placeholders and the bracket.

**C1. `PlannedFixture`** — model, service, `POST /planned-fixtures/:id/promote`, refused outside a
`KNOCKOUT` stage.

**C2. The calendar carries them.** `getCalendar` returns them as entries with `status: 'PLANNED'`
and labelled sides; `CalendarSideSchema.id` becomes nullable and §9.1's comparison guards it;
`checkVenueConflict` unions the second table; the day panel offers *Confirmer les équipes*; the
stack pins them undraggable (§9.6).

**C3. The bracket view** on `/league/standings` when the stage is a `KNOCKOUT`.

**C4. The dashboard leads.** Between-stages prompt, knockout blockers, group-wise progress,
placeholders as a to-do.

*How to test:* reproduce page 6 of `docs/Homologation, classement et calendrier.pdf` end to end —
`PLAYOFFS`, a conditional `BARRAGE`, and a best-of-three `FINALE` with `GAME 1/2/3` booked into ISC
before the teams are known; confirm the hall refuses a second booking at that hour; confirm a
placeholder cannot be scored; promote one and confirm it becomes an ordinary fixture with an
ordinary slug and disappears from the placeholder table.

