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
