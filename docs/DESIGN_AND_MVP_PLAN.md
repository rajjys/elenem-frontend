# Elenem — Design Foundation & Road to MVP

> Written 2026-08-28, after the launch-blocker work landed (`bf5c5e0` / `52b15f8`).
> Companion to `ANALYSIS_2026-08.md` (what was broken) and `MASTER_PLAN.md` (infrastructure).
> This document answers: **what do we build, in what order, to ship a product that looks like it
> was made by a company?**

---

## 0. Where I agree with you, and where I don't

**You're right that the UI is now the bottleneck.** The plumbing works — org → league → season →
roster → fixtures → results → standings, all verified end to end. Nobody will care if it looks
like a school project.

**Three things I want to push back on.**

### 0.1 "Design system" is the wrong size of thing

Design systems exist so that *many people* building *many products* stay consistent. You are one
person building one product. A real design system — component API docs, contribution rules,
versioning, Figma libraries, a11y test suites — is months, and most of it would serve nobody.

What actually produces the "professional" feeling is much narrower:

- **one token layer** (colour, type, spacing, radius, elevation) that everything reads from
- **eight primitives** rebuilt on those tokens
- **three page templates** that every screen is an instance of

That's roughly 20% of a design system and ~90% of the visible result. I'll call it the **design
foundation** to keep us honest about the scope. If we ever hire, *then* it grows into a system.

### 0.2 The dashboards don't look junior for the reason you think

I measured it. The problem isn't missing structure — it's three specific, nameable defects:

| Defect | Evidence |
|---|---|
| **Colour is decorative, not semantic** | All four dashboards render 5–6 stat cards in `bg-blue-400`, `bg-green-400`, `bg-orange-400`, `bg-red-400`. The colours mean nothing. Red does not mean bad. This is the single strongest "amateur" signal in the product. |
| **Two competing neutral greys** | 944 `gray-*` usages and 726 `slate-*` usages, mixed within the same screens. They are subtly different hues, so surfaces never quite line up. |
| **A half-finished dark mode ships today** | `tailwind.config.ts` says `darkMode: false`, but that file isn't loaded (v3 syntax under Tailwind v4), so v4's default applies: **43 `prefers-color-scheme: dark` rules compile**, from `dark:` variants in 21 of 246 files. Anyone whose phone is in dark mode gets a half-dark, half-light app. You would never see this if your own OS is set to light. |

Plus the supporting sprawl: **2,275 hardcoded colour utilities across 13 colour families**, 10
border radii, 8 shadow levels, 11 type sizes. And the `Button` primitive itself hardcodes
`bg-blue-600` rather than reading the token — so fixing tokens alone doesn't fix the buttons.

These are a week of focused work, not a redesign.

### 0.3 Two weeks and "remodel every dashboard" are not compatible

Foundation + 4 dashboards + 2 public surfaces + the functional gaps is **4–5 weeks solo**, not 2.
You have to choose, and it's genuinely your call because it depends on *who you invite first*:

| | **Soft launch — 2 weeks** | **Real launch — 5 weeks** |
|---|---|---|
| Scope | Foundation + the 8 screens on the critical path + deploy | Everything in this plan |
| Invite | 2–3 leagues run by people who already know you | The federation, publicly |
| Risk | Rough edges are forgiven because it's personal | One shot at a first impression |
| Learning | Real usage data in 14 days | Real usage data in 35 days |

**My recommendation: the 2-week soft launch, then finish the plan while real leagues use it.**

Not because 2 weeks is enough to be polished — it isn't — but because you have been building this
for two years with zero users, and the most expensive thing you can do now is spend five more
weeks guessing. Three friendly leagues in Goma will tell you more in a week than five weeks of
design will. The federation shot stays available; it's better taken in October with usage behind
you anyway.

The one thing I'd protect even in the 2-week version: **the public tenant site**. It's what fans
see and share, it's your only growth channel, and it's the thing a league president looks at to
decide you're real.

### 0.4 One sequencing rule, whichever you pick

**Don't restyle a screen you're about to rebuild.** The onboarding wizard, mobile score entry and
the public league page don't exist yet. Build them *in* the new foundation. Restyling first and
rebuilding after is paying twice.

---

## 1. The design direction

"Simplicity" isn't a direction — every product claims it. Here's a specific one to commit to.

**The product is an official record.** Its whole value proposition is *these numbers are not
disputed*. The hero content is a standings table and a fixture list. So the visual language should
be that of a **federation bulletin or a well-set results page**, not a SaaS analytics dashboard.

What that means concretely:

- **Numbers are the design.** Tabular figures everywhere, right-aligned, consistent column widths.
  A standings table that reads cleanly at a glance is worth more than any chart.
