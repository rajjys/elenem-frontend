# Deleting things — how it works today, and the plan (2026-10-12)

Written after the owner found the competitions list freezing on « Supprimer » → « Annuler », and
asked for deletion to be mapped and made uniform across the app: where each thing can be deleted
from, what it takes with it, when it must be refused, what the person sees, and what must not
survive it.

Sources: a read of every DELETE route and its service (backend), every foreign key and its
`onDelete` in `prisma/schema.prisma` and the migrations, every read of a soft-deletable model
(leak audit), and every delete control in the frontend. The facts that drive the plan were
re-checked in the code by hand; file references are to the backend unless they start with
`components/` or `app/`.

---

## 0. In one page

1. **The database is mostly safe; the rules above it are not.** Nearly everything is soft-deleted
   (`deletedAt`), and the foreign keys refuse to erase played games. What is wrong is *which*
   deletes are allowed, *what they leave behind*, and *what the person is told*.
2. **A club that has played can be deleted today, and then haunts every page.** It is renamed
   `deleted_1728…_Vipers` to free its name, but its games, standings rows and export lines stay —
   so the public table, the results, the calendar and the federation's signed export print that
   name. This is the worst leak.
3. **Admins outlive what they administered.** Deleting a competition or a club leaves its
   administrators holding the role, pointed at a deleted thing, and « Retirer » then answers
   « Club introuvable. » — they cannot be cleaned up except by deleting their account.
4. **Nothing personal is ever erased.** Photos and logos stay public in R2 for ever; a deleted
   player keeps their date of birth, e-mail and full national ID (prefixed, not removed); a deleted
   organisation keeps its bank, mobile-money and tax fields.
5. **The screens promise things the server refuses**, in six different confirmation styles, with a
   green button on every « Supprimer », a dialog that closes before the request finishes, and
   refusals that arrive in English for five resources.
6. **Two access holes unrelated to deletion turned up and should be fixed first** (§6): any
   organisation's admin can cancel, postpone or finish *any* organisation's game by id, and two
   game-list endpoints let a query parameter replace the caller's own scope.

The plan (§8) replaces « delete » with four verbs that each mean one thing — **Supprimer**,
**Archiver**, **Annuler**, **Retirer** — puts the rules for each resource in one backend function
that both the delete and a « what will this do? » preview use, and gives the app one delete
dialog.

**Already fixed today** (frontend, not committed): the freeze itself. Three copies of Radix's
layer code were installed (`react-dismissable-layer` 1.1.10, 1.1.11 and 1.1.16), so a dropdown and
the confirm dialog it opened each tracked the page lock separately, and closing them left `<body>`
with `pointer-events: none`. The Radix packages are now pinned to one release (24 July 2026) that
shares a single copy; verified in a browser on the competitions card, the clubs' « Responsables »
dialog, and four other lists.

---

## 1. The rule we should have

Today « Supprimer » means four different things depending on the screen. A person deleting
something means one of these, and the app should ask for exactly that:

| Verb | Means | What it does | Undo |
|---|---|---|---|
| **Supprimer** | « It should never have existed » — a duplicate, a typo, a test | Gone from everything: lists, pickers, public site, counts. Its name is free again. Rights on it are revoked, its images deleted, personal identifiers erased. | No (a system administrator can restore by hand) |
| **Archiver** | « It existed, it is over » — a club that folded, a player who left, last year's D2 | Leaves the present — default lists, pickers, new games, rosters — and stays in the past **under its real name**: results, tables, box scores, records. | « Réactiver » |
| **Annuler** | « It will not happen » — a game, a season | Already right today: a status with a reason, shown as such. | Yes (status change) |
| **Retirer** | Unlink only — an admin from a club, a player from a roster, a logo | Nothing is destroyed. | Give it back |

And one rule above them:

> **A result someone has seen is never erased as a side effect.** Anything that fed a published
> result — a played game, a box score, a table — can be archived, corrected, or (for a game)
> deleted on purpose with a reason. It is never cascaded away because something else was deleted.

Which gives, per resource, **when « Supprimer » is allowed** — and what to offer instead when it
is not:

