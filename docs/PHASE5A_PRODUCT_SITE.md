# Phase 5A — The product site (`dxscores.com`)

> Written 2026-09-25, from four audits run that day against the code, the running app and
> production: every public page, the routing/auth/SEO plumbing, the tenant sites, and outside
> research on how other products do this. The companion plan for league sites is
> **`PHASE5B_LEAGUE_SITES.md`**. They are separate plans because the two domains serve different
> people with different jobs; they share only a middleware file and a design system.
>
> This supersedes `ROADMAP_V2` §3 Phase 5 items 19–23, the ordering in `HANDOVER_PHASE5.md` §3,
> and `public-layout-navbar-map.md` (an old generic manifest: testimonials, "book a demo", pricing
> tiers, a `leagueCode` login field — none of it true of this product now).

> **Updated 2026-09-26** with the owner's answers: English paths, a presentation video, the free
> sentence, the founder note, contact details, the sports claim, the password rule, and Mango Mail
> for the mailbox. §11 records what is settled and what is still open.

---

## 0. How to use this document

Read §1–§3 before touching anything: they are the decisions. §4–§8 are the specification. §9 is
the build order in sprints, each with a *done when*. §11 is what only the owner can supply. Every
claim about the current code carries a path so it can be re-verified — the code will move.

**The rule for everything below: keep it stupid simple.** One landing page, a few honest pages,
nothing that needs maintaining by a team that does not exist. When in doubt, cut or ask.

---

## 1. Who this site is for, and the one job it has

**The visitor** is a person who runs a competition — a federation secretary, a league's community
manager, a club organiser setting up a tournament — mostly in the DR Congo, French-speaking, on a
phone, arriving from one of four places:

1. the footer of a league site (`… · Propulsé par DXScores`) — **this will be the biggest source**;
2. a link forwarded on WhatsApp;
3. the owner showing it to them in person;
4. a search for something like *logiciel classement basketball*.

**The job:** in ten seconds they understand what it does; in one minute they trust it enough to
try; in three minutes they have an organisation, a competition and a public site. Nothing else on
this domain matters as much as that path.

**The second visitor** is someone who already uses it. They do not want the landing page at all —
they want their dashboard (§5).

---

## 2. Where it actually stands (2026-09-25)

The honest summary: **the marketing site works against the product.**

- **Nothing leads to sign-up.** All three landing CTAs go to "Request a demo" / "Request a Custom
  Quote" at `/contact`, whose form has no submit handler and no backend. The header's
  "Tableau de bord" button links to `/login`. The only way to `/register` is via the login page.
  The product is self-serve (`HANDOVER_PHASE5` §1.4); the site says "talk to sales".
- **It is in English and says "Elenem"**, on a French-only product being renamed DXScores.
- **It states three different prices for a free product**: `$399/year` (landing), `$399/season`
  (`/pricing`), `0 $ / 50 $/mois / 250 $/mois / Sur devis` with a 15-team limit (`/plans`).
- **It claims things that do not exist**: custom domains, white-label, live stats, MVPs and clean
  sheets, referee assignment, task automation, immutable logs of every score, automatic backups,
  "99.98% uptime", push notifications, mobile apps, an API, "set up by our experts", a "Coach Mike"
  WhatsApp mock with football scores.
- **`/news` is fake** — hardcoded mock posts including "LeBron James" playing in Goma.
- **Sign-up's consent line links `/terms` (a placeholder) and `/privacy` (a 404).**
- **SEO is absent and actively blocked**: one global title *"Elenem Systems"*, an icon link to a
  missing `/favicon.png`, no sitemap, no robots, no OG image — and in production
  `https://dxscores.com/robots.txt` **307s to `/login`** (verified), because middleware treats it
  as a protected path.
- **`https://dxscores.app` (the bare tenant domain) serves the entire app** (verified), a duplicate
  copy of the product on a second origin.
- **Production e-mail goes nowhere.** With no `MAIL_*` variables the mail service falls back to an
  Ethereal test inbox (`elenem-backend/src/mail/mail.service.ts:34`). Verification codes, invitations
  and **password resets** are never delivered — a self-serve user who forgets their password is
  locked out for good.
- **Colour**: the marketing pages use the legacy `primary` scale 129 times (a fixed `#0a3a8d` that
  does not follow dark mode — `globals.css` itself calls it unreadable on dark) and 48 raw palette
  classes. Auth and onboarding, by contrast, are token-clean and the quality reference.

What is **good** and stays: `/register` → `/onboarding` (`components/onboarding/signup-flow.tsx`,
`setup-wizard.tsx`) is a genuinely good two-step sign-up plus three-step wizard that handles a
season already under way; the `AuthShell`/`SplitShell` frames; the tagline the auth screens already
carry — **« Le classement se calcule tout seul. »**

### Page verdicts

| Route | Verdict | Why |
|---|---|---|
| `/` landing (378 lines, EN) | **Rewrite** | §6 |
| `/features` (1131, EN) | **Delete** → 308 to `/#fonctionnalites` | ~8 true points out of dozens; they move to the landing |
| `/pricing` (313, EN) | **Delete** → 308 to `/#gratuit` | $399, tiers, "pay per season" |
| `/plans` (192, FR) | **Delete** → 308 to `/#gratuit` | four priced tiers, linked from nowhere |
| `/contact` (187, EN) | **Rewrite** as a static page | form goes nowhere; unknown `?intent=` crashes the page |
| `/news`, `/news/[slug]` + `data/mock*` | **Delete** | fake content |
| `/games`, `/tenants` (directories) | **Delete from the site for now** → 308 to `/` | cross-organisation lists; production holds test sign-ups ("Ligue de Baskketball de France"); a curated showcase replaces them later (§10) |
| `/about`, `/api`, `/docs`, `/leagues`, `/standings`, `/teams` | **Delete** | `ComingWithLaunch` placeholders with nothing coming |
| `/legal`, `/terms`, *(missing)* `/privacy` | **Write** (same English paths) | sign-up links them; §7 |
| `/upload`, `/upload2`, `/welcome`, `/health` | **Delete** | experiments; `/welcome` is the legacy GENERAL_USER path |
| `(app)/tenant/create` + `components/forms/tenant/create/*` | **Delete** | superseded by `/register`; hardcodes `.elenem.site` |
| `app/mvpFeatures/`, `cmtjd14hs01qgpqsdwlpaz34l/` (tracked `.pyc` junk), unused `public/` files | **Delete** | leftovers |
| `/login`, `/register`, `/forgot-password`, `/verify-email`, `/accept-invite`, `/access-denied`, `/onboarding` | **Keep**, rename strings, small fixes in §8 | the working core |

