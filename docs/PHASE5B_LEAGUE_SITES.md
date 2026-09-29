# Phase 5B — League sites (`<ligue>.dxscores.app`)

> Written 2026-09-25, from the same four audits as `PHASE5A_PRODUCT_SITE.md` (read §0 there for
> how these plans are meant to be used). This one covers the fan-facing site every organisation
> gets automatically at `<slug>.dxscores.app`. It is a different product from the `.com`: 5A sells
> to one organiser; 5B serves hundreds of fans, for free, on behalf of that organiser.
>
> Supersedes `ROADMAP_V2` §3 item 19 and `HANDOVER_PHASE5` §1.3/§3 step 4 for the tenant site.
>
> **Updated 2026-09-26** with the owner's answers:
> - English paths, and *games*, not *matches*;
> - the time zone prompted on the dashboard;
> - two colours (primary and accent) from a short list;
> - the meaning of PRIVATE and HIDDEN;
> - a per-competition switch for showing players' identities;
> - communiqués kept.
>
> §11 records what is settled.

---

## 0. Read this first

**§2 is a data leak that is live in production today.** No sensitive data is exposed yet, because
none has been entered, but the first federation that fills in its settings will publish its bank
details. It is the first thing to build in all of Phase 5, before 5A.

---

## 1. What this is, and for whom

**The promise, from the very beginning:** the league does its work once, entering a result, and
everything the public sees updates itself: the table, the results, the calendar, a link that
previews properly in WhatsApp. **No one maintains the site.** That is what makes DXScores a
broadcasting tool rather than a back office, and it is why the site must be **generated**, not
designed, per league.

**Who reads it**, in order of volume:

1. **Fans, players and families**, on a phone, often on slow and expensive data, arriving from a
   link in a WhatsApp group. They want one of three things: *the table*, *when and where we play
   next*, *what the score was*.
2. **Club officials**: their team's record, the next fixture, the roster as the federation has it.
3. **The federation itself.** This is their official publication. It must look like something a
   federation would sign (`DESIGN_AND_MVP_PLAN` §1).
4. **Local press and radio**, who today retype results from a photo of a bulletin.

**What the site must never do** is publish a number that differs from the federation's own
bulletin. That is the one thing that destroys trust (`liprobakin-domain`). Everything below is
subordinate to it.

---

## 2. Sprint 0: the public API leaks private data (do first)

Verified against production on 2026-09-25:

- **`GET /public-leagues`**, **`/public-leagues/:slug`** and **`/public-leagues/tenants/:tenantCode`**
  return the full `BusinessProfile` row: `bankInfo`, `mobileMoneyInfo`, `taxNumber`,
  `nationalIdNumber`, `leagueRegistrationId`, `legalName`, `physicalAddress`, latitude/longitude.
  Sources: `elenem-backend/src/leagues/services/public-leagues.service.ts:47,84,145`.
- **`GET /public-tenants/:slug`** does the same for every team in `teams[]`
  (`src/tenants/tenants.service.ts:763`).
- **`GET /public/players`** returns the player's `email`
  (`src/players/services/public-players.service.ts:39`) and lets anyone **search by e-mail** (`:112`).
- Several responses also carry `ownerId`, `createdById` and other audit ids.

The tenant settings form asks federations for exactly those fields
(`components/forms/tenant/settings/profile.tsx`). Production holds none of them yet (checked: every
value is empty, and 0 of 100 players have an e-mail), so this is a structural leak, not an
incident. It becomes one the day a federation fills in its profile.

**Fix, and nothing more in this sprint:**

1. A shared `PUBLIC_PROFILE_SELECT` (name, description, city, region, website, socialLinks,
   brandingTheme, timezone, and the logo/banner asset url). Use it wherever a public service
   touches `businessProfile`. Remove `email` from public players, and the e-mail search with it.
2. A unit test that fails if a public select ever contains `bankInfo`, `mobileMoneyInfo`,
   `taxNumber`, `nationalIdNumber`, `leagueRegistrationId`, `physicalAddress` or `email`.
3. **The `/public-leagues?pageSize=N` 500.**
   - Cause: `public-leagues.controller.ts:17-18` declares `@Query('pageSize') pageSize = 20` with
     no type, so the ValidationPipe cannot coerce it and the string `"30"` reaches Prisma's
     `take`.
   - Fix: use `DefaultValuePipe` + `ParseIntPipe`, as `public-teams.controller.ts:27-28` does.
   - In the same controller, move `@Get('tenants')` above `@Get(':slug')`; today `/tenants` is
     unreachable.
4. Deploy. Check against production with the same `curl` that found it.

**≈ half a day. It protects real people, which nothing else in Phase 5 does.**

---

## 3. Where the league site stands (2026-09-25)

In one line: **it exists, but it is a client-side prototype the design system never reached.**

