# Images — logos and player photos on Cloudflare R2

> Written 2026-10-06. Roadmap item 17, the last open item of `ROADMAP_V2.md`.
> Supersedes the env-variable names in `INFRASTRUCTURE.md` step 8 and the "no S3 code exists yet"
> lines in `INFRASTRUCTURE.md` §2 and `HANDOVER_PHASE5.md` — there is code, and most of it goes.
> The rule from roadmap §13 stands above everything here: **a missing image must never stop a game
> being saved, a standing being computed or a page being served.**

---

## 0. Where we start

Checked on 2026-10-06 against both repositories and the local database.

- **There are no images anywhere.** Local: 166 business profiles, 714 players, zero `logoUrl`, zero
  `profileImageUrl`, zero `MediaAsset` rows. Production is almost certainly the same (to confirm
  through the public API, read-only). **Nothing has to be migrated, so the design is free.**
- **Two upload experiments exist in the backend, both written for AWS, neither usable:**
  - `src/upload2` (`/uploads2/*`) has **no auth guard at all**. Anyone on the internet can call
    it. The client picks the folder, the proxy route takes 50 MB, and `get-url` signs a download
    for any key. It is harmless today only because there are no storage credentials. **The moment
    R2 keys go on Railway, it becomes an anonymous upload endpoint into our bucket.**
  - `src/upload` (`/uploads/presign`, `/uploads/confirm`) does require a login, but it trusts the
    size and type the browser *declares*. `confirm` checks no ownership, and it rewrites every URL
    to an `amazonaws.com` address. Abandoned `PENDING` rows are never cleaned up.
  - Frontend: `utils/upload.ts` and `hooks/useUploadAndConfirm.ts` call it.
    `components/forms/shared/businessProfileForm.tsx` is imported nowhere. `post-form.tsx` uses it
    for a post's hero image, which can only fail today.
- **The API accepts image URLs as free text, in 13 write DTOs**:
  - registration;
  - create and update user;
  - create player, and update player by an admin, a club admin or the player;
  - the two team updates;
  - the league details;
  - create and update season;
  - create game. `/team/edit` has a text box where a club admin
  types a logo URL, and `user-form.tsx` has two. Today, anyone with edit rights can make a public
  league site load **any URL on the internet**: a tracking pixel, a 40 MB file, or an offensive
  picture hosted elsewhere.
- **The read path is already in place.** Organisation, league and club logos all live on
  `BusinessProfile.logoUrl`, and the player photo is `Player.profileImageUrl`. About 40 backend
  files read them. Both the app and the league site render them with an initials fallback
  (`Avatar`, `UserAvatar`, `TenantLogo`, `LeagueLogo`, `ClubMark`, `SiteMark`, plus a few inline
  in tables and pages).
- **Two consumers need something other than WebP:**
  - The share cards accept **PNG or JPEG only** (`lib/public-site/og.tsx:92`).
  - The standings export draws the page to a PNG in the browser (`html-to-image`). It can read
    WebP, but it needs CORS headers once images come from another origin.
- **Most app images go through `next/image`**, so through Vercel's optimiser, which has a quota on
  Hobby. `remotePatterns` lists only `media.dxscores.com`, so a development bucket's address would
  be refused.

---

## 1. Pushbacks

### 1.1 R2 needs a card or PayPal on file — `INFRASTRUCTURE.md` says it does not

The 2026-09-11 decision table rejected AWS *because it needs a card* and chose R2 as "no card".
That is wrong: **Cloudflare asks for a payment method (card or PayPal) to activate R2**, even on
the free tier. Nothing is charged within the free allowance (10 GB stored, 1 M writes and 10 M
reads a month, no egress fees), but the payment method has to be there.

One consequence: with a card on file, going past the free allowance **bills rather than stops**,
which is the very reason `INFRASTRUCTURE.md` §1 gives for rejecting AWS. The amounts are cents
($0.015 per GB-month). The protection is ours to build: the rate limit, images re-encoded to a few
hundred KB, and a per-organisation cap when it is needed (§3).

If that is a problem, it is the first thing to settle, because it decides the provider. The code
below talks plain S3, so another S3-compatible store means a different endpoint and different
keys, **not different code**. I would verify the no-card candidates (Backblaze B2, Supabase
Storage) only if we need them.

### 1.2 Upload through the API, not straight to the bucket

Both experiments use *presigned* uploads: the browser sends the file directly to the bucket. I
would not:

- **R2 does not support presigned POST.** That is the S3 mechanism that lets the server cap a
  file's size before it arrives. R2 only offers presigned PUT, which lets the browser send any
  bytes with any declared type. The server finds out what landed only afterwards.
- **Presign-then-confirm is three moving parts** — CORS for uploads on the bucket, a confirm step,
  and a cleanup job for uploads that were started and never confirmed.
- **Our files are small by the time they leave the phone** (§3: cropped and scaled to at most
  1024 px, typically 100–400 KB). Passing them through the API costs nothing measurable. And
  because the API **re-encodes every image**, every byte in the bucket is something our server
  produced, never something a user chose.

Presigned PUT remains the growth path for large files (video), which nobody has asked for.

### 1.3 Every image is square