| Resource | « Supprimer » allowed when… | What goes with it | Otherwise offer |
|---|---|---|---|
| Organisation | System administrator only, and no game was ever played in it | Its competitions, through the same cascade as deleting one; its venues and posts; every role held in it — its people keep their own accounts, detached (as its administrators already were), so they can start again. The site answers 404; the address stays reserved (Q6). Logos and the business profile's money and ID fields: R4 | Archive its competitions; or ask DXScores |
| Competition | No game in it was ever played | Its seasons, phases, unplayed games, planned fixtures, and its clubs and players (none has a history) | **Archiver** (exists: « Compétition active ») |
| Season | No game in it was ever played | Its phases, pools, unplayed games and planned fixtures | **Annuler la saison** (exists) |
| Phase | No game in it, deleted ones included, and not the last phase | Its pools, planned fixtures and table rows | Move the games first |
| Club | It never played a game | Its unplayed games are deleted (listed first), its players stay in the competition without a club, its pools forget it, its admins lose the role, its logo is deleted | **Archiver le club** |
| Player | No box-score line on a game that still exists | Out of the roster; photo deleted; national ID, birth date, phone and e-mail erased; a linked account loses the « Joueur » role | **Archiver le joueur** (or anonymise, Q5) |
| Game, not played | Always (an entry error) | Nothing else | « Reporter », « Annuler » |
| Game, played | Always, **with a reason** and the impact shown first (Q3) | Its result leaves the table; its box score leaves the statistics | Correct the score instead |
| Account | System administrator only; an organisation **deactivates** (Q4) | — | « Désactiver »; « Annuler l'invitation » if never accepted |
| Post, planned fixture | Always | Nothing else | — |

Once only things *without* history can be deleted, the `deleted_<ts>_` rename stops being visible
anywhere, because nothing still points at those rows — so it can stay as the way to free unique
names, without a schema change.

---

## 2. Today, resource by resource

« Who » is who the API lets through; « UI » is where the app offers it.

### Organisation — `DELETE /tenants/:id`
- **Who:** system administrator, or a TENANT_ADMIN on their own organisation (the app offers it
  only in `/admin`, behind an English `window.confirm`).
- **Refused when** it holds any live competition, club, player, game, season or referee — in
  English: `Cannot delete organization "X" because it contains active resources…`. Venues, posts,
  users and planned fixtures are not counted.
- **Does:** soft delete. TENANT_ADMINs are detached and reduced to `GENERAL_USER` (wiping any other
  role). Everyone else keeps their `tenantId` and is refused at sign-in (« Cette organisation n'est
  pas active. »). The league site answers 404.
- **Leaves:** name, slug and code reserved for ever; the business profile with its bank,
  mobile-money, tax and national-ID fields; logos in R2; venues, posts; `ownerId` on a demoted user.

### Competition — `DELETE /leagues/:id`
- **Who:** system administrator, TENANT_ADMIN. Not the competition's own admin — yet the « Zone de
  danger » tab is shown to them and answers 403.
- **Refused when** it has any live sub-competition, club, game or season (English: « League has
  active seasons. »). In practice: **a competition created through onboarding always has a season,
  and a season that ever recorded a result can never be deleted — so a real competition can never be
  deleted.** That is accidentally close to right (§1), but the screens say the opposite.