- **Nothing is server-rendered.** All eight content pages are `'use client'` and fetch in
  `useEffect`. The server HTML for `liprobakin.lvh.me:3000/` contains the league's name **zero
  times** and carries `<title>Elenem Systems</title>`. A WhatsApp preview, a search engine or a
  phone on 3G sees an empty page. Header, footer and page each fetch `/public-tenants/:slug`
  separately, three identical requests.
- **The home page opens on a full-screen black block** that reads *"Aucun article de blog trouvé
  pour ce locataire"* (LIPROBAKIN has 0 posts). Below it are **August results**, because
  `/public-games/search` sorts ascending and takes 20.
- **The public table is not the official table.** It reads stored `LeagueStanding` rows for
  `league.currentSeasonId` (`standings.service.ts:1019-1104`). The admin screen and the signed
  export use `getStandingsView` (`:538`), which is phase-aware.
  - Once a season has a second phase or pools, each club appears once per phase, with duplicate
    ranks.
  - The table shows a draws column (always 0 in basketball) and no FI, P.M, P.E or +/-, so a
    reader cannot reconcile the points.
  - No bands and no rule are shown.
  - It goes blank the day a league starts planning next season.
- **Unknown leagues return 200** (`doesnotexist.dxscores.app` verified in production).
- **Slugs are not scoped to the organisation.** `/public-teams/bc-hirondelles` returns LIBAGO's club
  when asked on EUBABUNIA's site (verified). Every seeded season slug is `saison-2026-2027`.
- **Times are wrong for anyone not in the browser's time zone.**
  - Public days are cut in UTC (`games.service.ts:966, 986-989`), while the DRC is UTC+1 and UTC+2.
  - Times are formatted in the viewer's browser zone.
  - Once pages render on a Vercel server (UTC), every hall time would be one to two hours off.
  - `BusinessProfile.timezone` exists and is null everywhere.
- **Navigation:**
  - six links go to 404s (`/videos`, `/photos`, `/competitions`, `/history`, `/about`, `/contact`);
  - four are placeholders;
  - *Se connecter* links to `/`, and `/login` on a league host is a 404.
- **Branding is not connected.** The header reads `brandingTheme` (which the API never selects)
  and builds raw palette classes from it; the home page hardcodes colours for three slugs that do
  not exist. With no logo, the header shows a loading skeleton for ever.
- **Visibility is inconsistent.**
  - Only the tenant endpoints check the tenant's visibility. A HIDDEN organisation's games,
    tables and teams are served by every other endpoint.
  - A PRIVATE league is included in some responses and excluded from others, so it appears as a
    tab with no table.
- **Postponed and cancelled games vanish** instead of saying *Reporté* / *Annulé*. Overdue games
  still say *Programmé*. Forfeits are never shown.
- **English strings**: the post page, the "Round" label, toasts. Typos: *"Tout les"*, *"Classememnts"*,
  *"actualitvs"*.

**What the data looks like** (LIPROBAKIN, the reference league):
- 2 competitions (Messieurs, 25 clubs; Dames, 17 clubs), one season, one LEAGUE phase each.
- 436 games, of which 213 are completed. `matchday` and `round` are never set, and only 18 games
  have a hall.
- 0 posts and 0 box scores. **0 media assets in the entire database: no logo anywhere.**

LIBAGO has groups, knockout phases and 160 box-score lines, so it is the league that exercises
phases, the bracket and scorers.

**Verdict: rebuild, not restyle.** The data flow, the API it reads and the rendering model are all
wrong for this job, and ~1,500 lines of client code is less to replace than to repair.
`DESIGN_AND_MVP_PLAN` §3 called this "a restyle, not a rebuild"; that was before anyone looked at
the API underneath.

---

## 4. Decisions and pushbacks

### 4.1 Server-rendered, cached for a minute, and almost no JavaScript

Every page is a **server component**. It fetches with
`fetch(…, { next: { revalidate: 60, tags: ['site:<slug>'] } })` and renders HTML with the numbers
in it. Tabs, filters and date navigation are **links** (`?c=messieurs`, `?week=2026-09-21`), not
client state. The only client code is the mobile menu and the share button.

- This is how the site stays **under the product site's budget** (5A §6: under 200 KB compressed,
  ~107 KB of it React and Next.js), previews in WhatsApp (which needs `og:*` tags in the
  first 300 KB of HTML), is indexable, and loads on 3G.
- A result entered in the dashboard appears publicly **within a minute**, with no webhook. That is
  the broadcast promise, kept by the cache setting. On-demand revalidation when a score is saved
  (`revalidateTag`) is a later refinement if a minute proves too slow.
- **This is a deliberate exception** to the "React Query in every module" rule
  (`frontend-module-conventions` memory). That rule is for the interactive app. The public site
  has no client data layer at all. Server fetchers still parse with `parseResponse` and use
  generated types.
