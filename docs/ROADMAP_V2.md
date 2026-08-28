# Elenem — Roadmap to V1

> Written 2026-08-28, after Phase 1 (design + navigation foundation) closed.
> Supersedes the staging in `DESIGN_AND_MVP_PLAN.md` §3, which was written before we knew how
> much was in scope. Keeps that document's design direction and §0 arguments.

---

## 0. What changed since the last plan

The last plan had five stages and assumed Stage 2 was "dashboards + onboarding". Your list makes
clear that was wrong: what's actually left is **four phases of real product work**, not one.

Two things also changed the calculus:

- **LIPROBAKIN is on a four-week break.** There is no longer a two-week clock. Doing this properly
  beats doing it fast, and the `Stage` migration can be designed rather than squeezed.
- **We know the first customer's shape.** 25 men's teams, 17 women's, one leg then playoffs,
  ranked by points with a differential tiebreak, forfeits tracked. Every decision below can be
  checked against a real league instead of an imagined one.

---

## 1. Pushbacks

Four places where I'd spend the time differently.

### 1.1 OAuth is not what's wrong with your registration

You called the user/password/`tenantCode` model outdated. Half right — but OAuth would not fix the
actual defect, which is that **login requires the user to know and type their organisation code**.
A tenant-scoped user who omits it gets "Invalid credentials", because the query only searches
un-tenanted users. That is the single most abandonable moment in the product, and Google sign-in
does nothing about it.

**Fix the model first:** resolve the tenant from the account rather than asking the human for it.
Then OAuth becomes a small addition rather than a workaround. It also unblocks something bigger —
`Player.userId` is nullable now, so "claim your player profile with Google" becomes a real growth
loop later.

*Cost: tenant resolution ~1 day. OAuth ~2 days, and it can wait.*

### 1.2 Event-based scoring is the wrong product for this market

You asked how bigger systems handle scoring. They use play-by-play: every basket, foul and
substitution entered live by a dedicated scorer. That requires a trained operator, a charged
device and two hours of connectivity per game.

**LIPROBAKIN's own published table has W / L / FI / PF / PA and nothing else.** They do not track
player stats at the league level. Building play-by-play would be building for a league that does
not exist yet, and it would make the one screen that must work at courtside — enter the final
score — slower.

**Recommendation:** final score plus an optional box score (points per player), entered after the
game. Design the schema so play-by-play can be added later (`GameEvent` already exists), but do
not build the UI now. Revisit when a league asks for live scoring and has someone to do it.

### 1.3 The public side should not be entirely last

Agreed that it *depends* on the back office and mostly comes after. But the split matters:

- **The tenant public site** — standings, fixtures, a team page — is your growth engine and your
  credibility proof. It is also already built (home 395 lines, team detail 276, game detail 217,
  standings 148); it needs restyling, not building. **It ships with launch.**
- **The public API, distribution, marketing polish, SEO depth** — genuinely last.

Fans are the "thousands of people coming back every day" you're aiming at. They cannot come back
to an admin panel.

### 1.4 One thing missing from your list that I'd put near the top

**A "publish the standings" export.** The screenshot you sent me *is* LIPROBAKIN's official
standings — a hand-made image, produced every matchday, signed by the Secrétaire Provincial. That
is the artefact their whole process exists to produce.

If Elenem generates that image/PDF automatically — their branding, their columns, their
qualification and relegation bands, the date and signature line — it does not merely help their
workflow, **it replaces it**. It is the single cheapest thing on this list with the highest chance
of making them switch, and it makes every share a marketing surface.

*Cost: ~2 days. I would not launch without it.*

---

## 2. Deferred, with reasons

| Item | Why not now |
|---|---|
| **Global search (⌘K)** | Per-list search and filters cover 25 teams and 250 players. Global search is a "feels professional" feature that needs volume to earn its keep. Revisit at ~5 leagues. |
| **User management depth** | You said it yourself: most orgs start with one user. Invites work. Roles matrix, per-scope member admin — after launch. |
| **Play-by-play scoring** | §1.2. |
| **Coaches / referees** | Deleted; re-enabling is a controller and a module. Referee assignment matters once leagues complain about it, not before. |
| **`Organisation` / `Competition` split** | Still the correct model, still a 2027 problem. `Stage` (Phase 3) unblocks playoffs without it. |
| **Realtime** | The gateway is unauthenticated. Either wire it properly or leave it off; nothing in V1 needs it. |

---

## 3. The phases

Four phases, each independently shippable, each ending in something testable.

### Phase 2 — Getting data in (≈2 weeks)

*The theme: every flow that a new league walks through on day one.*

1. **Registration and tenant creation, reworked as one flow.** Onboarding starts at sign-up, not
   at "create organisation". Today they are two disconnected forms with a code in between.
2. **Remove the `tenantCode` requirement at login** (§1.1). Resolve the tenant from the account.
3. **Resource creation revisited** — league, team, player, game. All four are multi-step forms
   built before the templates existed. Reduce every one to the minimum a Goma organiser can answer
   without help; everything else moves to edit-later.