Every place an image appears is a square slot: a crest box, a round avatar, a share-card tile.
So the crop step is 1:1, for everything. **A logo can be zoomed out inside the square**, and the
empty space becomes transparent, so a wide logo is never cut. One shape means one set of sizes and
one layout rule everywhere. The one thing it rules out is a banner, and banners are not in scope.

### 1.4 "Profile pictures" means players' photos (and crests), not account avatars

An account's avatar appears in one place, the account menu, and on no public page. It is out of the
first pass. Once the pipeline exists, it takes about thirty minutes.

### 1.5 Do not give every demo player a photo

Covered in §5, sprint 5. A demo where every player has a headshot would make a real league's
site look empty beside it, and would hide the fallback that most leagues will actually see.

---

## 2. What v1 supports

| Slot | Stored in | Shown on | Who can change it |
|---|---|---|---|
| **Organisation logo** | the organisation's `BusinessProfile.logoUrl` | league-site header and footer, share cards, standings export, app header | organisation admin |
| **League logo** | the league's `BusinessProfile.logoUrl` | competition screens in the app | organisation admin, that league's admin |
| **Club crest** | the club's `BusinessProfile.logoUrl` | standings, games, club page, rosters, both domains | organisation admin, the admin of its league, that club's admin |
| **Player photo** | `Player.profileImageUrl` | player page, roster, scorers, quick view | as for the player's club |

A system admin can remove any image. That is the moderation path a self-serve platform needs.

**The operations are upload (which replaces) and delete.** "Modify" means choosing a file again
and re-cropping it. Re-cropping the existing image without re-uploading is in "Later": it needs the
uncropped original, which we deliberately do not keep.

**Not in v1, with the reason:**

| Not in v1 | Why |
|---|---|
| Account avatars | §1.4 |
| Post hero images, images inside posts | Few leagues post. `Post.heroImageId` already points at `MediaAsset`, so this is a slot, not a redesign. First in line after v1 |
| Banners, venue photos, game banners, galleries | Nobody has asked; the columns exist and stay unused |
| SVG logos | SVG can carry script. Federations' logos arrive as WhatsApp images anyway |
| Video | §1.2 |
| Players changing their own photo | Players are roster entries (open decisions); youth leagues |

---

## 3. Guardrails

| Rule | Value | Enforced in | Why |
|---|---|---|---|
| Accepted formats | JPEG, PNG, WebP | browser (message), **API (decisive)** | The API reads the format **from the bytes**, never from the file name or the declared type |
| Refused, with a French message | SVG, GIF, HEIC, PDF, anything else | both | SVG can run script. GIF is animation. HEIC is the iPhone format: Safari converts it when a photo is picked, but desktop Chrome cannot read it, so the message says to export as JPEG |
| File picked | ≤ 20 MB | browser | Never sent as is; it is cropped and scaled first |
| File received | ≤ 5 MB | API, before reading it | Post-crop files are far smaller; anything bigger did not come through our UI |
| Dimensions | ≥ 128 × 128 after crop; ≤ 25 megapixels decoded | API | Smaller looks blurred even as an avatar. The upper bound stops "decompression bombs" (small files that decode to gigabytes) |
| Re-encoding | always | API | Applies the phone's rotation, then drops **all** metadata. A phone photo carries GPS: a youth player's photo must not carry the family's address |
| Sizes stored | WebP `sm` 128 px, `md` 512 px, `lg` 1024 px; logos also `md.png` | API | `sm` for lists, `md` for pages, `lg` kept so new sizes can be made later without asking anyone to re-upload; PNG because share cards cannot read WebP. Never enlarged: a 300 px source gives a 300 px `md` |
| Storage key | `t/<tenantId>/<slot>/<assetId>/<size>.<ext>` | API | Nothing from the user (no file names). The tenant prefix lets us list or delete one organisation's files |
| Caching | `public, max-age=31536000, immutable` | API, on each object | A replaced image gets **new** URLs, so nothing ever needs invalidating |
| Who may change what | the same rule as editing that entity | API | Reuses the existing access helpers (e.g. the team fetch-with-access check in `teams.service.ts:119`). **There is no generic upload route** where the browser says where a file goes |
| Image URLs from clients | **refused everywhere** | API | `logoUrl`, `profileImageUrl`, `avatarUrl` and `bannerImageUrl` leave every write DTO. Only the media service writes them |
| Rate | 20 uploads a minute per IP on the image routes | API | The global limit is 300 |
| Memory | one image processed at a time | API | Railway's free plan gives 0.5 GB per service |
| Youth leagues | when player names are hidden for a competition, its player photos are hidden too | public API | Hiding a child's name and showing their face is worse than neither |
| Consent line | « Cette photo sera visible sur le site public de la ligue. » | upload dialog, player photos | One line, no checkbox |
| Broken image | initials, always — including when the file fails to load | every display component | Roadmap §13 |
| Storage not configured | 503, « Le stockage des images n'est pas encore configuré. » | API | The rest of the app is unaffected |

**Budget.** One image is 4–5 objects, roughly 100–350 KB in all, so the free 10 GB holds about
30,000 images. A per-organisation cap and an admin storage gauge go in "Later". The realistic
abuse case (one sign-up uploading in a loop) is bounded by the rate limit and costs cents.

---

## 4. Architecture

