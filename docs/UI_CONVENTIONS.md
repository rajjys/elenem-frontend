# Where things go, and why

> Written 2026-09-09, at the close of the Phase 4 consistency pass. Companion to
> `PLAYERS_AND_STATS.md` and `GAME_AND_STANDINGS.md`.
>
> Every rule here was already obeyed by most of the product and broken by some of it. Writing them
> down is the point: the divergences were not disagreements, they were people who could not see one
> screen from another. `docs/all-layouts.md` is the older feature manifest and is not this — it
> lists what each role can reach; this says what the reaching looks like.

---

## 1. Drawer, modal, page

The owner asked whether this was incoherent — a calendar day opens a drawer, a fixture is scored in
a modal, a player opens a modal, a club goes straight to a page. It is coherent. It had just never
been stated, which is why it *felt* arbitrary.

> - **A drawer is for a set you are scanning without leaving what you are scanning it from.**
>   The calendar's day panel: eight fixtures on a Saturday, read beside the month they sit in.
>   Closing it puts you back exactly where you were, because you never left.
>
> - **A modal is for an act you commit or cancel.** Scoring a fixture, creating one, editing a
>   roster entry. It is a question with two answers and it blocks until it has one.
>
> - **A page is for a resource with an address.** `/game/abc123` survives being pasted into
>   WhatsApp; a drawer does not, and neither does a modal. If somebody would ever send it to
>   somebody else, it is a page.
>
> - **A read-only modal is a shortcut in front of a page, and it has to earn its place.** It earns
>   it where the list is long and the reader is sampling many rows — a roster of two hundred names,
>   where opening each one as a full page and coming back is how the question stops being worth
>   asking. It does not earn it where the reader opens one thing and stays: a club, a competition.

Two consequences, both of which were missing until this pass:

- **A read-only modal always carries a way out to the page.** It is a shortcut, not a replacement.
- **A modal opened over an entry form must not navigate.** The scoresheet is twenty lines being
  typed off a piece of paper; a name on it opens the player's *quick view*, not their page, because
  a link that left would throw the evening away — the same failure `GAME_AND_STANDINGS` §6.1 was
  written about. Where nothing is unsaved — the quick view's own game log, a player's game log —
  the whole row is a link.

---

## 2. One column, one header

`AppLayout`'s `<main>` carries the padding. Content sits in **`PageShell`** (`mx-auto w-full
max-w-7xl`) and adds none of its own.

There were four of these. `ListPage` capped at `max-w-7xl` with no padding; `StandingsView` capped
at `max-w-5xl` and added `px-4 py-6 sm:px-6` *on top of* `<main>`'s `p-6`; `SeasonsView` did the
same at `max-w-4xl`; the calendar ran full-bleed. So the title, the filters and the primary action
each landed somewhere different depending on which sibling screen you had come from, and « Publier »
on the table sat lower and further in than « Nouveau joueur » on the roster.

**A screen that genuinely wants to be narrower constrains its content, never its header.** The
heading and the action must not move between two screens a reader flips between.

### The header itself

`PageHeader` is the shape, and it separates two different kinds of control:

```
Titre                                          [Action secondaire] [Action principale]
description