- **One accent, used sparingly.** The deep federation blue already in `@theme` (`#0a3a8d`). It
  marks the primary action and the current item. It is not a decoration.
- **Colour carries meaning or it doesn't appear.** Win / loss / draw. Live / scheduled / completed.
  Nothing else gets a hue. This alone kills the stat-card soup.
- **Structure through space and rules, not boxes and shadows.** Most cards can become a heading
  plus a hairline. One elevation level for things that genuinely float (dialogs, menus).
- **Generous type hierarchy, restrained sizes.** Six steps, not eleven.
- **Light and dark are equals**, because a fan checks last night's score in bed.

The test for any screen: *does it look like something a federation would publish?*

---

## 2. The foundation, concretely

### 2.1 Tokens (`app/globals.css`, `@theme`)

One neutral ramp (pick **one** — I'd take slate for its slight blue cast, which sits under the
accent), the primary ramp already added, and three semantic pairs. Every token defined twice —
light on `:root`, dark under `prefers-color-scheme` — so components never reference a raw colour.

```
--color-bg, --color-surface, --color-surface-raised
--color-text, --color-text-muted, --color-text-subtle
--color-border, --color-border-strong
--color-primary-{50..950}          accent + primary actions
--color-positive / -subtle          a win, a completed game
--color-negative / -subtle          a loss, a cancelled game
--color-caution / -subtle           postponed, needs attention
--radius-sm|md|lg                   3 values, from 10
--elevation-1|2                     2 values, from 8
--text-xs|sm|base|lg|xl|2xl         6 steps, from 11
```

### 2.2 Decision required: dark mode

Right now it half-ships, which is the worst option. Two honest choices:

- **(a) Remove it** — strip the 210 `dark:` variants, force light. Half a day.
- **(b) Do it properly** — define every token twice; components read tokens only. **~1 extra day**
  on top of the token migration we're doing anyway.

**Recommendation: (b).** You asked for it, it's nearly free once the tokens exist, and for a
results site people check at night it's a genuine nicety. The cost lives in the colour codemod,
which we owe regardless.

### 2.3 Primitives (8)

Rebuilt on tokens, with `cva` for variants: `Button`, `Input`/`Select`/`Textarea`, `Card`,
`Badge`, `Table`, `Dialog`, `Toast`, `EmptyState`.

Two specific debts to clear here:
- **Replace the mock `dialog.tsx`.** It's an `any`-typed div with no focus trap, no Escape
  handling and no ARIA. `@radix-ui/react-dialog` is already installed and unused. (My new roster
  dialogs currently sit on the mock — they inherit the fix.)
- **Merge the three status-badge components** into one that reads semantic tokens.

### 2.4 Templates (3)

Every dashboard screen is one of: **ListPage** (header, filters, table, pagination, empty state),
**DetailPage** (identity header, tabs, panels), **FormPage** (stepper or single column, sticky
actions). Consistency comes from screens being instances of a template, not from discipline.

### 2.5 The codemod

2,275 hardcoded colour utilities → tokens. Scripted with a mapping table, reviewed per directory,
not hand-edited. This is what makes dark mode work and what stops the sprawl returning.

---

## 3. The plan

Five stages. The **★** items are the 2-week soft-launch cut.

### Stage 1 — Foundation (4–5 days)

1. ★ Token layer, light + dark; pick one neutral
2. ★ Colour codemod across `app/` and `components/`
3. ★ Rebuild the 8 primitives on tokens; real Radix dialog; merge status badges
4. ★ Three page templates
5. Storybook-less visual check: one page per template, both themes, mobile + desktop

**Done when:** no raw colour utility remains outside the token definitions, and both themes are
deliberate on every template.

### Stage 2 — Dashboards (5–6 days)

6. ★ Re-lay the 4 dashboards. Kill the stat-card soup: lead with *what needs the organiser's
   attention* (next matchday, results awaiting entry, incomplete rosters), not six counters.
7. ★ Apply ListPage to the 12 list screens (teams, players, games, seasons, users, posts …)
8. Apply DetailPage / FormPage to the rest
9. ★ **Onboarding wizard** — org → league → season → teams → fixtures as one guided flow.
   Today that's five disconnected forms and the reason a new league stalls.

**Done when:** a new organiser goes from signup to a published fixture list without leaving the
flow or reading documentation.

### Stage 3 — Public surfaces (4–5 days)

10. ★ **Tenant public site** restyled on the foundation. Good news: it's substantially built
    already (standings 148, games 158, teams 164, team detail 276, game detail 217, home 395
    lines) — this is a restyle, not a rebuild.
11. ★ Mobile-first pass on standings + fixtures specifically. This is the most-viewed screen in
    the product and it's viewed on a phone.