```
 phone / browser                     API (Railway)                          R2 + Cloudflare
 ───────────────                     ─────────────                          ───────────────
 pick file ─► crop 1:1 ─► scale     PUT /teams/:id/logo (multipart)
 to ≤1024 ─► preview in its    ───► 1 access check (same as editing the team)
 real shapes ─► « Enregistrer »     2 ≤ 5 MB, read format from bytes
                                    3 sharp: rotate, strip, sm/md/lg (+png)  ──► PutObject × 4–5
                                    4 one transaction: MediaAsset row +
                                      the entity's logoUrl
                                    5 delete the previous image's objects    ──► DeleteObjects
                                                                              media.dxscores.com
 <img srcset="…/sm.webp 128w, …/md.webp 512w">  ◄────────────────────────── cached at the edge
```

### Backend — `src/media/`

- **`StorageService`** is an S3 client pointed at R2, behind a small interface (`put`, `delete`,
  `deletePrefix`). Changing provider changes configuration, not code.
- **`ImageProcessor`** wraps sharp: it detects the format from the bytes, checks the limits,
  produces the sizes, and processes one image at a time.
- **`MediaService`** has two methods: `replace(slot, entityId, file, user)` and
  `remove(slot, entityId, user)`.
- **The routes**, each with the access rule of the entity it changes:
  `PUT|DELETE /tenants/:id/logo`, `/leagues/:id/logo`, `/teams/:id/logo`, `/players/:id/photo`.
- **The entity's URL column stays the read path**, so the ~40 existing reads do not change. It
  stores the `md.webp` URL.
- **`MediaAsset` (it already exists) becomes the ledger**: tenant, uploader, key, size,
  dimensions, status. It answers "who uploaded this?" and "what does this organisation own?".
  The previous image is found from the entity's URL: its path gives the `storageKey`, which is
  unique. **No migration is needed**, which matters because Railway does not run
  `prisma migrate deploy` today.
- **Lifecycle:**
  - *Replace.* Write the new objects, commit the transaction, then delete the old objects. If the
    transaction fails, the new objects are deleted.
  - *Remove.* Clear the column, mark the asset `REMOVED`, then delete its objects. A failed delete
    leaves a `REMOVED` row for a later sweep.
  - *Soft-delete an entity.* Its images stay, so it can be restored.
- **Configuration:** `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`,
  `R2_PUBLIC_URL`. Either all five are set or none: a partial set stops the server at boot.
  These replace the `AWS_*` and `S3_*` names.
- **One bucket per environment.** A development key can never touch production.

### Frontend

- **`components/media/image-field.tsx`** is the one upload control:
  - It shows the current image in its real shape, with « Changer » and « Supprimer ».
  - The crop dialog uses `react-easy-crop`, loaded only when the dialog opens.
  - The preview shows the image at the sizes it will actually appear.
  - It shows upload progress; errors go through `toastApiError`.
- **`services/media.ts`** holds the React Query mutations and invalidates the entity's queries
  (per the module conventions).
- **`lib/media.ts` — `mediaSrc(url, size, format)`** swaps the size in our URLs and passes any
  other URL through untouched.
- **One display rule:**
  - Plain `<img>` with a `srcset` of `sm`/`md`, explicit width and height, lazy loading, and
    initials on error.
  - The avatar and crest components move off `next/image`: the sizes are already made, Vercel's
    optimiser has a quota, and a development bucket's host would be refused. The league site's
    `ClubMark` and `SiteMark` already work this way.
- **Share cards** ask for `md.png`.
- **The standings export** needs CORS on the bucket for `GET` from `https://dxscores.com` and
  `http://localhost:3000`. Its existing `cacheBust` keeps a cached copy without the header from
  getting in the way.

---

## 5. Sprints

Each sprint ends with something to look at in a browser. The owner says « go » before each one.

### Sprint 0 — Close the hole (both repos, ~2 h, no Cloudflare needed)

**What.** Close every path that could write to storage or plant a URL.
- Delete `src/upload` and `src/upload2`, and the `AWS_*`/`S3_*` names in `env.validation.ts` and
  `.env.example`.
- On the frontend, delete `utils/upload.ts`, `useUploadAndConfirm`, the unused
  `BusinessProfileForm` and the hero-image picker in `post-form.tsx`.
- Remove the logo-URL box from `/team/edit` and the two URL boxes from `user-form.tsx`.
- Then remove the image-URL fields from every write DTO.
- Correct `INFRASTRUCTURE.md` on the card.

**Order matters.** The API refuses unknown fields (`forbidNonWhitelisted`). If the backend ships
first, `/team/edit` starts answering 400. So the frontend ships first, then the backend.

**Achieves.** Nothing on Railway can write to a bucket or make a league site load a stranger's
URL, before any key exists.

**Verify.**
- `/uploads2/proxy` and `/uploads/presign` answer 404.
- `PUT /teams/:id` carrying `logoUrl` answers 400.
- The team, player, league, organisation and user forms still save, checked in the browser as
  each role.
- Backend tests and lint are no worse than before.

#### Sprint 0 — done 2026-10-06 (committed: frontend `d5d921e`, `433f6fc`; backend `8a08f6e`; not deployed)