- **Does:** soft delete, name and slug renamed.
- **Leaves:** its administrators, with the role and `managingLeagueId` on the deleted competition.
  They still sign in; « Retirer » answers « Compétition introuvable. »; giving them another
  competition is refused because they « administre déjà « deleted_…_X » ». Also its players
  (shown in the organisation's player list, and they block deleting the organisation), posts
  aimed at it (still on the public News page), its rules row and logo.
- **UI:** card menu on `/tenant/leagues` and « Zone de danger » in its settings. Both say its
  seasons, phases and calendar « seront supprimés » — the server refuses instead.

### Season — `DELETE /seasons/:id`
- **Who:** system administrator, TENANT_ADMIN, the competition's admin.
- **Refused when** it has unplayed games, or **any** team statistics, box-score line or table row
  ever recorded — including rows left by deleted games, which nothing ever removes. In good French,
  pointing to « Annulez la saison plutôt que de la supprimer ».
- **Does:** soft delete, renamed `deleted_<cuid>_…` (which the journal's clean-up does not
  recognise, so the journal shows it); re-points the competition's current season.
- **Leaves:** phases, pools, played games (they do not block it — e.g. a knockout-only season with
  no scoresheets), and planned fixtures, **which stay on the calendar and keep reserving halls**.
- **UI:** a bin on the season card that **deletes on one click, with no confirmation** — while
  cancelling a season asks for a reason.

### Phase — `DELETE /stages/:id`
- **Who:** system administrator, TENANT_ADMIN, the competition's admin.
- **Refused when** it holds live games, or it is the season's last phase (French).
- **Does:** the only **hard** delete of something an organiser built. The database cascades its
  pools, its planned fixtures (not counted by the refusal) and its table rows.
- **Bug:** a phase that ever held a *deleted* game fails with a 500 — the refusal counts only live
  games, the foreign key counts all of them. Same in « Appliquer un modèle ».
- **UI:** a bin with **no confirmation**, shown even on phases the server will refuse, not disabled
  while running (it can fire twice).

### Club — `DELETE /teams/:id`
- **Who:** system administrator, TENANT_ADMIN, the competition's admin.
- **Refused when** it has an active player, an active coach, or any unplayed game — cancelled and
  postponed ones included (English). So almost every real club is refused…
- **…but a club whose games are all played is accepted.** It is renamed `deleted_<ts>_…` and its
  games, table rows and export lines stay: see leak 1 (§4).
- **Leaves:** its admins (role and scope kept, « Retirer » answers « Club introuvable. »),
  deactivated players, open memberships, pool membership, logo, posts aimed at it.
- **Deactivation is one-way.** Setting « inactive » works; afterwards every lookup requires
  `isActive: true`, so the club can be neither reactivated nor deleted, and it blocks deleting its
  competition for ever.
- **UI:** a bin on the clubs list. « Ses matchs déjà joués restent au classement » — true only in the
  rare case the server accepts, and that case is the leak.

### Player — `DELETE /players/:id`
- **Who:** system administrator, TENANT_ADMIN, the competition's admin. Not a club's admin (who
  cannot unassign or deactivate either).
- **Refused when** they have **any** box-score line (deleted games included), or sit in an unplayed
  lineup (English).
- **Does:** soft delete. Slug, national ID and registration number are prefixed `deleted_<ts>_` —
  the full ID is still in the string. A linked account loses the PLAYER role and, if nothing else
  is left, is **deactivated without a journal entry**.
- **Leaves:** name, birth date, e-mail, nationality, photo (in R2), open memberships.
- **Deactivation is one-way**, as for clubs.
- **UI:** a bin on the players list, « Retirer ce joueur ? … Ses statistiques déjà enregistrées sont
  conservées » — false: any statistic blocks it. No delete on the player's own page.

### Game — `DELETE /games/:id?reason=`
- **Who:** system administrator; TENANT_ADMIN or the competition's admin, for their own games.
- **Never refused.** Any status, closed seasons included; the reason is optional.
- **Does:** soft delete. If it was played, both clubs' lines and the phase's table are recomputed
  at once. Its box-score lines are **kept but hidden** — every statistics read filters deleted
  games, so scorers and player pages are right — and those hidden lines then block deleting the
  season and the players for ever. Lineups and events stay.
- **Does not:** touch the next knockout round. Rounds are filled by hand (« promouvoir » a planned
  fixture), so a club that advanced on a deleted result stays advanced.
- **It is the only way to undo a result**: a completed game cannot change status, and its final
  score cannot be cleared.
- **UI:** the match page's « Supprimer » (the best dialog in the app: says the consequence, stays
  open, disabled while running, refreshes everything) and the calendar's fixture dialog. The match
  page's copy does not say the result leaves the table. Deleting from « Déplacer » on the match page
  leaves you on the deleted match, which then errors.

### Account — `DELETE /users/:id`
- **Who:** system administrator, or the organisation's TENANT_ADMIN — who **can delete themselves,
  the organisation's owner, and the last organisation administrator**. « Retirer » refuses all three
  (`access.service.ts`); this route has none of those guards.
- **Does:** soft delete; e-mail and username prefixed (so the address can sign up again);
  `managingLeagueId` / `managingTeamId` cleared — but **the `roles` list is untouched**. Their player
  profile is soft-deleted without the player rules, so their lines vanish from the scorers and the
  box score's team totals no longer match the final score.