12. ★ **Payload budget: under 100 KB per public page.** Currently 176 KB on the home page and
    482 KB on `/features`. On Goma mobile data that is real money.
13. Fill or delete the stub public pages (`/leagues`, `/teams`, `/standings` on the root domain
    currently render the words "Leagues Page")
14. Resolve `/pricing` vs `/plans` — they promise two different business models
15. SEO: `generateMetadata`, `sitemap.ts`, `robots.ts`, OG images

**Done when:** a standings link shared in WhatsApp renders a fast, correct, good-looking page with
a proper preview card.

### Stage 4 — Remaining function (4 days)

16. ★ **Mobile score entry** — the one screen that must be perfect on a phone, because it's used
    standing at the side of a court
17. ★ Finish the French pass on MVP screens (the shell is centralised in `nav-items.ts`; the
    ~520 inline strings are not)
18. Reschedule / postpone flow with a reason — fixtures move constantly and there's no UI for it
19. Team detail + player detail pages in the dashboard

### Stage 5 — Launch (2–3 days)

20. ★ Deploy: Railway (backend + Postgres), Vercel (frontend + wildcard DNS), S3 — `MASTER_PLAN`
    Part A, still accurate
21. ★ Real transactional email (Resend), Sentry DSN live, `/auth/health` → real readiness probe
22. ★ **Baseline check in CI**: `prisma migrate diff --exit-code` so the migration drift that bit
    us can never return
23. ★ Seed the first real league *with* the organiser, in person, and watch where they hesitate

---

## 4. Deliberately after launch

Not because they don't matter — because none of them close a free user.

- **`Stage` migration (playoffs, groups, brackets)** — `ANALYSIS_2026-08.md` §5. The first thing
  after launch. A season starting in September won't reach playoffs before December, but your
  previous product died at exactly this point, so it must not slip past that.
- **Realtime score updates** — the gateway exists and is unauthenticated; wire it properly or
  leave it off.
- **Referees** — deleted for now; re-enabling needs a controller and module, not a migration.
- **Stripe, quotas, custom domains, mobile app, API distribution.**
- **The `Organisation` / `Competition` split.** Correct model, 2027 problem.

---

## 5. Risks worth naming

| Risk | Mitigation |
|---|---|
| **Design work expands without end** — the classic solo-founder trap, and the thing that already cost you two years | Stage 1 is time-boxed to 5 days. If a token decision takes more than an hour, pick one and move. |
| **A restyle breaks working screens** | The codemod is mechanical and reviewed per directory; `tsc` clean after each; the seeded database makes every screen testable in one click. |
| **We polish the dashboard and neglect the public site** | The public site is where the eyeballs are. It's ★ in Stage 3 for that reason. |
| **Two weeks slips to five anyway** | That's fine *if it's a decision*, not a drift. Check at the end of Stage 2. |
| **Nobody uses it** | The only real risk. Everything above is subordinate to getting three Goma leagues onto it this season. Ship earlier than feels comfortable. |

---

## 6. The first decision

Before Stage 1 starts, two answers are needed:

1. **Soft launch in 2 weeks, or full launch in 5?** (§0.3)
2. **Dark mode: remove or do properly?** (§2.2 — recommendation: do properly)

And one that shapes Stage 3: **which league is going first, and do they know yet?** Building the
onboarding wizard is much easier when there's a specific person on the other side of it.


---

## 7. Progress log

### Stage 1 — Foundation `[x]` done (2026-08-28)

| # | Item | Commit |
|---|---|---|
| 1 | Token layer, light + dark, one neutral (slate) | `9198138` |
| 2 | Colour codemod — 2,275 raw utilities → 60 | `9198138` |
| 3 | Primitives on tokens; real Radix dialog | `9198138`, `2a5c9f5` |
| 4 | Page templates — `PageHeader`, `ListPage`, `DetailPage`, `FormPage` | done |
| 5 | Both themes verified; every pairing clears WCAG AA | `9198138` |

**Also fixed, from testing the built result rather than the plan:**

- The **theme control is one two-position switch**, not three buttons, and lives inside the
  account menu. There is no "system" option to render: the device preference decides where a
  first-time visitor lands, then an explicit choice sticks. A third visible state made a default
  look like a colour scheme.
- The **sidebar is flat with silent grouping** — a hairline and a quiet caption, never a
  collapsible. `CollapsibleNavLink` and `FlyoutMenu` are deleted.
- The **account block is a collapsible menu pinned to the bottom**: avatar, identity, and a
  popover holding profile, security, appearance, the public site, and sign-out.