**Done, beyond the list above.** Two more ways to attach an image were found and removed:
- `businessProfile.logoAssetId` / `bannerAssetId` on organisation, league and club creation and
  update;
- `heroImageId` on posts.

Each connected **any asset id the client sent**, including another organisation's. The image
fields now exist only on the outbound `OutBoundBusinessProfile`. `types/api.d.ts` was regenerated;
it had been stale since 2026-09-30 and still described the deleted public API.

**Verified** on a throwaway database and API (`elenem_s0`, port 3334), dropped afterwards. The dev
database's counts were identical before and after.
- **27 API checks**, as each role:
  - the five upload routes answer 404;
  - an image field answers 400 on organisations, leagues, seasons, posts, accounts and
    registration;
  - the same requests without it save.
- **In the browser** (a frontend on :3001):
  - `/team/edit` saves and no longer has a logo box;
  - a post publishes with no hero image;
  - `/admin/users/create` creates a user;
  - the organisation's colours save (a nested profile update);
  - the league's Identité saves.
- **Tests:** 228/228.
- **Typecheck:** clean in both repositories.
- **Lint:**
  - backend 878 errors and 39 warnings, against 881 and 40 before;
  - frontend changed files are clean; the one error left in the sources predates the sprint
    (`utils/resolveTenantSlugFromHostname.ts:32`).

**Deploy order: the frontend first, then the backend.** An old frontend talking to the new API
would get a 400 on every post save, because it always sends `heroImageId: null`.

**Found on the way, not fixed — each predates this sprint:**
1. **`PUT /teams/:id` and `PUT /players/:id` validate nothing.** Their body is typed as a union of
   DTOs, which compiles to `Object`, so the validation pipe has no class to check against. Image
   fields there are now *ignored* rather than refused; the check confirmed nothing is stored.
   Before this sprint, a club admin could set any URL as a player's photo, because the service
   copied it. Names, short codes and shirt numbers are unvalidated too. The fix is to validate
   against the caller's role's DTO inside the service. It needs its own browser pass over every
   team and player form.
2. **`/team/edit` never saves the description.** `Team` has no such column and the service never
   writes the profile's one, yet the page says « Club mis à jour ».
3. **`POST /posts` without a `slug` is a 500.** The DTO marks it optional; the database requires
   it. The form always sends one.
4. **Opening `/admin/users/create` directly, or refreshing it, bounces to the dashboard.**
   `UserForm` reads the auth store before it hydrates and treats `null` as signed out
   (`user-form.tsx:262`). Reached from `/admin/users`, it works.

### Sprint 1 — The pipeline (backend)

**What.**
- `src/media/` as in §4: sharp, the R2 client, the eight routes, ledger rows, rate limit,
  configuration check, and the 503 when unconfigured.

**Needs.** The development bucket and its key in `.env` (§6, A).

**Verify.**
- Unit tests on the processor:
  - a sideways phone JPEG comes out upright with no GPS;
  - SVG, GIF, HEIC and a renamed `.exe` are refused;
  - an 8000 × 8000 image and a 40 × 40 image are refused;
  - a transparent PNG keeps its transparency.
- A club admin changing another club's crest gets 403.
- The objects appear in the development bucket with the right type and cache header.
- Replacing an image deletes the previous objects.
- The ledger rows are correct in the database.

#### Sprint 1 — done 2026-10-07 (backend, not deployed)

**Built**, in `src/media/`:
- `image-slots.ts`: the four slots, the two kinds (logo, photo) and the three sizes.
- `image-processor.ts`: sharp, one image at a time.
- `storage.service.ts`: the S3 client pointed at R2.
- `media.service.ts`, `media.controller.ts` and `upload-image.decorator.ts`: the eight routes,
  with the 5 MB limit, the 20-a-minute rate limit and multer's errors in French.

Also:
- **Boot check.** `env.validation.ts` refuses half of the five `R2_*` variables, and an endpoint
  with the bucket left on the end (the mistake the bucket page invites). `.env.example` documents
  the five.
- **Dependencies.** sharp 0.34.5 is in; the lockfile carries its Linux build for Railway.
  `@aws-sdk/lib-storage` and `@aws-sdk/s3-request-presigner` are out, being unused since sprint 0.

**Beyond the plan:**
- **A change made meanwhile is refused (409), not overwritten.** The pointer moves only if it still
  shows what was read, and the loser's new files are deleted.
- **Removing works without storage configured**: it clears the pointer, and the files go once
  storage is back.
- **Deleting never leaves the entity's own organisation.** The previous image's prefix is read from
  the URL's path and must start `t/<that organisation>/`, whatever the entity pointed at.

**Verified:**
- **40 new unit tests**, 268 in all, all passing:
  - the processor (15): a sideways phone photo with GPS comes out upright with no metadata; SVG,
    GIF, HEIC, a renamed program, a truncated JPEG, 26 MP and 40 px are refused; logos are never
    cut and keep their transparency;
  - the service (20): the order of writes, rollback, the 409, the permission matrix for all eight
    roles and scopes, and that deletion stays inside the organisation;
  - the boot check (5).