- **Leaves:** the journal's « before » snapshot keeps the real e-mail, readable by the
  organisation's admins for ever. `ownerId` on organisation, competition and club still point at it.
- **UI:** a bin on **every row of every users list, your own included**, and a red button on the
  record. « Désactiver » next to it is reversible, refuses yourself, and is the better tool.

### The rest
| What | Who / rule | Does | Problem |
|---|---|---|---|
| Admin role (« Retirer ») | `POST /access/revoke` | Removes role and scope together, French refusals (owner, last admin), journaled | **The model to copy.** Fails with 404 once the club or competition is deleted. |
| Logo / photo (« Retirer ») | Whoever may edit it | Pointer cleared, R2 files deleted, journaled | Impossible once the owner is deleted (404), so those files stay for ever |
| Post | Admin of the post's level | Soft delete | Title and slug stay reserved (reusing the title → 500). **Any competition or club admin can edit or delete any other competition's or club's post** in the organisation (role checked, not which one). A TENANT_ADMIN cannot delete a competition's post. **The app's delete is unreachable** (the actions column is hidden). |
| Planned fixture | Competition admins | Soft delete, journaled | The frontend hook exists with no caller |
| Venue, court, closure | Organisation admins | Soft (closure: hard) | No UI. Re-creating a deleted venue's name → 500 |

---

## 3. The questions, answered

### What happens to a club's administrators when the club is deleted?
**Today:** nothing. They keep « Responsable de club » and a `managingTeamId` on a deleted club, still
sign in, land on a club that no longer exists, and cannot be cleaned up: « Retirer » looks the club
up among live ones and answers « Club introuvable. ». Same for a competition's administrators.

**Plan:** « Supprimer » revokes every administrator through the same `AccessService.revoke` the
screens use, so the journal says « Fin de fonction » with the reason « club supprimé »; their
account stays, as « Membre ». « Archiver » keeps them, read-only, so « Réactiver » needs nothing
re-granted.

### When can a club not be deleted — and how is that different from a competition or a player?

| | Today: refused when | Plan: refused when | Plan: instead |
|---|---|---|---|
| Competition | any club, season, game or sub-competition | a game in it was played | Archiver |
| Club | an active player, an active coach, or an unplayed game — **accepted once all games are played** | it ever played | Archiver le club |
| Player | any box-score line, even from a deleted game | a box-score line on a live game | Archiver le joueur |

The difference is what depends on each. A competition is a container: if nothing was played in it,
everything inside is equally without history and can go with it. A club is a party to results:
once it has played, other clubs' points depend on it. A player is a line in box scores: once they
have played, the arithmetic of a match sheet depends on them.

### When can a player not be deleted, and what if we were forced to?
Once they have a line in a box score. **If forced:**
- **Hard delete** cascades away every line (`PlayerGameStat`, `onDelete: Cascade`). Each of their
  matches then shows player points that no longer add up to the final score — the very check the
  box-score entry is built around — and the scorers' table, season leaders and club records change
  retroactively.
- **Soft delete** (what deleting a linked account already does today) hides the lines instead:
  same mismatch on the public match sheet, data still in the database.
- **What we should do** when a family asks for a player's removal (a youth league): **anonymise**.
  The lines stay, so every sheet still adds up, but under « Joueur retiré »; name, photo, birth
  date, IDs and the public page are erased. Q5.

### What happens when a completed game with statistics is deleted?
**Today**, in order: the game is soft-deleted (any state, no reason required); both clubs' records
and the phase's table are recomputed immediately; the box-score lines stay in the database but
disappear from scorers, leaders and player pages; lineups and events stay; the next knockout round
is not touched; the journal records date, status, score and the optional reason; the league site
catches up within its one-minute cache. Nothing on the screen says the table will change.

**Plan:** keep it possible — it is the only way to undo a result entered by mistake — but make it
deliberate: a **required reason**, and the impact shown before confirming (« Le classement sera
recalculé », « 24 lignes de feuille de match retirées des statistiques », and when it applies
« Le tour suivant a déjà été tiré avec ce vainqueur — vérifiez-le »). Its hidden lines must stop
blocking the season and the players. Q3 asks whether it should instead be refused outright.