- **Vercel function region:** set it next to Railway (EU). Otherwise every uncached render
  crosses the Atlantic twice.

### 4.2 One page-shaped public API, not seven generic ones

Each page today stitches three to five generic endpoints together, and each generic endpoint has
its own visibility bugs, slug ambiguity and envelope. Replace them with **one backend module,
`public-site`, under `/public/sites/:slug/…`**:

- one endpoint per page, each returning exactly what the page shows;
- each built on an explicit allow-list DTO (§2's lesson);
- each resolving `tenant → competition (slug, tenantId) → team (slug, leagueId) / game`, so a slug
  can never cross organisations.

The old `public-*` controllers stay only until nothing calls them, then they are deleted. This
also settles the `public-` vs `public/` naming question from `HANDOVER_PHASE5` §2.

### 4.3 The public table *is* `getStandingsView`

It is not a second implementation. Extract the body of `getStandingsView` into
`buildStandingsView(league, season, stage, group)`, call it from the admin endpoint and from a
public wrapper, and add team slugs and the phase list to its output. The public site then shows
exactly the columns, bands, rule and tiebreaks the signed export prints: **MJ · MG · MP · FI · P.M
· P.E · +/- · PTS** for basketball, from the sport's column definitions.

**A bug to fix on the way, which affects the admin screen too.** `currentStageOf`
(`stages.service.ts:58-73`) returns the furthest phase with a completed game of *any* format. Once
a knockout phase has a result, as LIBAGO's semi-finals do, the view resolves to it and returns an
empty table. It should fall back to the last LEAGUE or GROUPS phase that has rows. (From the audit;
verify on LIBAGO before fixing.)

### 4.4 Times are the league's times

The site shows **the hall's clock**, for every reader, everywhere:

- `BusinessProfile.timezone` is **pre-filled silently at sign-up** from the device's IANA zone when
  it is an African zone, otherwise from the country (CD → `Africa/Kinshasa`). Nothing is added to
  the sign-up form.
- **The organiser confirms it later, from the dashboard** (owner, 2026-09-26: time zone and rules
  belong to the later stages of onboarding, visible once the dashboard is reached). The
  organisation dashboard shows a small *À compléter* card, *« Fuseau horaire : Kinshasa (UTC+1) —
  confirmer ou modifier »*, until it has been confirmed once. The same card pattern can carry
  "points rules not reviewed yet" later.
- It is edited in the organisation settings. A league in the east picks `Africa/Lubumbashi`.
- Backfill: LIPROBAKIN → `Africa/Kinshasa`; LIBAGO, LIBUK and EUBABUNIA → `Africa/Lubumbashi`.
- The public API takes `from`/`to` as **local dates** and converts them with the league's zone.
  Every date and time is formatted on the server with `Intl.DateTimeFormat('fr-FR', { timeZone })`.

The DRC has two time zones, which is why the country alone is not enough.

### 4.5 What the site shows is decided by the data, not by a menu

A section or nav item appears only if there is something in it:

| Item | Shown when |
|---|---|
| Accueil `/`, Matchs `/games`, Classement `/standings`, Équipes `/teams` | always, once the league has a competition |
| Marqueurs `/stats` | the league has box-score lines, **and** the competition shows player identities (§4.9) |
| Phase finale `/playoffs` | a competition has a KNOCKOUT phase |
| Actualités `/news` | the league has a published post or *communiqué* |

A brand-new league (no competition yet) gets a clean one-screen site: its name, and *"Le
calendrier de <ligue> arrive bientôt."* It never shows broken sections. **Self-serve means a site
must look alive from the first minute.**

### 4.6 Branding: a name, a logo if there is one, and two colours from a short list

- **Logo:** rendered when it exists. Otherwise an initials mark on a neutral surface. Never a
  skeleton, never a coloured blob that means nothing.
- **Two colours, as leagues have** (owner, 2026-09-26): a **primary** and an **accent**, each
  picked from the **same curated list of about eight colours**. Each colour is a light/dark pair
  checked for contrast, and the list includes neutral options.
  - They are stored as keys in `brandingTheme.primaryColor` / `secondaryColor`, which are the names
    the old header already expected, and exposed as `--site-primary` / `--site-accent`.
  - **Primary** is the header band and the league's mark background.
  - **Accent** is links, the active nav item, and the underline of section titles.
  - They are **never** used for wins, losses or bands; those keep the semantic tokens.
  - Why not a free hex picker: it would let a league make its own table unreadable, in one theme or
    the other.
- **Cost check:** two selects in the organisation settings, two CSS variables and one palette
  file. It stays in only because it is small (5B.7). If it grows beyond that, a single accent
  ships and the second colour waits.
- **Not now:** custom fonts, banners, hero images, per-competition colours, custom domains. Custom
  domains fit within Vercel Hobby's 50-domain ceiling, but they are a support burden and nobody has
  asked.

### 4.7 No accounts on the fan site

Fans have nothing to log into. *Se connecter* is removed. The footer gets a quiet **Espace
organisateur** link to `https://dxscores.com/login`, built by a new `buildAppUrl()` (the unused
`NEXT_PUBLIC_APP_DOMAIN` finally gets a reader). Sessions cannot cross from `.com` to `.app`
anyway: cookies are per host.

### 4.8 Deliberately not built

| Not now | Why |
|---|---|
| Video, photos, galleries | No media storage yet (R2 not wired); nothing to show |
| Live scores, play-by-play | The operator enters the final score (`ROADMAP_V2` §1.2, A3) |
| Player pages | Thin content, and youth leagues publish minors. Rosters show number, name and position (when identities are shown, §4.9). Revisit when players ask |
| A drawn bracket | A list per round (*Demi-finales · Finale*) says the same thing on a phone. Draw it when a league has run a full play-off in the product |
| Fan accounts, following a team, notifications | No evidence anyone wants them; a WhatsApp group already does it |
| Predictor, betting, fantasy, tickets, shop | What big-league sites do; wrong for this market and this product |
| Downloading the signed standings PDF publicly | It is the federation's signed document; its distribution is theirs |
| Directory of leagues | Belongs to `.com`, curated (5A §10) |
| Custom domains | §4.6 |

### 4.9 Showing players' identities is the competition's choice

Decided 2026-09-26: whether a site shows **who** the players are is a setting, per competition,
that the organiser switches on or off. Youth competitions are the reason.

- Stored in `League.settings` (an existing JSON column; no migration) as `publicPlayerIdentity`,
  **on by default**, with a switch in the competition's settings: *« Afficher les noms des joueurs
  sur le site public »*.
- **On:** rosters show number, name and position; box scores and scorers show names.
- **Off:** no roster on club pages; box scores show number and club only; the Marqueurs page is
  not shown for that competition, because a leaderboard of numbers is not worth a page.
- Player-level visibility still applies on top: a player who is not PUBLIC is shown by number
  only, even when the competition shows identities.

---

## 5. Information architecture

**Paths stay in English, and it is *games*, not *matches*** (owner, 2026-09-26), matching the
back office. Everything the reader sees (labels, titles, copy) is French. Most of these paths
already exist, so nothing needs redirecting except two placeholders.

```
<slug>.dxscores.app
  /                                   Accueil
  /games                              this week (league's week), ?week=YYYY-MM-DD, ?c=<competition>
  /games/<competition>/<game-slug>    one game
  /standings                          ?c=<competition>&season=<slug>&stage=<id>&group=<id>
  /teams                              ?c=<competition>
  /teams/<competition>/<team-slug>    one club
  /stats                              ?c=…            (scorers; only if box scores exist)
  /playoffs                           ?c=…            (only if a KNOCKOUT phase exists)
  /news  /news/<slug>                                 (only if posts or communiqués exist)
  /robots.txt  /sitemap.xml  /og/…

  308:  /playoff → /playoffs   /players → /teams

dxscores.app apex + www          308 → https://dxscores.com   (5A.1)
unknown <slug>                   404, DXScores-branded: "Aucune ligue à cette adresse — créez la vôtre"
```

The match URL keeps today's slug form (`bnz-vs-ter-2026-08-22`), which is unique within a season.
It is qualified by the competition in the path and resolved within the organisation.

---

## 6. The pages

### Accueil

On a phone, top to bottom:

1. **Header:** logo or initials mark, the league's name, the accent rule.
2. **Prochains matchs:** the next date with scheduled games, across all competitions, each
   labelled with its competition. Time, the two clubs, the hall if set. At most eight, then
   *Tout le calendrier →*.
3. **Derniers résultats:** the most recent date with results. Scores, forfeit marked. Games past
   their date without a score say **Résultat à venir**, not *Programmé*.
4. **Classement:** competition tabs (links), the top eight with bands, then *Classement complet →*.
5. **Meilleurs marqueurs**, only if there are box scores: top five.
6. **Actualités**, only if there are posts: the three latest.

### Classement

- Competition chips. A season picker only if there is more than one season; phase and pool chips
  only if there is more than one.
- The table: sport columns from the view. The first column (rank + club) is sticky and the rest
  scroll horizontally on a phone. Short club codes on narrow screens, full names from `sm`.
- **Bands with a text legend** (*Qualifiés pour la phase finale*, *Relégation*), so colour is
  never the only signal.
- **The trust line**, straight from the view's fields:
  - *Mis à jour le 26 sept. à 18 h 40 · 213 matchs comptés · 2 résultats en attente*;
  - *PTS = 2 × MG + MP — un forfait vaut 0 au lieu de 1*;
  - *Départage : différence de points, puis confrontation directe…*.

  This is how the site shows a reader where each point comes from.
- Share button.

### Matchs

- One week at a time, in the league's time zone, grouped by day (and by *journée* when set).
  *Semaine précédente / suivante* links.
- Default: the current week, or the next week that has games when the current one is empty.
- Competition chips.
- Each row: time, the two clubs (short on narrow screens), score or status. Status is one of
  **Terminé**, **Forfait**, **Reporté**, **Annulé** or **Résultat à venir**.
- The row links to the match.

### Match (`/games/<competition>/<game-slug>`)

- Competition · phase · journée; date, time and hall in the league's zone.
- The score large, or *à venir*; a forfeit notice when there is one.
- **Box score** when it exists, one table per club: number, name, LF, 2 pts, 3 pts, PTS, with the
  top scorer marked. Names only when the competition shows identities (§4.9).
- Links to both clubs. Share button.
- Title and OG card by state: *BNZ 78–74 TER · Championnat Messieurs* when played, and *BNZ – TER ·
  sam. 26 sept. 13 h 30* before.

### Équipes / club page

- **List:** clubs by competition, with name, code and initials mark.
- **Club page:**
  - the club's row from the table: rank, MJ, MG, MP, PTS;
  - its next match;
  - its season results (score, opponent, W/L/FI);
  - the roster: number, name, position, **only when the competition shows identities** (§4.9);
  - players who are not PUBLIC are shown by number only.

### Marqueurs *(conditional)*

- The leaderboard per competition: rank, player, club, MJ, PTS, average, 3-pointers.
- Built from `PlayerGameStat`, the same derivation as the admin leaderboard.
- Only for competitions that show identities (§4.9). Non-PUBLIC players appear by number and club.

### Phase finale *(conditional)*

- Each KNOCKOUT phase as a list of rounds.
- Each round lists its games: played games with scores, and planned fixtures with their labels
  (*Vainqueur demi 1*), marked *si nécessaire* where conditional.
- It is what the bulletin prints (`ROADMAP_V2` §11: *GAME 1 / GAME 2 / GAME 3*, *SI NECESSITE*).

### Actualités *(conditional)*

- Published posts **and communiqués** (`Post.type` ANNOUNCEMENT, kept by the owner 2026-09-26),
  newest `publishedAt` first. A communiqué carries a small *Communiqué* label. The article is Markdown rendered **on the
  server** (a small server-only renderer; no editor bundle on the public site).
- No hero image until R2 exists.

### The site's frame

- **Header:**
  - desktop: the league's name and mark, and the nav from §4.5;
  - phone: a **bottom tab bar** with Accueil, Matchs, Classement and Équipes, plus Marqueurs
    only when it exists (at most five);
  - Phase finale and Actualités sit in the header menu on phones.
- **Footer:** the league's public contact (only fields the league chose to fill), **Espace
  organisateur**, and **Propulsé par DXScores — créez le site de votre ligue** →
  `https://dxscores.com/?utm_source=league&utm_campaign=<slug>`.
- **Share button:** `navigator.share` where it exists, otherwise a `wa.me/?text=<title>%20<url>`
  link. It is the cheapest high-value feature on the site.

---

## 7. The public read API (`elenem-backend/src/public-site/`)

All endpoints are anonymous, use explicit response DTOs (added to Swagger so `npm run codegen`
types them), and apply the visibility rules below. Every list is bounded.

| Endpoint | Returns |
|---|---|
| `GET /public/sites/:slug` | The site frame: name, slug, logo url, accent key, timezone, description, public contact, social links. Competitions: slug, name, gender, division, the season shown (name, slug, status), whether it has phases, a knockout phase and box scores. Also `hasPosts`. **404** when the tenant is unknown, inactive, HIDDEN or ARCHIVED |
| `GET /public/sites/:slug/standings?c&season&stage&group` | The public projection of `buildStandingsView`, plus team slugs and the phase/pool lists |
| `GET /public/sites/:slug/games?from&to&c&team` | Game rows: id, slug, competition, phase name, journée, instant, status, forfeit, both clubs (name, code, slug, logo), scores, hall name. `from`/`to` are local dates, at most 42 days apart. All statuses except DRAFT and deleted |
| `GET /public/sites/:slug/games/:c/:gameSlug` | One game, plus its box score (public projection, identities per §4.9) |
| `GET /public/sites/:slug/teams?c` | Clubs |
| `GET /public/sites/:slug/teams/:c/:teamSlug` | A club, its table row, its season's games, its roster (per §4.9) |
| `GET /public/sites/:slug/scorers?c&season&stage` | The leaderboard (public projection) |
| `GET /public/sites/:slug/knockout?c` | Knockout phases: rounds → games and planned fixtures |
| `GET /public/sites/:slug/posts`, `/posts/:postSlug` | Published posts |
| `GET /public/sites/:slug/sitemap` | Slugs and `lastmod` for competitions, clubs, matches and posts |

**Visibility rules**, one place (a `SiteVisibility` helper) applied by every endpoint:

The owner's definitions (2026-09-26), applied:

- **Organisation PUBLIC:** served, indexed, and eligible for the `.com` showcase.
- **Organisation PRIVATE:** **served, but never shown from `dxscores.com`** (no showcase entry, no
  directory, no link from us). Anyone with the address can open it. Recommendation, reversible:
  also `noindex` and out of the sitemap, since "not shown from us" and "found on Google" pull in
  opposite directions.
- **Organisation HIDDEN:** **the subdomain does not resolve**. `hidden-league.dxscores.app` is a
  404 even though the organisation exists.
- **Organisation ARCHIVED:** treated like HIDDEN until the owner says otherwise.
- **Competition** inside a site: PUBLIC and PRIVATE are shown; HIDDEN and ARCHIVED are not.
- **Club:** a HIDDEN club still appears in fixtures (the match happened), but has no page.
- **Players:** identities follow the competition's switch (§4.9). Within it, PUBLIC players are shown
  by name; any other player by number and club only.

**Tests** cover visibility, cross-organisation slug isolation (the `bc-hirondelles` case), the
UTC+2 day boundary, and the absence of every field on §2's blocklist.

---

## 8. Frontend structure

```
app/public/public_tenant/[tenantSlug]/
  layout.tsx            server: getSite(slug) → notFound() / generateMetadata / frame / --site-accent
  page.tsx              Accueil
  games/page.tsx  games/[c]/[game]/page.tsx
  standings/page.tsx
  teams/page.tsx  teams/[c]/[team]/page.tsx
  stats/page.tsx  playoffs/page.tsx  news/…
  og/…/route.tsx        ImageResponse cards (see §9)
  not-found.tsx         DXScores-branded 404 with the "créez la vôtre" link

lib/public-site/
  api.ts                server fetchers: fetch + revalidate 60 + tags, parseResponse, generated types
  format.ts             fr-FR dates/times in the league's zone, relative day labels
  site.ts               React cache() wrapper so layout + page share one getSite() per request

components/league-site/
  site-header, bottom-nav, site-footer, competition-chips, week-pager,
  standings-table, standings-legend, trust-line, match-row, match-day-group,
  score-header, box-score-table, team-roster, scorers-table, knockout-rounds,
  complete-card (dashboard "à compléter": time zone),
  initials-mark, share-button (client), empty-site
```

- **Everything on design tokens**, no raw palette colours. That lets the `@source inline(...)`
  safelist in `app/globals.css:17-36`, which exists only for the old dynamic class names, be
  deleted.
- **Deleted when the new pages are live:** `PublicTenantHeader`, `PublicTenantFooter`,
  `components/public/*` (hero, standings-table, TeamCard), `game-public-card`, `date-carousel`,
  `vertical-blogpost-card`, and the old pages. Then the old `public-*` backend controllers, once
  `grep` shows nothing calls them.

---

## 9. Sharing and SEO

WhatsApp matters more here than Google. It is how a result spreads in Goma.

- **Titles:**
  - `%s · <Ligue>` throughout;
  - home: *<Ligue> — calendrier, résultats et classement*;
  - standings: *Classement <compétition> <saison>*;
  - match: as in §6;
  - club: *<Club> — calendrier, résultats, effectif*.
- **Descriptions** are generated from the data, under ~150 characters. WhatsApp shows about 80, so
  the important part goes first.
- **OG images** come from explicit route handlers returning `ImageResponse`, PNG, 1200×630, under
  300 KB:
  - **a league card:** name, mark, accent;
  - **a match card:** the two clubs and the score or kickoff.

  Pages set `openGraph.images` to the **absolute public URL** (`https://<slug>.dxscores.app/og/…`).
  Do not use the `opengraph-image` file convention: it would emit the internal
  `/public/public_tenant/…` path, which middleware rewrites a second time and turns into a 404
  (audit finding).
- **A standings card** (the top eight as an image) is a stretch goal. It is the thing fans would
  share most.
- **Per-host robots and sitemap:** the tenant branch of the shared `app/robots.ts` and
  `app/sitemap.ts` (5A §8.4).
  - The sitemap is built from `/public/sites/:slug/sitemap`, with `lastmod` changing when a score
    does.
  - It is excluded for PRIVATE organisations.
- **`noindex`:** PRIVATE organisations and competitions, and a site with no competition yet.
- **JSON-LD:** `SportsOrganization` on the home page, `SportsEvent` (clubs, start, location) on
  match pages, and `BreadcrumbList`. It is harmless, but **expect no rich results**: Google's score
  boxes come from licensed data partners, and its Event rich result is not offered in France or the
  DRC. The realistic target is branded searches (*classement liprobakin*, a club's name).
- **One Search Console Domain property** covers `*.dxscores.app`, via a DNS TXT record at Vercel.
- **Middleware:** tenant hosts must not rewrite `/robots.txt`, `/sitemap.xml` or the icons, and
  `/og/*` must reach its route handler (verify the trailing-slash rewrite does not break route
  handlers).

---

## 10. Build order

Each sprint ships on its own. The recommended interleaving with 5A is in §12.

### 5B.0: Stop the leak (≈ 0.5 day) — **done 2026-09-26**

§2. Shipped as backend `2a4b231`:
- shared public selects in `src/common/public/public-profile.select.ts`;
- a guard spec, `public-responses.spec.ts`, which fails 8 of its 10 tests against the old code;
- the `?pageSize` 500 and the route order fixed;
- visibility filters on the two organisation reads.

Verified on production with a scan of every public endpoint: no blocklisted key anywhere. The
owner and audit user ids that remain in other public game responses go with the 5B.1 rewrite. **Done when:** on production, no public endpoint returns any blocklisted field, the
`?pageSize` 500 is gone, and the test guards both.

### 5B.1: The public read API (≈ 2 days) — **in progress** (steps 1–2 of 3 done, 2026-09-29)

- **Step 1, done (backend `9543212`).** `buildStandingsView(league, season?, stage?, group?)` is
  user-free; the admin endpoint calls it after its permission check. With no phase named, the
  table opens on the furthest LEAGUE/GROUPS phase with a result
  (`StagesService.currentTableStageOf`), never a knockout. The view carries `teamSlug` and
  `tableStages`, and `StandingsViewDto` is now in the frontend's generated types.
  `StandingsService.currentSeasonOf` is public, so the site's scorers use the table's season (the
  leaderboard's own rule prefers `League.currentSeasonId` and can disagree).
- **Step 2, done (backend `841994f`, frontend `e55bd19`).** The time zone, **with one deviation:
  nothing is pre-filled at sign-up.** Pre-filling silently and confirming later needs a
  "confirmed" marker, which means a migration, and nothing shows that Railway runs
  `migrate deploy`. The stored zone *is* the confirmation instead: the dashboard's *À compléter*
  card proposes the device zone (Goma → Lubumbashi), and saving it ends the question. Until then
  `leagueTimeZone()` (`src/common/utils/league-timezone.util.ts`) gives the country's zone. The
  settings field is a list now. Two production bugs were fixed on the way: the organisation
  settings' Profil tab could not save anything without a rename, and a competition profile update
  wiped its unsent JSON fields.
  - **Backfill still pending:** the four local seeded organisations have no zone. One statement
    for the owner to approve:
    `UPDATE "BusinessProfile" SET timezone = CASE t.tenant_slug WHEN 'liprobakin' THEN 'Africa/Kinshasa' ELSE 'Africa/Lubumbashi' END FROM "Tenant" t WHERE t."businessProfileId" = "BusinessProfile".id AND t.tenant_slug IN ('liprobakin','libago','libuk','eubabunia');`
- **Step 3, next:** the `public-site` module (§7), with these findings from the code:
  - team slugs are unique per competition and game slugs per season, so every lookup is scoped
    by competition, as §5's paths already are;
  - the global throttle (300/min per IP) would put every visitor behind Vercel's servers in one
    bucket, so the module needs its own limit or `@SkipThrottle`;
  - `League.settings` was overwritten wholesale by `PUT /leagues/:id/settings`, so
    `publicPlayerIdentity` needs that update to merge first;
  - the box score and the leaderboard have no player-visibility filter today;
  - a knockout's `PlannedFixture` is deleted when promoted, so a round lists its games and its
    remaining placeholders, not a linked bracket.


- The `public-site` module and its endpoints and DTOs (§7).
- `buildStandingsView` extracted, with the knockout-phase fallback fixed (§4.3).
- The time zone:
  - pre-filled silently at sign-up;
  - a settings field, and the dashboard's *À compléter* card until it is confirmed;
  - backfill the four seeded organisations **through the settings UI or one reviewed SQL
    statement, never a reseed**;
  - on production, the owner sets theirs.
- Tests (§7). Regenerate the frontend types.

**Done when:**
- LIPROBAKIN's public standings match the admin standings row for row;
- LIBAGO's phases and pools resolve, and its knockout result no longer blanks the table;
- a 23:30 game in Goma lands on the right day;
- `bc-hirondelles` resolves per organisation.

### 5B.2: The frame (≈ 1 day)

- The server layout, `notFound()`, the branded 404 and the empty-site state.
- Header, bottom nav, footer and share button.
- The two 308s (`/playoff`, `/players`), `format.ts`, and the site colour variables with the curated
  palette.
- Title templates, robots and sitemap (tenant branch).

**Done when:**
- an unknown subdomain returns 404 with the *créez la vôtre* link;
- a new empty organisation shows a clean one-screen site;
- `view-source` of the home page contains the league's name;
- no link in the frame 404s.

### 5B.3: Classement and Matchs (≈ 1.5 days)

The two pages fans open most, plus the match page with its box score.

**Done when:**
- the numbers match the signed export for LIPROBAKIN;
- postponed and cancelled games show as such;
- at 390 px the table reads without horizontal scrolling for rank, club and PTS;
- each page's JavaScript stays under 200 KB compressed (5A §6), with no UI-kit barrel imports.

### 5B.4: Accueil and Équipes (≈ 1 day)

**Done when:** LIPROBAKIN's home shows this week's games and last weekend's results (not August),
and a club page shows its record, next match, results and roster.

### 5B.5: Conditional sections (≈ 1 day)

Marqueurs (check against LIBAGO), Phase finale (LIBAGO, EUBABUNIA), Actualités.

**Done when:** each appears only for the leagues that have data for it.

### 5B.6: Sharing (≈ 1 day)

OG route handlers (league card, match card), JSON-LD, share button everywhere it belongs, and the
standings card if time allows.

**Done when:** a match link and a standings link pasted into WhatsApp show the right title,
description and image.

### 5B.7: Clean up and brand (≈ 0.5 day)

- Delete the old frontend code and the old `public-*` controllers.
- Remove the `globals.css` safelist.
- The two-colour setting in organisation settings (only if it stays small, §4.6).
- The *show player identities* switch in competition settings (§4.9). It is read by 5B.1's API from
  the start, defaulting to on, so this sprint only adds the control.

**Done when:** `grep` finds no caller of the old endpoints; typecheck, lint and tests are clean.

---

## 11. What only the owner can supply

**Settled on 2026-09-26:**

- **Time zone:** pre-filled silently, then confirmed from the dashboard (§4.4).
- **Colours:** primary and accent from a short list, and only if it stays cheap (§4.6).
- **Visibility:** PRIVATE means served but never shown from `.com`; HIDDEN means the subdomain does
  not resolve (§7).
- **Rosters:** positions are shown; showing identities is a per-competition switch (§4.9).
- **Communiqués:** they stay (§6).
- **Paths:** English, with *games* (§5).

**Still open:**

1. **ARCHIVED organisations:** 404 like HIDDEN (the current assumption), or served read-only as a
   record of past seasons?
2. **PRIVATE and Google:** `noindex` (the recommendation), or indexable?
3. **The curated palette:** approve the proposed eight colours when 5B.7 comes.
4. **The seeded organisations' time zones on production:** set by each organiser through the new
   card.

---

## 12. Recommended order across 5A and 5B

You asked to start with the landing page, and it comes early in this order. But the landing's best
proof is a league site worth showing, and today's is not, so the landing ships in two passes.

1. **5B.0**: stop the leak (half a day, protects people).
2. **5A.1**: clear the ground (redirects, signed-in redirect, robots unblocked, AdSense out).
3. **5A.2**: the landing page, with **admin-side screenshots**. The *Voir un exemple* link and
   the §6.5 league-site section stay hidden.
4. **5A.3**: SEO and sharing for `.com`.
5. **5B.1 → 5B.4**: the league site's API, frame, table, matches, home and clubs.
6. **Back to 5A**:
   - fill the `demo` league;
   - take the league-site screenshots;
   - switch on *Voir un exemple* and the §6.5 section;
   - **5A.4**: the end-to-end sign-up on production, with real e-mail.
7. **5B.5 → 5B.7**: conditional sections, sharing, clean-up.
8. **Onboard LIPROBAKIN in person** (`ROADMAP_V2` item 22) and watch where they hesitate.

Estimated total: about 4.5 days for 5A and 8.5 days for 5B, so two and a half weeks of sessions, with the
owner's inputs (5A §11, 5B §11) as the gating items rather than the code.

---

## 13. Verification checklist (5B done)

- [ ] No public endpoint returns a blocklisted field (production `curl`, every endpoint).
- [ ] An unknown league subdomain returns **404**; a HIDDEN organisation returns 404; a PRIVATE one
      is served with `noindex`.
- [ ] LIPROBAKIN's `/standings` equals the admin table and the signed export: same order, same
      columns, same points.
- [ ] LIBAGO: phases, pools, scorers and knockout rounds all render. EUBABUNIA: pools, and a
      knockout phase with planned fixtures.
- [ ] Every time on the site equals the hall's time, whatever the reader's device zone and the
      server's.
- [ ] `view-source` on each page type contains the data. First-load JS under 200 KB compressed.
- [ ] WhatsApp previews for home, standings, a match and a club.
- [ ] Both themes; 390 px and 1440 px; no raw palette colours in `components/league-site`.
- [ ] `/playoff` and `/players` redirect; no link on the site 404s.
- [ ] A competition with player identities switched off shows no names anywhere on the site.