- **44 end-to-end checks** against the real development bucket, on a throwaway database and API
  (dropped afterwards; the dev database's counts identical before and after; the bucket empty at
  the start and again at the end):
  - every role refused outside its scope, with nothing written;
  - files served with the right type, size and year-long cache;
  - the club reading its crest through the existing read path;
  - replacement deleting the old files;
  - the ledger right;
  - the refusals in French;
  - two simultaneous saves giving 200 and 409;
  - removal;
  - the rate limit.
- **Memory.** The worst file accepted (25 MP) adds **22 MB** at peak and takes 4.2 s on this Mac.
  The upload is not the risk. The API itself idles at **350–400 MB** in dev mode, which on Railway's
  0.5 GB is thin headroom with or without images. **Sprint 4 must read Railway's memory graph.**
- **Lint and types.** Lint is back to 878 errors and 39 warnings; tsc is clean.

**About the development bucket** (`dxscores-media-dev`, created by the owner on 2026-10-06):
- Its token can read and write objects in that one bucket and nothing else; it cannot even read
  the bucket's settings, which is the right scope.
- It has no CORS rule yet. That is needed for sprint 3 (the standings export).
- Its `r2.dev` address has no edge cache. Production's own domain will.
- The owner's `.env` was tidied to the five `R2_*` names: the endpoint lost its bucket path, and
  the Cloudflare API token stays only as a comment, since the app never reads it.

### Sprint 2 — Uploading (frontend)

**What.**
- `ImageField` and its crop dialog, mounted in four places: organisation settings, league
  settings, the club page and edit screen, and the player edit screen and quick view.

**Verify.** In the browser as an organisation admin, a league admin and a club admin, at phone
width, with:
- a portrait phone photo;
- a transparent PNG logo;
- a wide logo zoomed out inside the square;
- a logo saved from WhatsApp;
- a delete;
- each refusal message, in French.

#### Sprint 2 — done 2026-10-07 (frontend, not deployed)

**Built:**
- `components/media/image-field.tsx`, the one upload control:
  - the image in the shape it is shown in (round for clubs and players, a rounded square for
    organisations and leagues), with initials when there is none or when it fails to load;
  - « Ajouter un logo » / « Changer » / « Retirer », and a confirmation before removing;
  - it saves on its own when the crop is confirmed, whatever form it sits in.
- `components/media/crop-dialog.tsx` (react-easy-crop 5.5.7, MIT):
  - a photo fills the square and is dragged to centre the face;
  - a logo opens fitted whole, and can be zoomed out further with transparent sides;
  - a live preview at a table-row size and a page size;
  - upload progress, then « Préparation des différentes tailles… ».
  - It loads only when a file is picked: an 8 KB gzipped chunk that no page loads up front.
- `components/media/crop-image.ts`: the browser crops and scales to at most 1024 px before
  sending, as PNG for a logo and JPEG for a photo. The phone's GPS never leaves the device; the API
  strips it again anyway.
- `services/media.ts` (the mutations) and `lib/media.ts` (`mediaSrc`, ready for sprint 3).

**Mounted in five places:**
- organisation settings, General tab, above « Couleurs du site », whose site preview now shows the
  logo;
- league settings, Identité tab, as a « Logo » section;
- the « Modifier le club » dialog, which is how organisation and league admins reach a club;
- `/team/edit` for the club's own admin (now `/team/settings`, see the follow-ups below);
- the « Modifier le joueur » dialog, with « Cette photo sera visible sur le site public de la
  ligue ».

**Refused in the browser before anything is sent**, with the same French wording as the API: SVG,
GIF, HEIC, other formats, over 20 MB, and a picture under 128 px (a photo's short side, a logo's
long side).

**Verified** in a real browser against a throwaway database and API, writing to the development
bucket. 22 checks, as an organisation admin and a league admin at desktop width and a club admin at
phone width:
- each of the five places saves and removes;
- the refusals send nothing;
- a stored wide logo is square and uncut;
- a sideways phone photo is stored upright with no EXIF;
- the club dialog stays open under the crop dialog.

Afterwards: 17 assets created and removed, the bucket empty, the dev database unchanged.
`next build` passes; tsc and lint are clean on the changed files.

**Found on the way:**
1. **Fixed: an empty circle right after « Logo enregistré ».** The stored image takes a moment to
   arrive (0.4–0.9 s here, seconds on 3G). The field now shows the crop it just sent until then;
   checked on an emulated slow 3G.
2. **Fixed on 2026-10-07 (see below), predates this work:** the player dialog's scope lookup
   (`player-scope-fields.tsx`) asked for `GET /leagues/:id`, which a club admin is refused (403,
   retried three times). Its sport then fell back to « BASKETBALL ». That turned out to be harmless:
   the backend does not store a player's sport.

#### Follow-ups, 2026-10-07 (asked by the owner after reviewing sprint 2)

**`/team/edit` is now `/team/settings`**, named and placed like the organisation's and the
competition's settings:
- The menu reads « Paramètres », last in a new « Administration » group (Utilisateurs, Actualités,
  Paramètres), the same group, in the same order, as a competition's menu. « Mon club » keeps
  « Effectif ».
- The page has the league settings' layout: a « Paramètres » title over the club's name, and two
  sections that save separately, « Identité » and « Logo ».
- The middleware answers `/team/edit` with a 308 to `/team/settings`, **keeping the query**, which
  carries the club context (`ctxTeamId`) of an organisation or league admin.