### And a club that has played, if we were forced to delete it?
Two very different outcomes, which is why it must be a decision and not a side effect:
- **Keep its results** (what today's delete does, minus the renamed ghost): opponents keep the
  points they won against it; the club is archived and shown under its real name.
- **Void its results**: every game it played leaves the table, so every opponent's record changes
  — some lose wins, the table reorders. Some federations do this when a club withdraws mid-season.
  Q2 asks which rule LIPROBAKIN applies.

---

## 4. What survives a delete that should not

| # | Severity | What | Who sees it |
|---|---|---|---|
| 1 | **High** | A deleted club that had played shows as `deleted_<ts>_Name` (and its logo) on the public table, results, match pages, opponents' pages, scorers, the calendar and the signed standings export. Its table rows are never recomputed. | Anyone on the league site; the federation |
| 2 | **High** | The head-to-head tiebreak counts deleted games, and games of other phases (`standings.service.ts:1054`) — a deleted result can decide the order of tied clubs | Anyone on the league site |
| 3 | Medium | Images are never deleted with their owner: player photos (often minors) and logos stay at public, unsigned R2 URLs for ever, and can no longer be removed through the API | Anyone holding the URL — shares, caches |
| 4 | Medium | Personal data is never erased: a deleted player keeps birth date, e-mail, nationality and the full national ID inside the prefixed string; a deleted organisation keeps bank, mobile-money, tax and ID fields | Database and backups |
| 5 | Medium | Administrators of a deleted competition or club keep the role and scope, and cannot be revoked | The former administrators |
| 6 | Medium | A deleted account's real e-mail stays in the journal's « before » snapshot | The organisation's administrators |
| 7 | Low–Med | Posts aimed at a deleted competition or club stay on the public News page | Anyone |
| 8 | Low–Med | Players of a deleted competition stay live in the organisation's list and block deleting it | Organisers |
| 9 | Low | Planned fixtures of a deleted season stay on the calendar and keep halls reserved | Organisers |
| 10 | Low | A season of played knockout games without scoresheets can be deleted; its games stay public, showing `deleted_<cuid>_…` as the season | Anyone |
| 11 | Low | Deleting an account hides its player's lines, so box-score totals stop matching the final score | Anyone |
| 12 | Low | The platform dashboard counts deleted competitions; lineups and game-history reads accept deleted games | Admins |

Correctly handled, for the record: the league site resolves organisation, competition, club and
player only when live and visible; a deleted organisation's or competition's site answers 404; the
recompute, scorers and player statistics filter deleted games; organiser lists, the dashboard and
the calendar filter deleted rows; sign-in, refresh and every request refuse a deleted account or an
inactive organisation; the public organisation profile never includes financial fields. There is no
backend cache; only the league site's one-minute cache delays a delete.

---

## 5. The experience today

- **Six ways of confirming:** the shared ConfirmDialog (10 places), typing the name (danger tab),
  a consequence modal with a reason (match page), a panel inside a dialog (calendar), English
  `window.confirm` (three admin pages), and **none at all** (season, phase).
- **The confirm button is green on every « Supprimer »** (`components/ui/alert-dialog.tsx:85`
  styles every action `bg-positive-soft`, with no danger variant).
- **Every ConfirmDialog closes before the request finishes.** No progress; a refusal arrives as a
  toast after the dialog is gone; the row is still there, so the same delete can be sent twice.
- **Copy that misstates the effect:** competition (promises a cascade, gets a refusal), club
  (« matchs joués restent » — true only in the leak case), player (« statistiques conservées » —
  any statistic blocks it), post (« définitivement » — it is a soft delete), match page (silent
  about the table).
- **Offered, then refused:** the danger tab for a competition admin (403); any competition with a
  season; a club with players or upcoming games; a player who played; a phase with games or the
  last one; an organisation that holds anything. Refusals for organisation, competition, club,
  player and account come back **in English**.
- **Stale screens after a delete:** most deletes refresh only their own list — competition counts,
  the scope switcher, the dashboard, the club picker and the standings stay stale until reload. The
  match delete and the image « Retirer » refresh correctly; the admin pages do not use React Query
  at all.
- **Missing doors:** a planned fixture that turned out unnecessary cannot be dropped; posts cannot be
  deleted at all; a player cannot be deleted from their own page.

**What to copy:** the match page's delete (says the consequence, stays open until done, disabled
while running, refreshes everything) and « Retirer » on access (French guards, honest copy about
what stays).