---

## 3. Decisions and pushbacks

These are the calls the plan is built on. Each is reversible; none should be re-argued mid-build.

### 3.1 The message is the artefact, not "a platform"

*"One system to run your league"* could be any of a thousand products. What only this one does is
the thing LIPROBAKIN does by hand every matchday: **recalculate the table, have a designer redraw
it, publish it, argue about it** (`ROADMAP_V2` §6 A2). The headline says the end of that:

> **Le classement se calcule tout seul.**

It is already the product's voice (`components/auth/auth-aside.tsx:30`), it is true, and it is the
one sentence a secretary repeats to a colleague.

### 3.2 Free, said once, without inventing a future

No pricing page. **"Gratuit"** appears in the hero's CTA, once as a section, and once in the FAQ.
No tiers, no "Pro" page, no "Upgrade" button: pricing does not exist yet, and a page that invents it
is a promise someone will hold the owner to.

**Decided (owner, 2026-09-26):** what DXScores does today stays free for good; Pro plans with
*additional* features may come later, and adoption comes first. The sentence:

> *« Tout ce que DXScores fait aujourd'hui restera gratuit. Des offres Pro, avec des fonctionnalités
> en plus, pourront venir plus tard — elles s'ajouteront, elles ne retireront rien. »*

### 3.3 No social proof yet — so build the slot, not the content

There are no users, testimonials or ratings, and inventing any would destroy the one thing the
product sells: trust in numbers. But they will come fast once one federation is on it, so the page
is built **ready to receive them** without a CMS:

- a typed content file, `content/site.ts`, holding `testimonials: []` and `showcaseLeagues: []`;
- the landing renders a *Témoignages* section and a *Ils utilisent DXScores* strip **only when the
  arrays are non-empty**. Adding the first quote is a one-line commit, not a design task.
- **No counters** ("X ligues, Y matchs") until the numbers are worth showing. Zero is worse than
  nothing. Revisit at ~5 real leagues (§10).

In their place, the proof is **the product itself**: real screenshots and a live example site.

### 3.4 The live example is a demo league — not LIPROBAKIN

The strongest proof available is *"here is a league site, go and look"* (Plausible launched on
exactly this — a public live demo). It must be a **demo organisation with fictional clubs**,
clearly labelled *Ligue de démonstration*, at `demo.dxscores.app`, **not** LIPROBAKIN:

- using a real federation's name and results in marketing without its written consent is not ours
  to do, and a first customer who discovers it on our homepage is a lost customer;
- a demo can be kept complete and tidy (every result entered, a box score, a playoff phase, a
  couple of posts) in a way a real league mid-season never is.

It is also where the landing's screenshots come from. **Create the `demo` tenant in production
early** — the slug is not reserved, and it is first come, first served.

**How it gets created:** as a real sign-up, through the production API, by a script modelled on
`elenem-backend/scripts/seed-dev.mjs` (which already drives a live API rather than the database).
No Neon access, no database credentials, no API key: it goes through the same validation as any
user, which is also a test of production. It needs:

- an e-mail address the owner controls for the demo's admin account (`demo@dxscores.com` once the
  Mango mailbox exists, or any address the owner reads);
- the owner's go-ahead to run it against production.

Its content: two competitions (Messieurs, Dames), about ten fictional clubs each, rosters, a season
half played with scores, box scores on a few games, a playoff phase planned, two *communiqués*. The
login throttle (5 per minute per IP) means the script paces itself.

### 3.5 Contact is WhatsApp and an address, not a form

The form sends nothing and there is no backend for it. A lead form also needs a mailbox, spam
handling and someone watching it. The audience lives on WhatsApp. `/contact` becomes a short static
page:

- **WhatsApp:** +243 975 092 470 → `https://wa.me/243975092470` with a prefilled *« Bonjour, je
  voudrais utiliser DXScores pour ma ligue. »*