4. **Onboarding wizard** — sign-up → organisation → league → season → teams → fixtures, as one
   guided path with resumable progress. Built against LIPROBAKIN's shape specifically.
5. **Venues.** A published game with no location helps neither the fan nor the gate. Models
   (`HomeVenue`, `VenueCourt`) exist and are unused.
6. **CSV import** — teams, players, schedule. Leagues live in Excel. The bulk-paste roster already
   covers players; this extends it to the other two and adds a real error report.

**Done when:** a league organiser you have never met creates an account and reaches a published
fixture list without you on the phone.

### Phase 3 — Competition structure (≈2–3 weeks)

*The theme: the season actually runs. This is the long one; it is not to be rushed.*

7. **The `Stage` migration.** `Season` → `Stage[]` → `Game`, with `LEAGUE | GROUPS | KNOCKOUT`.
   Backfill gives every existing season one `LEAGUE` stage. Designed before written.
8. **Playoffs.** Bracket generation from a finished stage's standings, qualification rules
   (LIPROBAKIN take a top 8), two-legged ties, a bracket view.
9. **Standings, properly.** Sortable columns, qualification and relegation bands, form guide,
   games-played made prominent, and a way to *see* how a tie was broken rather than trusting it.
10. **Reschedule / postpone** with a reason and an audit trail. Fixtures move constantly; there is
    no UI for it at all.
11. **Game management, mobile-first.** The one screen used standing at the side of a court. Final
    score plus optional box score (§1.2).
12. **Player ↔ game data** — lineups, appearances, per-game points. The models exist; nothing
    surfaces them.
13. **Standings export** (§1.4) — the artefact that replaces their current workflow.

**Done when:** LIPROBAKIN's 2025-26 season could have been run end-to-end in Elenem, playoffs
included, and the published table matches their bulletin exactly.

### Phase 4 — Polish and depth (≈1.5 weeks)

*The theme: it stops feeling like a tool and starts feeling like a product.*

14. **Dashboard redesign, season-status aware.** A dashboard in *pre-season* should show what is
    missing (no fixtures, incomplete rosters); *in-season*, what needs attention (results to
    enter, upcoming matchday); *post-season*, the outcome. Today all four dashboards show the same
    counters regardless. This is the item with the biggest gap between current and right, and it
    belongs after Phases 2–3 because it summarises them.
15. **`/user` and `/player` routes, modal-first.** Quick view in a dialog with real content — for a
    player: photo, team, number, position, season line; for a user: roles, last login, scope. CTA
    to the extended page. Most work never leaves the list.
16. **Remaining pages onto the templates.** Cheap now.
17. **S3 wired.** Logos and photos. Blocking for the public site (§1.3).
18. **Translation pass.** ~520 inline strings; the shell is already centralised.

**Done when:** you would show it to the federation without apologising for anything.

### Phase 5 — Launch and the public side (≈1.5 weeks)

19. **Tenant public site** restyled on the foundation — standings, fixtures, team, game.
    Mobile-first, under 100 KB a page.
20. **SEO** — `generateMetadata`, sitemap, robots, OG images. A shared standings link should
    preview properly in WhatsApp.
21. **Deploy** — Railway, Vercel with wildcard DNS, S3, real email, Sentry live, migration-baseline
    check in CI.
22. **Onboard LIPROBAKIN in person**, and watch where they hesitate.
23. *Then* the public API and distribution.

**Total: ≈7–8 weeks.** Realistically nine with the things none of us have thought of yet.

---

## 4. Risks

| Risk | Mitigation |
|---|---|
| **Phase 3 sprawls.** Competition structure is genuinely hard and easy to gold-plate. | Design `Stage` on paper first and agree it before any code. Build for LIPROBAKIN's format only; the others fall out of the same model or they wait. |
| **The dashboard redesign starts early and never ends.** | It is deliberately Phase 4. It summarises the season; you cannot design that summary before the season data exists. |
| **We rebuild forms twice** — once in Phase 2, again after `Stage` lands. | Game creation is the overlap. Build it Phase 2 assuming one stage, and let `Stage` add a selector rather than reshape the form. |
| **Perfection delays contact with users.** | Phase 2 alone is demoable. Show LIPROBAKIN the onboarding flow before Phase 3 is finished; their reaction should shape it. |

---

## 5. Open questions

1. **Does LIPROBAKIN keep player statistics anywhere?** Their table doesn't show any. If they don't
   track them, Phase 3 item 12 shrinks a lot.
2. **How do they currently produce that standings image** — Excel, Canva, a designer? Whatever it
   is, the export in §1.4 has to be visibly better in one step.
3. **Who enters results, and from where?** Still unanswered from the first analysis, and it decides
   how much of item 11 is mobile.
4. **Playoff format exactly:** top 8, single elimination or two-legged, seeded how, third-place
   game? Needed before designing `Stage`.
5. **Do the women's and men's championships share anything** — venues, matchdays, a combined
   publication? It affects whether they are two leagues or two stages of one competition.