---

## 6. Found on the way — fix before anything else

Neither is about deletion; both were confirmed in the code and are worse than most of the above.

1. **Any organisation's admin can change any organisation's game.** `/games/:id/start`, `pause`,
   `resume`, `end`, `cancel`, `postpone`, `confirm`, `schedule` and `PUT /games/:id/status` check the
   role, then call `GameStateService.transition`, which loads the game by id with no organisation
   or competition check (`game-state.service.ts:47`). A LIBAGO administrator holding a LIPROBAKIN
   game's id can cancel it or end it with a final score of their choosing. It also accepts deleted
   games.
2. **`GET /games/dates` and `GET /games/by-date` let `?tenantId=` replace the caller's scope**
   (`games.service.ts:244-251` and `:317-324`): the role sets `where.tenantId`, then the query
   parameter overwrites it. Cross-organisation game listing. `listGamesScoped` already fixed this
   pattern by collecting filters in an `AND` list.

Smaller, same family: post edit/delete checks the role but not which competition or club (§2);
adding a player to a lineup never checks they exist, are live, or belong to that club.

---

## 7. Decisions for the owner

**All seven taken as recommended (the owner, 2026-10-12)**, Q2 as « keep »: a club that withdraws
mid-season is archived and its played results stand.

- **Q1 — A club that has played: archive only, never delete?** Recommended: **yes**. It is the
  only way its opponents' results stay true and its name stays readable.
- **Q2 — A club withdrawing mid-season: keep or void its played results?** Federations differ;
  **ask LIPROBAKIN**. Recommended default until they answer: **keep** (archive). Voiding later is a
  bulk « supprimer ces matchs » with one reason, built on Q3.
- **Q3 — Deleting a played game.** Recommended: **allowed, with a required reason and the impact
  shown** (it is the only undo for a result typed by mistake). The alternative is to refuse it and
  require a score correction or a forfeit instead.
- **Q4 — Deleting accounts.** Recommended: an organisation gets **« Désactiver »** (exists) and
  **« Annuler l'invitation »** for invitations never accepted; « Supprimer » becomes system
  administrator only, never yourself, never an owner.
- **Q5 — A family asks to remove a player who has played.** Recommended: **anonymise** (« Joueur
  retiré », lines kept so every match sheet still adds up). System administrator only, on request.
- **Q6 — A deleted organisation's address** (`<code>.dxscores.app`). Recommended: **stays
  reserved**, so nobody can re-register a dead league's address and pose as it; a system
  administrator can free it.
- **Q7 — Restore.** Recommended: **no « Corbeille » for now.** Soft delete stays, so a system
  administrator can restore by hand; archive covers the everyday « I want it back ».

---

## 8. The sprints

Same cadence as §15 of the roadmap: backend rules first, then the screens, each verified in a
browser as each role, writes checked against a throwaway database.

**R0 — The holes (backend, small).** Scope check in `GameStateService.transition` (organisation /
competition, live games only) and in the two game-date queries (§6). The head-to-head tiebreak
filters deleted games and stays within its phase (leak 2). A Prisma exception filter turning
unique (P2002) and foreign-key (P2003) violations into French 409s instead of 500s; the phase delete
counts deleted games. Post edit/delete checks *which* competition or club.
Two more, added by the owner on 2026-10-12:
- **No tied final score where the sport has no draw.** Basketball has no 68–68; nothing refused it.
  A final score — entered, corrected, ended live, or imported from Excel — is refused when it is
  level in a sport whose rules have no draw (basketball, volleyball: the sports whose defaults carry
  no « nul » outcome). The score dialogs say so before sending.
- **« Corriger le score » on a forfeit showed « Forfait » unchecked.** The calendar never sent the
  flag, and the dialog reset it on opening and only ever sent a ticked box: a forfeit looked like an
  ordinary result, and unticking it to undo a forfeit never reached the server.
*Verify:* tests; on a throwaway API, LIBAGO's admin cancelling a LIPROBAKIN game gets 403, and
`?tenantId=` of another organisation returns only their own games; a tie that a deleted game used to
decide no longer is; a 68–68 basketball result is refused from every entry point; the correction
dialog of a forfeit opens with « Forfait » checked.