- **E-mail:** `contact@dxscores.com`, a real mailbox at **Mango Mail** (chosen by the owner
  2026-09-25; its DNS records sit at the domain root and do not touch Resend's).
- One honest line about response time, only if it is true.

### 3.6 Logged-in visitors skip the landing (the Vercel / Resend model)

Verified on 2026-09-25: `vercel.com/home` and `resend.com/home` serve the landing with
`canonical` pointing at the root; logged-in users get the product at `/`. Linear does the same with
`/homepage`. Search engines never carry a session cookie, so they always see the landing. §5 has
the mechanism. The landing's second address is **`/home`**, like Vercel's.

### 3.7 E-mail in production is a launch blocker, not a nice-to-have

Self-serve means nobody can reset a password for a user. Until Resend is configured, **every
forgotten password is a permanently lost account**, and every invitation is a dead link. It is an
infrastructure step (§9, sprint 5A.4), and `INFRASTRUCTURE.md` step 9 names the wrong variables for
this code — the mail service reads `MAIL_HOST / MAIL_PORT / MAIL_SECURE / MAIL_USER / MAIL_PASS /
MAIL_FROM` (SMTP), not `RESEND_API_KEY`. Correct that step when doing it.

### 3.8 Things deliberately not built

| Not now | Why | When |
|---|---|---|
| Features page | The landing carries the true list; a separate page invites padding | When the list outgrows a section |
| Pricing page | No pricing exists | When the owner decides one |
| Product blog / guides | Nobody to write it | When a question gets asked three times — answer it once, publicly |
| Directory of leagues on `.com` | Test sign-ups in production; thin with one league | Curated showcase at ~3 real leagues |
| English version | French-only launch | When a non-francophone federation asks |
| Contact form / CRM | WhatsApp is where the audience is | If WhatsApp volume becomes unmanageable |
| Custom domains for leagues | Not built; 50-domain Hobby ceiling | Phase 5B+, see that plan |
| AdSense on `.com` | Payload, and ads beside a product page look cheap | **Remove now** (`app/layout.tsx:41-46`) |

---

## 4. Information architecture

```
dxscores.com
  /                     landing (anonymous)  ·  307 → role dashboard (signed in)
  /home                 the same landing, always; canonical → /
  /login  /register     307 → dashboard when already signed in
  /forgot-password  /verify-email  /accept-invite  /access-denied   (unchanged, rebranded)
  /onboarding           (unchanged)
  /contact              static: WhatsApp + e-mail
  /legal  /terms  /privacy
  (app routes)          /tenant /league /team /admin /account /game /player /post … (noindex)

  308 redirects:  /features → /#fonctionnalites   /pricing /plans → /#gratuit
                  /games /tenants /news/* /about → /

dxscores.app, www.dxscores.app   308 → https://dxscores.com
```

**Paths stay in English** (owner, 2026-09-26), like the back office's. What the reader sees —
labels, titles, copy — is French.

---

## 5. The signed-in redirect

**Where:** `middleware.ts`, on the app host only (not a tenant host), **before** the `publicPaths`
early return (`/` is in that list, so the check must come first).

**Rule:** if `pathname` is exactly `/`, `/login` or `/register` and the `accessToken` cookie
verifies with `verifyJWTForGate` (`utils/verify-jwt.ts`), return a **307** to the user's home.

- **Accept an expired-but-validly-signed token.** Access tokens last an hour; the cookie and the
  refresh token live seven days and are written together (`store/auth.store.ts:33`). Requiring a
  fresh token would almost never fire. The dashboard's own client refresh takes over from there.
- **Never 308.** Browsers cache permanent redirects; a user who signs out would be sent to a
  dashboard for ever.
- **The destination comes from the token's roles**, via one function: extract a JWT-based
  `homeForRoles(roles)` from `utils/post-auth-redirect.ts` and use it here, in the login page, and
  in the two duplicate maps (`app/not-found.tsx:13-18`, `components/layouts/AppLayout.tsx:95-102`,
  which also lists `/player/dashboard` etc. that do not exist). `GENERAL_USER` →
  `/account/dashboard`.
- **Garbage cookie:** `verifyJWTForGate` fails → serve the landing and delete the cookie, as the
  protected branch already does.

**`/home`:** `app/(public)/home/page.tsx` renders the same landing component, with
`alternates.canonical: '/'`. Added to `publicPaths`. The in-app account menu gets a quiet
*"Site DXScores"* link to it.

**Two fixes this makes necessary** (both found in the plumbing audit):

1. **A failed refresh must navigate.** `services/api.ts:73-79,112-116` calls `logout()` and leaves
   the page; `AccessGate` then spins for ever because it reads `user === null` as loading. Send the
   user to `/login?redirect=<path>`.
2. **Sign-out must be a hard navigation to `/`** (`window.location.assign('/')`) and should call
   `POST /auth/logout`, which exists and is never called (`auth.store.ts:52-65`). Otherwise a
   cached redirect or stale query data can land a signed-out user on a dashboard.

Also: **validate the login `redirect` parameter** — a plain path starting with `/` and not `//`.
Today it is pushed as-is (`LoginClientPage.tsx`), an open redirect (`UI_CONVENTIONS` §8).

---

## 6. The landing page

One page, server-rendered. **The JavaScript budget, measured 2026-09-27 on a production build:**
**under 200 KB compressed on first load, of which at most ~75 KB is ours.** React and the Next.js
runtime alone are ~107 KB compressed, so the "under 100 KB" first written here (from
`DESIGN_AND_MVP_PLAN` §3) cannot be met by any App Router page and is withdrawn. What the budget
does forbid is shipping unused code to visitors. The first measurement found 666 KB on the landing:
- Sentry, loaded on every page whether configured or not;
- the whole `components/ui` barrel, pulled in by a loading boundary;
- zustand, axios and zod, pulled in by the header's sign-in check and by the root 404.

All three are fixed, which brought it to 180 KB. No `framer-motion` on public pages: it is a
dependency, but nothing public imports it, and it stays that way.

Section order, drawn from early Plausible, Tally and Linear pages, which launched without social
proof. Copy below is a **draft in French** for the owner to edit, not final text. Anything in
*italics* is direction, not copy.

### 6.1 Hero


- H1: **Le classement se calcule tout seul.**
- Lead: *DXScores tient le calendrier de votre ligue, calcule le classement à partir des
  résultats et publie tout sur le site de votre ligue — prêt à partager sur WhatsApp.*
- Primary CTA **Créer ma ligue — gratuit** → `/register`. Secondary **Voir un exemple** →
  `https://demo.dxscores.app` (new tab).
- Under the buttons, small: *Sans carte bancaire. Le site de votre ligue est en ligne dès
  l'inscription.* (True: the subdomain resolves the moment the tenant exists.)
- *Visual:* a phone frame showing the demo league's standings, overlapping a laptop frame showing
  the calendar. Real screenshots, WebP, `next/image` with `sizes`, `priority` on the phone only.

### 6.2 Le problème, en trois lignes

*Their own workflow, in their words (`liprobakin-domain`):*

> Chaque journée, quelqu'un recalcule le classement à la main. Un graphiste le refait pour les
> réseaux. Et à la fin de la saison, les chiffres sont contestés.
>
> **Avec DXScores, le classement vient des matchs.** Chacun peut voir d'où vient chaque point.

(Not *"personne ne peut le contester"* — that is a promise about people, not software.)

### 6.3 Comment ça marche — `#comment-ca-marche`

Three numbered steps, each with a small real screenshot:

1. **Créez votre ligue.** Vos compétitions, vos équipes. Quelques minutes, même en pleine saison.
2. **Saisissez les résultats.** Le score final en quelques secondes, depuis votre téléphone. La
   feuille de marque quand vous l'avez.
3. **Partagez.** Classement, calendrier et résultats sont à jour sur
   *votre-ligue*.dxscores.app. Le classement officiel s'exporte en PDF, en image ou en Excel.

### 6.3b Présentation en vidéo — `#video`

The owner is making YouTube videos that explain the product; at least one lives on the landing,
right after *Comment ça marche*, titled *Voir DXScores en 3 minutes* (or its real length).

**Never a plain YouTube iframe.** One embed loads over a megabyte of JavaScript before anyone
presses play — several times the page's whole budget — and would cost a visitor on mobile data real
money. Use a **click-to-load facade**: the video's thumbnail (`https://i.ytimg.com/vi/<id>/hqdefault.jpg`,
through `next/image`) with a play button; the `youtube-nocookie.com` iframe replaces it only when
tapped. About twenty lines, no dependency.