**The bugs found in sprints 0 and 2, fixed:**
1. **`PUT /teams/:id` and `PUT /players/:id` validate their body** against the caller's role's DTO,
   through `validateBody` (backend `src/common/validation/`). It uses the same options as the global
   pipe, which now reads them from the same constant. An image URL, a one-letter name or a number
   sent as text is a 400 that names the field.
2. **A club's description is saved.** It goes to its business profile, and the page reads it from
   there. Clearing it works: the page sends `null`, because the API turns `''` into « not sent »
   on every PUT (below).
3. **The player dialog no longer asks for the competition when the club is known.** The club's
   own record gives the organisation and the sport.
4. **Found while fixing 1: a club admin could not save any change to a player.** The dialog always
   sent the name and `teamId`, and the service refused them (403, « Team Admins cannot update
   sensitive player details », in English). The fix:
   - **A club admin may now correct a player's name** (players are roster entries, ROADMAP_V2 §6),
     as well as the number, position, preferred foot and hand, and bio.
   - **Moving a player and the e-mail (a login) stay with the organisation and the league.** The
     dialog hides the e-mail field from a club admin.
   - **The dialog sends only what changed.**

**Fixed, found by watching the logs: passwords were written to the API log in clear.**
`SanitizeDtoInterceptor` printed every PUT and PATCH body before and after sanitising it. That
includes `PUT /users/me/password` (current and new password) and `PUT /users/:id` (an admin setting
one). Proven with a canary password on a throwaway API, and gone after the fix. **On production,
any password changed since the API was deployed is in Railway's logs.** Those logs are visible
only to the project's members, but the owner may want to change their own password after this
ships.

**Verified:**
- 16 API checks and 12 browser checks, as a club admin, a league admin and an organisation admin,
  on a throwaway database and API;
- the dev database unchanged;
- backend tests 272/272;
- lint 877 errors and 39 warnings (from 878 and 39); frontend lint clean on the changed files.

**Noticed, and the owner's answers (2026-10-07):**
- **Prisma logged every SQL statement in production.** No values leaked (they show as `$1`), but it
  was a line per query. Now development only, at the owner's word.
- **No form can clear a text field by sending `''`.** `SanitizeDtoInterceptor` maps it to
  `undefined` on every PUT/PATCH, so a cleared field quietly keeps its old value unless the form
  sends `null`. Fixed for the club description; other forms are unchecked.
- **Namesakes.** The owner pointed out that creation already suffixes (`patient-kasereka-2`), and it
  does. The rename path did not, and it was worse than reported: it re-derived the slug on *every*
  edit, so the second namesake could not be edited at all, a shirt number included (409). Fixed:
  the slug changes only with the name, through the same suffixing helper as creation.
- **Posts** (the slug 500, cover images) wait until R2 is finished (owner). Still open, and also
  not now: a hard load of `/admin/users/create` bounces to the dashboard.
- **Layout (owner):** the logo sits at the top of each « Identité » card (club, competition) and
  first in the organisation's General tab, and above the name in « Modifier le club », as in the
  player dialog. The separate « Logo » sections are gone. All the settings pages get a later pass.

### Sprint 3 — Showing them (both domains)

#### Sprint 3 — done 2026-10-07 (both repos, not deployed)

**It started from a crash the owner hit.** After a crest upload, `/league/standings` failed with
« Invalid src prop … hostname pub-….r2.dev is not configured ». next/image refuses any host not in
next.config, and the development bucket's is not, and should not be.

**One display component.** `components/media/entity-image.tsx` is a plain `<img>`:
- `srcset` of the stored `sm`/`md` files, explicit size, lazy loading;
- initials when there is no image or it fails to load.

Through it now:
- the standings table, the clubs table, the account dashboard;
- `Avatar` (game cards, both dashboards), and `TenantLogo`, `LeagueLogo` and `UserAvatar`, which
  each fetched a placeholder from placehold.co for every missing logo;
- the player page and quick view, round as the photo was framed.

The game page draws its crest on the dark band itself; the navbar avatar is a plain `<img>`.
next.config now lists only `media.dxscores.com`, for the two post components that still use
next/image.

**Found: crests could never have shown on game screens.**
- The games API (16 selects in `games.service.ts` and `game-results.service.ts`, and one in
  `standings.service.ts`) sent only `logoAsset`, which nothing writes. They now send `logoUrl`.
- The game page's schema dropped the `businessProfile` it arrives in.
- The clubs table read `logoAsset`.

All three are fixed.

**League sites:**
- `ClubMark` and `SiteMark` load the 128 px file.
- The club page's roster and the player page show photos. The public API sends `photoUrl` only
  for a named player: when a competition hides names, faces go with them, and the player page is
  404 as before.
- The scorers table and the box score stay text, to keep them light.
- **The game share card shows both clubs' crests** (initials for a club without one).
- The league card and the structured data use `md.png`.

**The standings export** fetches the organisation's logo with CORS (the development bucket's rule
is set), so the PNG carries it.

**Verified:**
- **9 public-API checks**, on a throwaway database and API: the photo on the roster and the player
  page while names are shown; once the competition hides them, its URL is in no public response
  and the player page is 404.