- Two dark-mode defects that only showed up in use:
  `NavLink` set `backgroundColor`/`color` as **inline styles** from `var(--color-blue-100)`,
  which has no dark variant and beats every class — hence pale blue on pale blue. And
  `text-foreground` was defined light-only (`#171717`), so league names rendered near-black on a
  dark surface. Auditing the second turned up **121 legacy shadcn-style token usages, six of which
  were never defined at all** and generated no CSS. All migrated; the dead variables removed.
- **CTA drift closed.** "Créer une Ligue" was a green pill, "Create New Game" a blue Button and
  "Nouvelle Equipe" a gradient outline, on sibling screens. `PageHeader` now owns the primary
  action: a page passes a label and a href and never styles a CTA, so changing one changes all.
  (It also surfaced that the teams page's "new team" button pointed at `/league/create`.)
- The codemod had collapsed `hover:bg-green-700` onto the same token as its base, making **hover a
  no-op on 19 files**. Hover states now point at `-hover` / `/90` variants.

### Domain correction — how standings rank

LIPROBAKIN's published table settled a default I had guessed at. Their scoring is
`PTS = 2W + 1(L − FI)` — win 2, loss 1, forfeit 0 — verified on 17 rows. And ranking by
**POINTS with a point-differential tiebreak reproduces their order 14/14**, where win-percentage
reproduces 4/14. The default changed accordingly (`bfceb6a`); win% stays available for leagues
that rank the NBA way. Detail in `ANALYSIS_2026-08.md`.

### Shell rework (2026-08-28, second pass)

- **The sidebar owns the brand and starts at the top of the viewport.** The navbar moved inside
  the main column, so it is a strip of view-level tools that can be removed later without the app
  losing its frame.
- **Dock control** (`PanelLeft` / `PanelLeftClose`) sits beside the logo and replaces the floating
  chevron. Docked, the brand disappears and only the control remains, centred on the same axis as
  the nav icons.
- **The navbar is no longer a second identity bar.** It carries the mobile menu trigger and one
  avatar; search, notifications and help slot in beside them later. The avatar opens a profile
  card showing what the sidebar has no room for — photo, full email, every role, the organisation —
  plus one action: change your picture. The theme control is gone from here; it lives in the
  sidebar account menu, and one preference should not have two homes.
- **Account menu breaks out of the docked rail** instead of being squeezed into 5rem.
- **Active links lost the left border.** The tinted fill alone carries "current"; the border was a
  second signal and it broke the icon column's alignment.

### A real bug behind the blank pages

Pages hung on "Loading…" forever with a stale session. The token-refresh call goes through the
same axios instance, so *its own* 401 re-entered the interceptor, saw `isRefreshing === true`, and
parked itself in the queue that only the awaiting refresh could drain — a promise that never
settled. Auth endpoints are now excluded and a failed refresh clears the session. Any user whose
token went bad would have hit this, not just a developer who reset their database.

### Navigation foundation (2026-08-28, third pass)

Routes here are **flat and self-owned**: `/league/*` is a root, not `/tenant/leagues/[id]/*`.
That buys one UI per resource shared by every role, at the cost of the path not saying *which*
league you mean. Context travels in `ctx*Id` query params, with the JWT as the floor.

The rules that make it safe:

1. **The URL wins, the JWT is the floor.** `useScopeContext()` is the single resolver: ctx param
   → JWT → nothing. Every list screen pins its filters from it, so drilling down actually narrows
   (verified: players 220 → 100 → 10, users 3 → 1 → 0 for a tenant admin).
2. **No silent fallback.** When a surface needs a scope it cannot resolve, it says so and offers
   the way back (`ContextRequired`). Falling back to "whatever the role permits" is how a tenant
   admin saw all 220 organisation players on a page titled *Joueurs de la ligue* — numbers that
   look authoritative while answering a different question.
3. **Superiors are links; the current level is a switcher.** `LIBAGO > D1 M > VIR` gives a team
   dropdown on VIR and plain links above it. One dropdown on screen at a time — managing a team is
   not the moment to change organisation. Switching preserves the page you are on, so
   `/league/teams` stays `/league/teams` for the new league.
4. **The sibling list scales in three steps:** everything up to 5; 5 plus a "show the other N" for
   6–10; a search box past 10.
5. **Account routes carry no competition context.** `/account/profile?ctxLeagueId=…` was
   meaningless — the contextual link builder was appending whatever league you happened to be
   inside.

Still open, deliberately deferred to Stage 2: migrating `/tenant/users/[id]` to `/user?ctxUserId`
and `/player?ctxPlayerId`, and the modal-first pattern (quick view in a dialog, CTA to the
extended page, most work never leaving the list).

**Next: Stage 2** — dashboard remodel, the onboarding wizard, the `/user` + `/player` route
migration with modal-first lists, and the `Stage` migration for playoffs. Built for LIPROBAKIN
specifically.