The section renders only when `content/site.ts` has a `presentationVideoId`, so the page ships
before the video does.

### 6.4 Ce que fait DXScores — `#fonctionnalites`

Six items, each **true today** (checked against the product on 2026-09-25). Icon, title, one line:

| Title | Line | Backed by |
|---|---|---|
| Un calendrier pour toutes vos compétitions | Salles, horaires, conflits détectés, reports et annulations avec leur motif. | calendar module |
| Un classement qui se calcule seul | Vos règles de points, forfaits, départages, zones de qualification et de relégation. | standings engine + rules |
| Le classement officiel, prêt à signer | En-tête, cachet et signature. En PDF à imprimer, en image pour WhatsApp, en Excel. | standings export |
| La feuille de marque | Buts, paniers à 2 et 3 points, Lancers francs par joueur — et les meilleurs marqueurs. | box score + leaderboard |
| Phases et play-offs | Poules, phase finale, barrages : vous composez le format, saison après saison. | stages |
| Votre équipe | Invitez les personnes qui saisissent les résultats, chacune avec son rôle. | users + invites |

Explicitly **not** listed: anything live, anything for fans to log into, custom domains, mobile
apps, payments.

### 6.5 Le site de votre ligue — la visibilité

*The link between the two domains, the reason 5B exists, and the second half of the founder's
argument (§6.9): organisation* and *visibility.* Heading: **Votre ligue mérite d'être vue.** One
line under it: *Chaque ligue reçoit son propre site — classement, calendrier, résultats — mis à jour
à chaque score, sans que personne n'ait à le tenir.* Two phone screenshots of the demo site
(standings, a game). Three short points: *Toujours à jour — il se met à jour à chaque
résultat.* · *Lisible sur n'importe quel téléphone.* · *Un lien qui s'affiche proprement sur
WhatsApp.* CTA **Visiter le site de démonstration**.

(The third point is only true once 5B's metadata work lands. Ship this section after 5B.1, or
drop the third point until then.)

### 6.6 Gratuit — `#gratuit`

One short block: *DXScores est gratuit. Pas de carte bancaire, pas de limite d'équipes ni de
compétitions.* Plus the sentence decided in §3.2.

### 6.7 Slots for social proof (hidden until filled)

`Témoignages` and `Ils utilisent DXScores`, rendered from `content/site.ts` only when non-empty
(§3.3). The component is built and checked with sample data in a story or a test, then shipped
empty.

### 6.8 Questions fréquentes

Six questions, answers of one or two lines, all true:

- **Faut-il installer quelque chose ?** Non. DXScores s'ouvre dans le navigateur, sur téléphone
  comme sur ordinateur.
- **Notre saison a déjà commencé. C'est trop tard ?** Non. Vous saisissez les matchs déjà joués
  avec leur score, et le classement se reconstruit.
- **Les joueurs doivent-ils créer un compte ?** Non. Les effectifs sont saisis par la ligue.
- **Qui peut modifier les résultats ?** Seulement les personnes que vous invitez. Chaque
  modification d'un match est gardée dans son historique.
- **Quels sports ?** Tous les sports collectifs qui se jouent en matchs et en classement :
  basketball, football, volleyball, handball… Les règles de points se règlent pour chaque
  compétition. La feuille de marque par joueur est, pour l'instant, celle du basketball.
  *(Owner's call, 2026-09-26: any team sport shaped like football or basketball. The last sentence
  keeps it true — the per-player box score counts free throws, 2- and 3-pointers.)*
- **Est-ce vraiment gratuit ?** *(the §3.2 sentence.)*

### 6.9 Un mot du fondateur

For a product with no users yet, a real person is the strongest trust signal there is. Drafted from
the owner's own words (2026-09-26), for the owner to edit into the final version:

> *Je suis entraîneur de basketball chez les jeunes. Chaque saison, suivre le classement, le
> calendrier et les statistiques de mon équipe voulait dire prendre des notes à la main — et c'était
> pénible. J'ai construit DXScores pour que les petites ligues gardent la trace de leur saison, et
> que chaque équipe puisse mieux se préparer.*
>
> *Beaucoup de ligues restent petites, pas seulement faute de moyens, mais parce que personne ne
> les voit. Et un talent qu'on ne voit pas, personne ne peut le révéler. S'il y a deux choses qui
> manquent au sport en Afrique, ce sont l'organisation et la visibilité. DXScores existe pour
> apporter les deux.*
>
> **Idy Rachid Jonathan** — fondateur · WhatsApp +243 975 092 470

One line from the owner's note is deliberately softened: *"the same local and global attention as
the biggest leagues in the world"* is the ambition, but on a page it reads as a promise the product
cannot keep on its own. *"Personne ne les voit"* carries the same idea without it. A photo is
optional and helps.

### 6.10 Final CTA band

**Votre prochaine journée, sans calcul à la main.** — **Créer ma ligue — gratuit**.

---

## 7. Navigation, footer, legal pages

### Navbar (new `components/marketing/site-header.tsx`, server component + one tiny client menu)

- **Desktop:** DXScores wordmark · *Fonctionnalités* · *Comment ça marche* · *Exemple* ·
  — right: **Se connecter** (ghost) · **Créer ma ligue** (primary).
- **Signed in** (only reachable on `/home`): the two buttons become one, **Tableau de bord**.
  Read from the auth store on the client; the server render shows the anonymous version.
- **Mobile:** wordmark · **Créer ma ligue** (compact) · menu button → a sheet with the same links
  plus *Se connecter*.
- Sticky, transparent over the hero, `bg-canvas/80` + backdrop blur + hairline once scrolled.
- Delete the FR/EN toggle (`useI18n` changes nothing — `hooks/useI18n.ts` is dead code) and the
  theme toggle from the marketing header; the OS decides, the app has the control.

### Footer (rewrite `components/layouts/PublicFooter.tsx`)