- **16 browser checks**, as a league admin, an organisation admin and a club admin:
  - the logos' new places;
  - a crest uploaded from « Modifier le club », then loading in the standings (the 128 px file, no
    next/image error) and on the game page;
  - the organisation logo inside the exported PNG.
- **6 read-only checks on the owner's dev data**, as an anonymous visitor on emulated 3G:
  - AS Goma West's crest on libago's standings and club page, at 4.6 KB;
  - its game share card drawn with the crest.
- **Afterwards:** the bucket holds exactly the one image the dev database points to; every
  throwaway upload was removed through the API.
- **Tests:** backend 274/274, with 2 new tests for namesakes.
- **Lint and types:** lint 873 errors and 39 warnings (from 877); tsc clean both sides; frontend
  lint clean on every changed file.


**What.**
- `mediaSrc`, and one avatar component and one crest component replacing the six.
- Images on the league site's pages.
- PNG logos on the share cards.
- The logo in the standings export, with the bucket's CORS rule.
- The public API hides photos where player names are hidden.

**Verify.**
- The image weight of the standings page on a throttled 3G profile.
- A WhatsApp paste of a league link shows the logo.
- The exported PNG includes the logo.
- With the youth switch off, no photo appears in the page or in the API response.

#### Sprint 3 follow-up — the league site's images, Marqueurs first (owner, 2026-10-07)

The owner asked that team and player images show correctly across the public side, above all on
`/stats` (« Marqueurs »), where an image should stand out when there is one.

**Marqueurs:**
- **The top three stand out above the table, on the first page.**
  - Each card shows the player's photo, or their club's crest when they have none, or initials.
  - The leader's card carries the one accent.
  - On a phone each card is a row and the name runs to two lines rather than being cut; wider,
    the three cards stand side by side.
  - Shown only when one of the three has a photo or a crest, so a league with no images keeps
    the plain table rather than three cards of initials.
- **In the table:** a 32 px photo beside each name that has one, and the crest beside each
  club's name. Rows without a photo keep an invisible slot, so names align without a column of
  empty discs.
- **The API:** `PublicScorerRowDto` gains `photoUrl`, only for a named player (the same rule as
  the roster). `/scorers` already answers 404 for a competition that hides names.

**Elsewhere on the league site:**
- the home page's scorers list shows the photo when there is one, otherwise the crest;
- the player page shows the crest beside the club's name;
- the box score heads each club's sheet with its crest, and the team comparison too;
- one server component, `PlayerPhoto`, draws every player photo on the league site.

**Verified** on a production build served on :3001 against a throwaway API, with real uploads:
- #1 and #3 with photos, #2 without, so its club's crest stands in;
- both widths;
- on a phone on 3G, all of `/stats`'s images weigh 19.2 KB (6 images);
- the home, player, club and game pages;
- 21 checks.

The only console errors were `/_vercel/insights` and `/_vercel/speed-insights`, which exist only
on Vercel. Afterwards the bucket held only the owner's two crests, and the dev database was
unchanged.

### Sprint 4 — Production

**What.**
- The owner sets up the production bucket, `media.dxscores.com` and the Railway variables (§6, B).
- I check:
  - **that sharp loads on Railway** (the main deployment risk, because it ships a native binary);
  - one upload end to end from a phone;
  - Railway's memory graph during uploads.

**Verify.**
- An image uploaded on production loads from `media.dxscores.com`, and shows
  `cf-cache-status: HIT` on the second load.
- Memory stays well under 0.5 GB. Sprint 1 measured an upload at +22 MB at worst, and the API idling at
  350–400 MB in dev mode, so the number to read is the idle one.

### Sprint 5 — Images for the demo and dev leagues

**What.** `scripts/seed-images.mjs` uploads through the **real API**, as each organisation's own
admin, the way `seed-demo-league.mjs` builds the demo. That also makes it the pipeline's load
test. It is resumable, like the demo seed, because Railway's free instance drops long runs.

- **Crests — generated in code, recommended.** A shield or roundel in two club colours with the
  short code as a monogram, drawn as SVG and rendered to PNG before upload.
  - Why: free and repeatable, it reads as one designed set across twenty clubs, and it never
    garbles text.
  - Why not AI: AI logos still mangle lettering, drift in style from club to club, and spend
    credits.
  - Leave two or three clubs without a crest, so the demo shows the fallback too.
  - The demo clubs are fictional (Aigles BC, Kivu Stars…), so no real club is misrepresented.
- **Player photos — to decide at that sprint.** My recommendation:
  - AI portraits of **fictional** people, demo league only, for a subset: the top scorers and one
    full roster, about 25–30 players. Everyone else stays on initials.
  - **Never stock photos of real people** attached to invented names and statistics.
  - The local dev seed gets neutral silhouettes, enough to exercise the pipeline.

**Verify.** The owner reviews `demo.dxscores.app` in the browser.

### Later — written down, not planned

- Account avatars (§1.4).
- Post hero images: **wide, not square** (D3); proposed at 16:9, to confirm when posts get their slot.
- Re-crop without re-upload.
- A per-organisation cap and a storage gauge in `/admin`.
- A sweep for `REMOVED` assets and orphaned objects.
- Deleting a hard-deleted organisation's `t/<tenantId>/` prefix.
- Cloudflare Image Transformations, if the number of sizes ever grows.
- A Railway pre-deploy `prisma migrate deploy`. This plan needs no migration; the next change
  that does will.