*Built 2026-10-12, not yet committed or deployed.* Backend: `assertGameScope` (`src/games/game-scope.ts`)
now guards every status command, which also refuses deleted games; the two game-date lists keep the
caller's scope apart from the query's; the head-to-head reads live games of its own phase and
scores a forfeit loser like the main table; `PrismaExceptionFilter` answers P2002/P2003 with French
409s and P2025 with a 404; deleting a phase (or applying a template) first removes the deleted games
that held it; posts check *which* competition or club — and an organisation's administrators may
now act on every post in their organisation, `GLOBAL` is the platform's, and moving a post checks
its new place too. `src/sport-rules/utils/result-rules.ts` refuses a level final score from all four
entry points (score, « Terminer », creating a played game, the Excel import's preview row).
Frontend: the calendar entry carries `isForfeit`; the score dialog opens on it and always sends it;
the score dialog, the fixture dialog and the box score's « Utiliser … comme score final » say why a
level basketball score is refused before sending. Checked: 377 backend tests (new ones for each
rule); 23 scenarios through the real API on a throwaway database (LIBAGO refused on a LIPROBAKIN
game, `?tenantId=` returns nothing, 68–68 refused four ways, the phase delete that used to 500, the
Messieurs admin refused the Dames post, a duplicate title answered 409 in French); the forfeit and
level-score dialog in a browser. Rerunning the scenarios also confirmed a deleted post's slug stays
reserved (R4).

**R1 — The rules, in one place (backend).** One `assessDeletion(user, id)` per resource that returns
what blocks it, what goes with it, what to offer instead, and whether a reason or the typed name is
required — served as `GET /<resource>/:id/deletion` and re-checked by the DELETE itself, so the
preview and the refusal can never disagree:

```
{ allowed, blockers: [{ code, message, count }], consequences: [{ message, count }],
  alternative: 'archive' | 'cancel' | 'deactivate' | 'move' | null,
  requires: { reason: boolean, typedName: boolean } }
```

The rules of §1 for organisation, competition, season, phase, club, player, game, account and
post: a club or competition without history takes its unplayed games and empty containers with it;
deleting a club or competition revokes its administrators through `AccessService.revoke`; hidden
box-score lines of deleted games stop blocking anything; account deletion gets the owner,
last-administrator and self guards, and « Annuler l'invitation » is added; a played game requires a
reason (Q3). Club and player reactivation (the one-way bug). Every refusal in French. Every cascade
journaled as one sentence (« Club supprimé, avec 3 matchs à venir »).
*Verify:* a rule test per resource; then each delete through the real API on a throwaway database
as each role, with the rows checked afterwards.

*Built 2026-10-12, not yet deployed.* Backend: `src/common/deletion/deletion-report.ts` (the report,
`assertDeletable`, `PLAYED_STATUSES`) and an `assessDeletion` + `GET …/deletion` on tenants, leagues,
seasons, stages, teams, players, games, users and posts, each DELETE taking `?reason=`. As decided:
a club or player that has played is refused with « archive » offered (Q1), and archiving both is now
reversible (their lookups no longer require `isActive`); a club that never played takes its unplayed
games, its pools, its administrators' rights and its posts with it, its players stay in the
competition, and it leaves every table (`StandingsService.dropTeamFromTables`); a competition or
organisation never played goes with everything in it (`LeaguesService.cascadeDelete`, players'
identity numbers erased so they can be registered again); a season never played takes its phases and
fixtures, and rows left by deleted games no longer block it; a played game needs a reason (Q3) and
says what changes, knockout included; accounts are the platform's to delete (Q4) — never your own,
an owner's or the last organisation administrator's — and an organisation cancels an invitation never
accepted through the same route; a deleted account's player stays on the roster, detached.
`AccessService.endDutiesOver` ends administrators' rights inside the delete and journals
« Fin de fonction » with why; every deletion journals its reason and `withIt`, the list of what went
with it. Frontend (so nothing breaks before R2): a played match asks for the reason on its page and in
the calendar; the users screens show « Supprimer » to the platform only and « Annuler l'invitation »
on invitations never accepted. Checked: 395 tests (a rule test per resource); 41 scenarios through the
real API on a throwaway database, rows checked after each (a played club refused then archived and
reactivated, a club that never played deleted with its game, player and administrator handled, a
competition deleted with everything in it, IDs re-registrable, the invitation cancelled and the
address free again); the two screens in a browser.

**R2 — One delete dialog (frontend).** A `DeleteDialog` that loads the assessment when opened: when
blocked, says why and shows the alternative as the main button (« Archiver le club »); when allowed,
lists the consequences with counts, asks for a reason or the name when required, uses a red button,
stays open and disabled while running, shows a refusal inside itself, and on success refreshes a
per-resource set of queries and leaves the page of the deleted thing. `ConfirmDialog` gets a danger
tone and an async confirm. Replace all the patterns of §5: season and phase get a confirmation, the
admin pages move to React Query and French, the danger tab is hidden from competition admins, the
users list loses its bin (Q4), posts become deletable, planned fixtures can be dropped, and
« Déplacer » → « Supprimer » leaves the deleted match.
*Verify:* as organisation admin, competition admin and club admin, try every delete; a blocked one
explains itself and offers the alternative; an allowed one lists what goes; lists, counts, the
dashboard and the table refresh without a reload.

*Built 2026-10-20, not yet committed.* `components/deletion/delete-dialog.tsx` on
`services/deletion.ts` (the nine previews, one delete call, every query refetched after it) replaces
every delete in the app: competitions (card menu, « Zone de danger », now hidden from a competition's
own administrators), clubs, players, seasons and phases (both deleted on one click before), matches
(the match page, and the calendar's fixture dialog — deleting from « Déplacer » now leaves the
deleted match's page), accounts and invitations, posts (deletable at last: the actions column had
been hidden since it was written), and the three /admin lists (no more `window.confirm`). The old
per-resource delete hooks are gone, so a screen cannot go around the rules. Refused: why, in the
API's words, and the other door where it already exists — « Archiver la compétition », « Annuler la
saison », « Désactiver le compte »; clubs and players get theirs with R3. Allowed: what goes with it,
a reason (required for a played match), the name typed for a competition or an organisation, a red
button disabled until then, open while it runs, a refusal shown inside it, « supprimé » / « supprimée »
by the noun. `ConfirmDialog` lost its green button, gained `tone="danger"`, and stays open until its
request answers (« Désactiver », « Retirer » a role or a logo now use it). A planned fixture can be
dropped from its dialog. The journal lists what went with each deletion. Checked: 23 scenarios in a
browser against a throwaway database, as the organisation's administrator, a competition's
administrator and the platform. Left: the /admin competitions and clubs pages still load by hand
(`useState`/`useEffect`), only their delete moved.

**R3 — Archive, the other door.** « Archiver » / « Réactiver » for clubs and players (competitions
have it), an « Archivés » filter on their lists, archived clubs and players out of pickers, new
games and rosters, and still under their real names on every past result, table and box score,
public site included.
*Verify:* archive a club with played games: the public table and results still show its name and
logo; it is gone from the fixture picker; « Réactiver » brings it back.

**R4 — Nothing left behind.** Deleting a player, club, competition or organisation deletes its R2
images; deleting a player erases national ID, registration number, birth date, phone and e-mail
(instead of prefixing them); deleting an organisation erases its business profile's money and ID
fields and deactivates every account; a deleted account's e-mail is left out of its journal
snapshot; posts aimed at a deleted competition or club leave the site; planned fixtures of a deleted
season go with it. Anonymisation per Q5. A public-API test that fails on any `deleted_\d+_` in a
response, beside the existing blocklist test.
*Verify:* after each delete, the image URL answers 404 and the rows hold no personal field; the
public-API test passes.

**Order:** R0 first, on its own — it is security. Then R1 and R2 (the rules, then their screen),
R3, R4. R3 can come before R2 if archiving is wanted sooner, since R1's « instead » points at it.

---

## 9. Not in this plan

A « Corbeille » with restore (Q7); scheduled purges after a grace period; a Prisma extension that
filters `deletedAt` everywhere (worth adding later as a safety net — it would have caught leak 2 —
but it does not cover nested reads or any of the leaks about what a delete leaves behind, so it is
not the fix); venues UI; referees and coaches, which have no routes.