Wordmark + *Le classement se calcule tout seul.* — three columns: **Produit** (Fonctionnalités,
Comment ça marche, Site de démonstration, Créer ma ligue, Se connecter) · **Contact** (WhatsApp,
e-mail) · **Légal** (Mentions légales, Conditions d'utilisation, Confidentialité). Bottom line:
`© 2026 DXScores`. Drop *"Le logiciel qui alimente les ligues… en Afrique et au-delà"* (zero users)
and *"Prêt pour PWA"* (false).

### Legal pages

Short, plain French, honest about what is collected: account holders' names and e-mails; players'
names, numbers and statistics **entered by the league**; published on the league's public site.
Two points the pages must make explicitly:

- **Minors.** Youth competitions publish children's names and scores. The league that enters them
  is responsible for having the right to; the product respects player visibility settings.
- **Who operates the service:** **Idy Rachid Jonathan**, as an individual. DXScores is a side
  project with no company behind it (owner, 2026-09-26). Contact: `contact@dxscores.com` and
  WhatsApp +243 975 092 470. Hosting providers named: Vercel (site), Railway (API), Neon
  (database), Resend (e-mail).

These are **templates, not legal advice**. They exist because sign-up already asks users to accept
them.

---

## 8. Design additions and the rest of the polish

### 8.1 Design system — additions only

The public site uses the same tokens as the app (`app/globals.css`; rules in
`elenem-design-system` memory and `UI_CONVENTIONS.md`): no raw palette colours, no `dark:`, colour
only when it means something. What marketing adds is small:

- **Two display type steps** as `@theme` tokens: `--text-display` (≈ `clamp(2.25rem, 6vw,
  3.75rem)`, tight leading, `-0.02em` tracking) and `--text-title` (≈ `clamp(1.5rem, 3vw, 2.25rem)`).
- **Section rhythm:** one `marketing-section` utility (`py-16 sm:py-24`) and one container width
  (`max-w-6xl px-4 sm:px-6`).
- **Grounds** (added 2026-10-01, after the owner noted every section was white or near-white). The
  brand has one colour (§8.2), so a section stands out by that colour as a ground, not by a second
  hue. Four grounds, each with a job, both themes defined in `globals.css`:
  - `bg-canvas`: the default.
  - `bg-surface`: a quiet band (the founder's word).
  - `bg-wash` (new): the brand navy as a pale ground, for the **one** section that carries the
    product (Fonctionnalités), and the hero's top light. Text tokens keep AA on it (ink-subtle
    4.56:1 light, 4.82:1 dark).
  - `bg-accent`: the call to act (the final CTA band).

  Pictures stand straight on their ground in a `.halo` (a soft light of `--t-halo` behind them),
  never in a bordered box. A section with halos clips them (`overflow-hidden`). Not for the app,
  where a tint means "selected".
- **Motion, CSS only:**
  - Hover: buttons and cards move `-1px` and go from `shadow-e1` to `shadow-e2`, and `border-line`
    becomes `border-line-strong`, over 150–200 ms.
  - Links get an accent underline that grows from the left.
  - On scroll, sections fade in and rise 8 px, once. Use `animation-timeline: view()` as a
    progressive enhancement, so browsers without it show the section statically.
  - Everything sits behind `@media (prefers-reduced-motion: no-preference)`.
  - No JavaScript animation library.
- **Buttons:** `Button size="lg"` already exists (`components/ui/button.tsx:37`). Use it for the
  hero; no new variants.
- **Screenshot frames:** one `DeviceFrame` component (phone and laptop), drawn with borders and
  radius tokens, not images.
- **Retire the legacy `primary` scale** from public code (129 uses) in favour of `accent` tokens.
  Remove `text-primary-light`, which is undefined.

### 8.2 The rename, as far as users can see

Every user-visible "Elenem" on public, auth and app-shell surfaces: the list is in the audit
(`app/layout.tsx:16-17`, `not-found.tsx`, `access-denied`, `register/page.tsx`, `split-shell.tsx:58`,
`auth-aside.tsx:33`, `sidebar-brand.tsx`, `users-list-view.tsx:162`, `import-results-dialog.tsx:147`,
`services/calendar.ts:161` download name, the `elenem.site` fallbacks in `tenant-url.ts:12` and
`resolveTenantSlugFromHostname.ts:47`, e-mail sender name). **Not** localStorage keys
(`elenem-theme`, `elenem_locale` — renaming them resets users' preferences for nothing), not
repositories.

**The mark:** until the owner has a logo, a typographic wordmark — **DXScores** in the product
font, with the *dx* set in the accent. It is an SVG component driven by tokens, so it follows the
theme (the current PNG is dark blue on dark in dark mode). Favicon, `apple-icon`, and the OG image
are generated from the same wordmark.

#### Logo brief (the owner designs it; this is what it must satisfy)

A logo here has four jobs: a 16 px browser tab, a phone's home screen, the corner of a league site
that is not ours, and a WhatsApp preview. So:

- **Two lockups:** a **symbol** that stands alone (square: favicon, app icon, avatar) and a
  **wordmark** *DXScores* beside it.
- **One colour.** It must work as solid deep blue on white *and* solid white on dark. No gradient,
  no shadow, no 3D, no photo-like detail. If it needs two colours to be recognisable, it is too
  complicated.
- **Legible at 16 px.** Shrink it to a favicon before falling in love with it.
- **Not a basketball.** The product is multi-sport and a ball is what every sports app has. The
  idea worth drawing is the name's own: *dx* — the derivative, *deriving* the table from the scores.
- **Delivered as SVG**, not PNG. An AI image tool produces a raster sketch; trace the chosen one to
  vector (Figma's pen tool, Illustrator, or a vectoriser such as vectorizer.ai), then simplify.
  Once there is an SVG, it becomes a token-driven component, the favicon set and the OG image in
  under an hour.

Three directions to try, each as a prompt for an image model (ChatGPT, Ideogram, Midjourney…).
Generate several of each, keep the simplest:

1. **The *dx* monogram.** *"Minimal flat vector logo symbol: a geometric lowercase 'd' and 'x'
   joined into a single monogram, bold, rounded terminals, single solid deep navy blue (#0a3a8d)
   on pure white, no text, no gradient, no shadow, centred on a square canvas, must stay legible
   at 16 pixels, in the style of modern tech brand marks."*
2. **The rising table.** *"Minimal flat vector logo symbol for a sports standings app: three or four
   horizontal bars of different lengths stacked like the rows of a league table, the top one
   subtly forming the letter 'd', single solid deep navy blue on white, no text, no gradient,
   geometric, square canvas, legible at favicon size."*
3. **The score delta.** *"Minimal flat vector logo symbol: a small triangle (delta) fused with the
   letter 'x', suggesting change and scores, bold geometric shapes, single solid deep navy blue on
   white, no text, no gradient, square canvas, simple enough for a 16-pixel favicon."*

Then for the wordmark: *"The word 'DXScores' in a clean geometric sans-serif (like Inter or
Geist), bold, 'DX' slightly heavier than 'Scores', dark navy on white, flat, no effects"* — or
simply set it in Inter Bold ourselves, which is what the interim wordmark does.

### 8.3 Onboarding friction (small, only what the audit found)

- The code preview shows only the bare code normally, but the full URL on error
  (`signup-flow.tsx:489-505`). Always show **`liprobakin.dxscores.app`**. It is the moment the
  user sees their site exists.
- *"Deux étapes, et votre ligue est prête"* (`signup-flow.tsx:340`) undersells the real length:
  two steps plus a three-step wizard. Say *"Votre compte, votre organisation — puis votre première
  compétition."*
- `AccessGate` spinner text *"Loading User Informations"* → French.
- `/forgot-password` and `/accept-invite` onto `AuthShell`.
- **Password rule — decided 2026-09-26: at least 8 characters, no composition rule.** Today it
  demands a lowercase letter, an uppercase letter and a digit or symbol as well. The owner was
  neutral and open to changing it if it works against sign-ups, and it does: on a phone keyboard,
  composition rules are where people give up. It is not weaker in the way that matters. Current
  guidance (NIST SP 800-63B) favours length over composition. Guessing is what composition rules
  defend against, and login is already throttled to 5 attempts a minute per IP. The live checklist
  stays as *advice* ("une majuscule rend le mot de passe plus fort"), not as a gate. Change it in
  both places: `services/onboarding.ts:27-32` and the backend's DTO validation.
- Remove the second creation path (`/tenant/create`, reached from `/welcome`,
  `/account/dashboard:94`, `/admin/tenants:74`).

### 8.4 SEO for `dxscores.com`

- Root metadata (`app/layout.tsx`):
  - `metadataBase: https://dxscores.com`, title template `%s · DXScores`, and a French default
    description of about 150 characters;
  - `openGraph` with `siteName` and `locale: fr_FR`, and a Twitter `summary_large_image` card;
  - icons generated as `app/icon.tsx` and `app/apple-icon.tsx`. Delete the `/favicon.png`
    reference.
- Per page: a title and description for `/`, `/contact` and the legal pages.
- **`noindex`** on: every auth page, `/onboarding`, and every app route. App routes also get
  `robots.ts` disallow rules as a second layer.
- **`app/robots.ts` and `app/sitemap.ts` branch on the `host` header.** The `.app` branch belongs to
  plan 5B. On `.com`, the sitemap lists `/`, `/contact` and the legal pages; any other host (the
  `.app` apex, `*.vercel.app` previews) gets `Disallow: /`.
- **Middleware must let metadata files through, on both hosts:** `/robots.txt`, `/sitemap.xml`,
  `/icon*`, `/apple-icon*`, `/opengraph-image*` and `/manifest.webmanifest`. Today they are
  redirected to `/login` on `.com` and rewritten into the tenant tree (404) on `.app`. Also exclude
  `txt`/`xml`/`webmanifest` in the matcher.
- **OG image:** one static 1200×630 PNG under ~300 KB (wordmark, headline, a phone screenshot). It
  must be PNG/JPEG, never AVIF, because WhatsApp previews need og:title, og:description and og:url,
  and the image under 600 KB.
- **JSON-LD:** `Organization` (name, url, logo, `sameAs` when social profiles exist) and `WebSite`
  on `/`.
  - `SoftwareApplication` is harmless to add but will not earn the rich result: Google requires
    ratings or reviews for it, and we invent neither.
- **Block `/public/public_tenant/*` on the app host.** It is the internal rewrite target and is
  reachable as a duplicate of every tenant page (middleware: 404 when the host is not a tenant
  host).
- **Search Console:** add the `dxscores.com` Domain property (DNS TXT at Cloudflare) and submit the
  sitemap.

---

## 9. Build order

Four sprints, each shippable on its own. Estimates assume one session each. **Before 5A.1, do 5B's
sprint 0** (public-API data leak; see that plan §2): it is small and it is the only item here that
protects real people.

### 5A.1: Clear the ground (≈ 1 day) — **done 2026-09-26**

Shipped as frontend `625ebc5`; verified locally for all four roles and on production (except the
signed-in redirect, which needs the owner's own login). Deviations from the list below:

- An **interim** header, footer and landing CTAs are in place: sign-up links and the price block
  removed. The real ones are 5A.2.
- A minimal `app/robots.ts` is in; the sitemap is 5A.3.
- The optional `proxy` rename was not done.
- `www.dxscores.app` reaches `dxscores.com` in two hops, because Vercel's domain setting redirects
  it to the apex first. One hop is possible by pointing that Vercel redirect straight at
  `dxscores.com`.


- **Delete** the pages and leftovers in §2's verdict table. Add the 308s in `next.config.ts`
  `redirects()`.
- **Middleware:**
  - the signed-in redirect for `/`, `/login` and `/register` (§5);
  - `/home` added to the public paths;
  - metadata files let through (§8.4);
  - the `dxscores.app` / `www.dxscores.app` apex 308 to `dxscores.com`;
  - `/public/public_tenant/*` blocked on the app host;
  - the dead public paths removed (`/landing*`, `/landin2`, `/explore`, `/blogs`, `/upload*`,
    `/welcome`, `/health`).
- **One `homeForRoles`** replaces the three role maps. Fix the failed-refresh navigation, make
  sign-out a hard navigation, and validate the login `redirect` parameter.
- **Remove AdSense** (`app/layout.tsx:41-46`, `public/ads.txt`, `google-ad-unit.tsx`).
- **Optional:** run the `middleware` → `proxy` codemod. It is only a deprecation warning in
  Next 16.1.

**Done when:**
- a signed-in admin opening `dxscores.com` lands on their dashboard, and `/home` still shows
  the landing;
- `curl https://dxscores.com/robots.txt` returns a robots file, not a redirect;
- `https://dxscores.app` redirects to `https://dxscores.com`;
- every deleted route redirects or 404s;
- typecheck and lint are clean.

### 5A.2: The landing page (≈ 2 days) — **done 2026-09-29**

Shipped as frontend `379360f` (the mark and the rename), `ad96834` (the JavaScript budget),
`8144bdb` (landing, contact and legal pages) and `2aa0ee4` (the owner's review); approved by the
owner on 2026-09-29. Deviations from the list below:

- **The landing leads with the calendar**, not the standings: in review the page read as a
  calculation tool, and the product is league management. Hero: *Organisez votre saison. Le
  classement se calcule tout seul.*; a `#calendrier` section follows the chores comparison.
- **No screenshots yet.** The hero and the calendar section use HTML mock-ups
  (`components/marketing/product-preview.tsx`: a laptop calendar, a phone standings table, a day
  panel), captioned *Exemple illustratif*. They cost no image bytes and stay sharp in both themes.
  Real screenshots replace them once the demo league is complete.
  *Update 2026-10-01:* the hero now shows two of the owner's captures of the demo league
  (`components/marketing/hero-screens.tsx`): the admin calendar in a browser window and a match
  page of the league site in a phone, captioned *Captures de la ligue de démonstration — clubs et
  joueurs fictifs*. Differences from §6.1: the phone shows a finished match (score and team
  comparison), not the standings; plain `<img>` with `srcset` instead of `next/image`, which would
  add a client component for files already resized and compressed (WebP, 22–70 KB, in
  `public/landing/`); high fetch priority on the calendar, the larger image. The phone's frame is
  drawn in CSS on tokens; the owner's PNGs stay outside the repository.
  *Update 2026-10-01 (5A.2b):* the three modules show captures too, and `product-preview.tsx` is
  gone (`components/marketing/module-visuals.tsx`). Organisation: the day panel of 30 September,
  three games in two halls. Points: the league site's standings in a phone, with the rule and the
  tie-breaks under the table. Publication: the owner's two WhatsApp link previews (a game, the
  standings), cut to the message bubbles — the chat around them was a real conversation with a
  real company, and its name and logo do not go on our homepage. Still pictures, not GIFs or
  loops: a readable GIF of the interface weighs megabytes on mobile data, goes stale with every
  change, and repeats what the presentation video is for. Each picture is about a phone's width,
  so it reads at its real size on a phone; all four load lazily, so the first screen costs
  nothing more, and `/` still loads 195 KB of JavaScript. On a phone each module reads title,
  picture, then points. `scripts/capture-landing.mjs` retakes the day panel and the standings
  from production (read-only; it needs `playwright-core`, installed with `--no-save`). Three
  points per module instead of four or five.
  *Then, on the owner's review (same day):* Organisation shows the « Ajouter un match » dialog,
  filled in (the owner's capture): a game placed with its hall, hour and score, and « Déjà ce
  jour-là » listing the day's other games. The day panel it replaces was a list; the dialog is the
  gesture itself. The WhatsApp bubbles come from a second capture, both Championnat Messieurs. The
  grey box behind each picture is gone: the section is the `bg-wash` band, its heading centred,
  each picture in a `.halo`, and the modules are labelled « 01 — Organisation » rather than with
  filled squares, which belong to « Comment ça marche ». `capture-landing.mjs` now retakes only the
  standings, which are public, so it no longer signs in.
- **The demo league is partial on production** (8 men's teams, 56 games, 11 results). The *Voir la
  démo* link stays hidden (`site.demoUrl: null`) until `scripts/seed-demo-league.mjs` (backend) has
  finished it. The script is resumable and needs the demo account's password.
  *Update 2026-10-01:* finished (12 men's and 8 women's clubs, results and scoresheets), and the
  league site is rebuilt (5B). *Voir un exemple* opens `https://demo.dxscores.app` in a new tab.
- The video slot is built and hidden until `presentationVideoId` is set.
- `/` ships 176 KB of compressed JavaScript on production, down from 666 KB.


- Wordmark SVG, icons and the rename of user-visible strings (§8.2).
- The design additions (§8.1). Build the header, footer and landing sections (§6, §7) as server
  components; the only client code is the mobile menu and the signed-in header state.
- The `demo` tenant created and filled on production, and screenshots taken from it (owner inputs:
  §11).
- `content/site.ts` with the empty social-proof arrays, and the sections that render from them.
- `/contact` and the three legal pages.

**Done when:**
- the landing reads correctly in both themes at 390 px and 1440 px;
- on a production build, `/` loads under 200 KB of compressed JavaScript and has no layout shift
  from images;
- every claim on the page appears in §6.4's *Backed by* column;
- the owner has approved the copy.

### 5A.3: SEO and sharing (≈ 0.5 day) — **done 2026-09-29**

Shipped as frontend `4447c31`. The owner's two steps (Search Console, the WhatsApp paste test)
remain. Deviations and findings:

- **A page's `openGraph` drops the root's image.** Next.js attaches the `opengraph-image` file at
  the root segment, but a page that sets `openGraph` replaces the whole object, image included.
  `content/seo.ts` `pageMeta()` therefore names the image itself, and every public page uses it.
  **Any new public page must go through `pageMeta()`**, or it shares with no picture.
- The OG image shows a slice of a standings table instead of a phone screenshot, because there are
  no screenshots yet (see 5A.2). It is set in Inter, read from `assets/fonts` at build time (OFL
  text alongside). It is 54 KB.
- `robots.txt` and `sitemap.xml` are rendered per request, because they branch on the host. A
  non-app host gets an empty sitemap; its `Disallow: /` is in robots.
- `noindex, follow` on the `(auth)` group; `noindex, nofollow` on the `(app)` group, which
  includes `/onboarding`.


- The metadata, per-host `robots` and `sitemap`, OG image, JSON-LD and `noindex` rules in §8.4.
- Search Console property and sitemap submission, done by the owner.

**Done when:**
- `dxscores.com` pasted into WhatsApp shows the title, description and image;
- Google's Rich Results Test parses the Organization block;
- `dxscores.com/sitemap.xml` lists only public pages.

### 5A.4: The sign-up path, end to end (≈ 1 day)

- Onboarding fixes (§8.3).
- **Production e-mail:**
  - `dxscores.com` is **verified at Resend** (owner, 2026-09-25; DKIM at `resend._domainkey`,
    sending records on `send.` and `rsend.`, all checked in DNS 2026-09-26);
  - remaining, on Railway: `MAIL_HOST=smtp.resend.com`, `MAIL_PORT=587`, `MAIL_SECURE=false`,
    `MAIL_USER=resend`, `MAIL_PASS=<a Resend API key with sending access>`,
    `MAIL_FROM="DXScores <noreply@dxscores.com>"`;
  - correct `INFRASTRUCTURE.md` step 9 to these names, and record Mango Mail as the mailbox.
- `contact@dxscores.com` as a **Mango Mail** mailbox (its Cloudflare authorisation replaces the dead
  Namecheap forwarding records at the root; it does not touch Resend's).
- Verify that `CORS_TENANT_ROOT_DOMAIN`, `JWT_SECRET` on Vercel and `NEXT_PUBLIC_SENTRY_DSN` are
  set. `JWT_SECRET` matters: middleware fails closed without it.

**Done when:** on production, from a phone:
- a stranger's path works end to end: landing → *Créer ma ligue* → account → organisation →
  competition → season → teams → dashboard;
- the verification code arrives in a Gmail **inbox**;
- *mot de passe oublié* works;
- the new league's site is live at its subdomain;
- the test organisation is then deleted.

**Run on production, 2026-10-01** (frontend `609ea47`, `3d2831c`; backend `73d6aa6`), in a
phone-sized browser (390 px, touch), as `rajjysrachid+5a4@gmail.com`, password `basket2026` (no
capital: the new rule), organisation « Ligue Test Parcours » (`PARCOURS5A4`):

- **The path works end to end, with no page error on any page** (no React #418 in this run):
  landing → *Créer ma ligue* → account → organisation (preview « parcours5a4.dxscores.app —
  disponible ») → « est créée » → wizard (competition, the suggested « Saison 2026-2027 », three
  teams pasted as a list) → « Tout est prêt » → league dashboard, with the verify-email banner.
- **The league site is live at its subdomain** (200, the league's name in the title). Right after
  the wizard it still showed « bientôt en ligne » once: the site's one-minute cache serves its
  stale copy while it refreshes. A reload shows the competition.
- **The verification code and the reset code were sent** (`POST /auth/forgot-password` 200 in
  2.6 s). Whether they reached the Gmail *inbox* is the owner's check.
- **Found and fixed during the run** (`3d2831c`): `Input` replaced every explicit `id` with its
  `name`, so the wizard's and the new reset page's `<Label htmlFor>` pointed at nothing.
- **Environment:** `JWT_SECRET` is set on Vercel (a signed-in `/` redirects to the dashboard);
  CORS accepts a league subdomain and refuses a stranger; **no Sentry DSN** is in production's
  JavaScript, so `NEXT_PUBLIC_SENTRY_DSN` is unset or Sentry is off. `INFRASTRUCTURE.md` step 9
  already names the `MAIL_*` variables.
- **Slow writes:** every write took 4–5.5 s measured from Goma, and the wizard creates teams one
  request at a time (three teams, 15 s). This connection's own share varies wildly (0.25 to 8 s
  to connect), but the server's share is still 0.7–2.3 s per request: check that Railway's region
  and Neon's are the same, and consider creating the wizard's teams in one request.

---

## 10. Growth readiness: what gets added, and when

The site is the growth medium, so it is built to change as evidence arrives. Nothing below is
built now. Each item says what triggers it.

| When | Add |
|---|---|
| First federation agrees to be quoted | A line in `content/site.ts` → the Témoignages section appears |
| ~3 real public leagues | `showcaseLeagues` entries → an *"Ils utilisent DXScores"* strip linking their sites. Curated by hand, not a query, so test sign-ups never appear |
| ~5 real leagues | Real counters (leagues, matches recorded), from a small public stats endpoint |
| Pricing decided | A `#tarifs` section, then a page if it needs one |
| A question asked three times | A public answer: an FAQ line, then a short guide page |
| Non-francophone interest | An English landing at `/en`, with `hreflang` |
| Sign-ups need measuring beyond counts | Today: Vercel Analytics page views plus DB counts on `/admin/dashboard` (organisations created, with a competition, with a result). Custom funnel events are a paid Vercel feature (check before relying on them) |

**Distribution that costs nothing and is built in 5B:**
- every league-site footer says *Propulsé par DXScores* and links to `dxscores.com` with
  `utm_source=league&utm_campaign=<slug>`;
- an unknown league subdomain shows a 404 that says *"cette ligue n'existe pas encore — créez-la"*;
- the standings export can carry the league site's address, which also serves the federation.

---

## 11. What only the owner can supply

**Settled on 2026-09-26:**

- the free sentence (§3.2);
- the founder note (§6.9), in draft for the owner to polish;
- the WhatsApp number and the operator's identity (§3.5, §7);
- the sports claim (§6.8);
- the password rule (§8.3);
- English paths (§4);
- the demo league: approved, to be created by script (§3.4);
- Resend verified.

**Still open:**

1. **The presentation video**: its YouTube id once published (§6.3b). The page ships without it.
2. **An e-mail address for the demo admin**, and the go-ahead to run the demo script against
   production (§3.4).
3. **The logo**, from the brief in §8.2. The typographic wordmark stands until then.
4. **Railway mail variables** (5A.4), and Mango Mail authorised for `contact@`.
5. **A photo** for the founder note, optionally.
6. **Search Console** property for `dxscores.com` (5A.3).

---

## 12. Verification checklist (run before calling 5A done)

- [ ] Anonymous `curl -I https://dxscores.com/` returns 200, and a signed-in browser gets a 307 to
      the right dashboard for each role (sysadmin, tenant admin, league admin, club admin).
- [ ] `/home` returns 200 with `<link rel=canonical href="https://dxscores.com/">`.
- [ ] `/robots.txt` and `/sitemap.xml` return 200 on `.com`, and `Disallow: /` on the `.app` apex
      and on previews.
- [ ] No page on `.com` contains "Elenem", "$", "Pro", "demo" (outside the demo link), "Coach
      Mike", "LeBron", or English UI text.
- [ ] Every footer and navbar link returns 200.
- [ ] Landing: under 200 KB of compressed first-load JavaScript (production build), both themes,
      390 px and 1440 px, and
      `prefers-reduced-motion` respected.
- [ ] A WhatsApp preview of `dxscores.com` shows the title, description and image.
- [ ] End-to-end self-serve sign-up on production, from a phone, including the verification
      e-mail and a password reset.