---

## 6. What the owner provides

Almost none of this comes from Railway: R2 lives in Cloudflare. Railway is only where the
production keys get pasted. **Never send a secret in chat.** Paste secrets into the `.env` file
or the Railway dashboard yourself, and send me only the non-secret values marked below.

### A — before sprint 1 (development only) — done 2026-10-06, except item 4 (needed from sprint 3)

1. **R2 activated** on the Cloudflare account, which asks for a card or PayPal (§1.1). If that is
   not possible, stop here and tell me.
2. **A bucket `dxscores-media-dev`**, with its *Public Development URL* (`r2.dev`) switched on.
   → Send me: the `r2.dev` URL, and the **S3 API endpoint** shown in the bucket's settings. An
   EU-jurisdiction bucket has a different endpoint, so copy it rather than typing it.
3. **An API token**: *Object Read & Write*, scoped to **that bucket only**. Paste the access key
   ID and the secret into `elenem-backend/.env` yourself; sprint 1 adds the empty lines.
4. **A CORS rule** on the bucket, needed from sprint 3 (the standings export reads images from the
   page). R2 → `dxscores-media-dev` → Settings → CORS Policy → paste:
   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3000", "http://localhost:3001"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 86400
     }
   ]
   ```
   Production's bucket gets the same rule with `https://dxscores.com` instead.

### When the production bucket, and whether Cloudflare's MCP would help (answered 2026-10-07)

- **Create `dxscores-media` when sprint 4 starts, not before, and never reuse the development
  one.**
  - Keys that live on a laptop must never be able to touch production files.
  - Test uploads stay out of what the public sees.
  - Nothing in sprints 2 and 3 needs it.
- **No MCP.** Cloudflare's MCP would need an account-wide token (DNS, Workers, every bucket) to
  save three clicks in the dashboard: a CORS rule, a custom domain and a token. The token made for
  development can touch objects in one bucket and nothing else, which is the right reach for a
  coding session. Revisit if Cloudflare work becomes routine.

### B — before sprint 4 (production)

**2026-10-07: the owner reports the bucket and the five Railway variables in place.**
- `media.dxscores.com` answers through Cloudflare with a valid certificate: a 404 on an empty
  bucket, as expected.
- **The three non-secret values, checked 2026-10-07:**
  - `R2_ENDPOINT` is the bare account host, with a trailing slash that R2 accepts (tried with the
    development keys);
  - `R2_BUCKET` is `dxscores-media`;
  - `R2_PUBLIC_URL` is `https://media.dxscores.com`.
- **A bad image setting no longer stops the API** (backend `storage-config.ts`). It used to refuse
  to boot, which would have taken the whole product down over a logo, against roadmap §13. Now:
  - an incomplete or invalid set turns uploads off (503) and logs why;
  - quotes and trailing slashes left by a paste are forgiven;
  - with a good set, the boot log reads « Images stored in dxscores-media, served from
    https://media.dxscores.com », the first line to look for after the deploy.
- **CORS: only `https://dxscores.com`, and that is enough.**
  - Only the standings export draws images into a canvas in the browser (html-to-image), and it
    lives on the app domain.
  - League sites on `*.dxscores.app` use plain `<img>` tags, which need no CORS.
  - The share cards fetch logos from the server.
  - `www.dxscores.com` redirects to the apex.
- **One production-only check after the first upload:** Cloudflare caches the images, and a copy
  first cached by a plain `<img>` load may lack the CORS header the export's fetch needs.
  - The export busts the cache (`cacheBust`), so it should not matter; test it anyway.
  - If it does matter, a Transform Rule on `media.dxscores.com` that sets
    `Access-Control-Allow-Origin: *` fixes it. The images are public.

**The development token's value was printed in a session transcript on 2026-10-07**, through a
read of `.env` whose filter let a commented-out line through. It is scoped to
`dxscores-media-dev` only. The owner is to roll it in Cloudflare and paste the new keys into
`.env`; the commented lines were removed from `.env`.

5. **A bucket `dxscores-media`**, with:
   - the custom domain `media.dxscores.com` (orange cloud);
   - its own token, scoped to that bucket;
   - the same CORS JSON, with the production origins.

   → Tell me: was it already created during `INFRASTRUCTURE.md` step 8, and with which location?
6. **Railway → backend service → Variables**: the five `R2_*` values. → Tell me:
   - whether the plan is still the free one (0.5 GB RAM);
   - which builder the deploy logs name in their first lines (Railpack or Nixpacks);
   - the start command.

### Decisions

- **D1. Yes.** The owner added a card on 2026-10-06 (§1.1).
- **D2. Decided as recommended, at the owner's request.** v1 is the organisation, league and club
  logos and the player photos. Account avatars come later: they appear only in the account menu,
  on no public page.
  - When they come: a `user-avatar` slot on `User.avatarUrl`, and `User.profileImageUrl` (a
    duplicate) dropped.
  - Cost: about thirty minutes once sprint 2's upload control exists.
- **D3. Yes: 1:1 everywhere, except blog posts.** A post's hero image will be wide (see "Later").
- **D4.** Player photos for the demo: decided at sprint 5. The recommendation is in §5.