[ recherche… ]  [ filtre ]  [ filtre ]
```

- **Actions are on the title's line, right.** What you can *do*.
- **Filters are underneath, left.** What you are *looking at*.

They are not the same kind of thing and they do not share a row. The calendar established this
split; every list now follows it. `ListToolbar` is the second row — a search box and a slot —
because *find the row I want* was being reinvented on every screen, and only some of them styled it.

---

## 3. Sidebar: the register, then how it unfolds

The line between the two groups is **time**.

- **Répertoire** — competitions, clubs, players, and halls when they exist. What the organisation
  *has*. It survives every season: the same clubs turn up next year, on the same sheets, in the
  same hall.
- **Déroulement** — the season, its calendar, its table, its scorers. What is *happening*. All of it
  is a season's, which is why a season opens that group rather than sitting with the clubs: it is
  not another record you keep, it is the thing the other three hang off. Named « Déroulement » and
  not « Compétition » because « Compétitions » is a *link* in the group above it, and a heading one
  letter from an item three rows up is two labels the reader has to tell apart before either means
  anything.
- **Administration / Organisation** — users, publications, settings.

A club's sidebar takes the same split: **Mon club** (effectif, actualités, utilisateurs,
informations), then **Compétition** (calendrier, classement, statistiques). Their two questions —
who is in my squad, and where are we — are not the same question, and six links in one pile said
they were.

**The standing rule above all of it** (`ANALYSIS_2026-08` §3.1, restated in `nav-items.ts`): *a
navigation entry may only exist if its destination renders real content today.* Halls have a place
reserved in the register and no entry until they render something.

---

## 4. Naming

**Compétition, not ligue.** At this customer the *organisation* is the Ligue — LIPROBAKIN is the
Ligue Provinciale de Basketball de Kinshasa, LIBAGO the Ligue de Basketball de Goma — and what it
runs are championnats. Calling the children "ligues" makes the parent and the child the same word,
which is the one thing a hierarchy must not do. The code still says `league`; the screen says
*compétition*.

The general rule, from `GAME_AND_STANDINGS` §1.4: **the customer's own word wins.** « Feuille de
match » is what the paper in the operator's hand is called, so that is what the screen calls it.
Inventing a better term than the customer's is a way of being wrong in a way they cannot tell you
about.

---

## 5. Traps that have caught us twice

### `SelectField` owns the "all" row

A Radix `Select.Item` **cannot carry `value=""`** — an empty string is how a Select is *cleared*, so
an item holding one is indistinguishable from no selection and the component throws, replacing the
whole screen with an error boundary.

`SelectField` already renders that row from its own `placeholder` and maps it to `''` at the
boundary. **Do not pass `{ value: '', label: '…' }` in `options`.** It now throws in development
with the fix in the message, because it had been written twice by people who could not see that file
from theirs — and both times the symptom was a blank screen rather than a bad dropdown.

### Spread `{...props}` before `className`, never after

`Input` computed its `className` — base classes, error border, the caller's addition — and then
spread `{...props}` *after it*, so `props.className` overwrote the lot. Every `<Input className="…">`
in the app, sixty-odd of them, rendered with **only** the caller's classes: no border, no
background, no padding, no focus ring. The roster's search passes `className="pl-9"`; that is
exactly how it became an unstyled field Chrome was free to paint autofill yellow, and giving the
base its own colours fixed only the fields that passed no className, because the string was never
reaching the element.

The colours matter too, once they arrive: a field that does not name its own background does not
have one, and inherits the user agent's — white on the dark theme.

### A list validates what a list renders

`TeamDetailsSchema` is the shape a *form* works with. `GET /teams` does not send `externalId`, which
that schema requires, so the first screen to actually parse the response went blank. List services
declare their own lean row schema: a field in it is a field on screen, and drift breaks loudly in
one place instead of quietly in five.

---

## 6. Creating things

There are two creation situations, and for a long time the product had one form for both.

- **First-time setup** — an organiser with nothing. Needs sequence: a competition is useless
  without a season, and a season without clubs. That is `SetupWizard`, and it writes at each step
  so a competition that exists is useful even if the organiser stops there.
- **Adding one more later** — a second division, a club that turned up in week three. The organiser
  knows exactly what they want and needs the fields that matter, now.

**Create asks the minimum that makes the thing real. Everything else is editing.** The server agrees
already: `CreateTeamDto` needs a name and a competition, `CreateLeagueDto` a name and a tenant, and
marks the rest optional. The forms that asked besides for a logo, a banner, a founding year, a
contact e-mail, a website, a tax number and bank details were asking an organiser for things they do
not have on the day they register a club — and none of it is lost, it is filled in on the resource's
own screen once the resource exists, which is the only order in which anybody has it.

So:

| Resource | How it is created | Why |
|---|---|---|
| Competition | `/onboarding` — the wizard | It needs a season and clubs behind it; the wizard sequences that and adapts its heading to whether this is the first |
| Club | Dialog, **or** the bulk list, both on the header | A season's entry list arrives as a *list* as often as one at a time, so neither is the exception |
| Season | Dialog from `/league/seasons` | Three fields, and it belongs to a competition already on screen |
| Player | Dialog, **or** the bulk paste | Same argument as clubs, and it was already built this way |
| Organisation | Sign-up | A platform operator making one for somebody else is `/admin/tenants` |

**A cross-tenant list has no create button.** A platform operator making a competition has to say
*which organisation*, and that is the one place the question has no answer — so the door is
`/admin/tenants` → the organisation → its own list, where the scope is settled first. The wizard
reads `ctxTenantId` through `useScopeContext` so that path works.

**Suggest, never impose.** A club's abbreviation is derived from its name — « BC Virunga » → VIR —
because a results table needs one and asking an organiser to invent twenty is how you get twenty
blanks. It stops following the name the moment it is touched: two clubs in one town can genuinely
both shorten to KIV, and only the organiser knows which gets it.

**Partial success is reported, not swallowed.** Bulk creation posts one at a time and collects what
failed, so sixteen clubs with one duplicate register fifteen and name the one they could not — and
the dialog stays open holding the reason, because a toast that disappears is not where you put a
list of things to fix.

---

## 7. What is deliberately still inconsistent

- **`/admin/*` is in English** and uses the pre-Phase-2 table style. It is the platform operator's
  surface — one person, who is the person reading this — and translating it is item 18, after
  launch. `/admin/teams` is the last page holding `TeamsFilters` and `TeamsTable` (713 lines)
  alive; both die with it. Its create buttons are gone rather than repointed, for the reason in
  §6: a cross-tenant list cannot answer « for which organisation ».
- **The calendar is full-bleed**, and should be: a month grid wants the width. Its heading is its
  own for the reason its own file gives — the title is part of the grid's chrome, not a page
  header above it.
