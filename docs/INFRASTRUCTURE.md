# Infrastructure — decisions, and why

> Written 2026-09-11, before Phase 5; §6 expanded the same day into a tutorial, because the person
> doing these steps has not set up DNS before and a list of ten verbs is not instructions.
>
> **The product is renamed DXScores.** `elenem.com` could not be had. `dxscores` says what it is
> about — scores, sport — and the `dx` carries `d/dx`: deriving something from the numbers, which is
> what standings and a scorers' table actually are. The repositories, the code and these documents
> still say *elenem* everywhere; renaming them is a Phase 5 task, not a prerequisite.
>
> Every claim about a provider's limits here was **checked
> against that provider's own documentation on the date above**, not recalled. Where a limit is
> load-bearing, the check is written next to it, because free tiers change and the next reader needs
> to know what was true when the decision was made rather than take it on trust.

---

## 0. What this has to be

**Free to run at launch**, and free in a way that does not become a bill by surprise. That ruled out
the obvious default before anything else was considered:

> **AWS S3 is rejected.** It requires a card to open an account; its 5 GB free tier expires after
> twelve months; and — the part that actually decided it — **exceeding the free tier bills you
> immediately, inside the twelve months as well**. A free product for a Goma federation cannot be
> one card-skimming mistake away from an invoice nobody can pay. The failure mode we need is *stop
> working*, not *charge*.

Everything below is chosen against that standard, then against fit.

---

## 1. The shape

Two domains, each doing the thing it is good at. This is the Notion model — `notion.so` for the
product, `notion.site` for what customers publish — and it is the right one here for the same
reason.

```
  ┌─ APP + MARKETING ─────────────────┐   ┌─ TENANT PUBLIC SITES ────────────┐
  │  <name>.com                       │   │  <name>.app                      │
  │  DNS: Cloudflare                  │   │  DNS: Vercel (required)          │
  │                                   │   │                                  │
  │  @ , www   → Vercel   (app)       │   │  *.<name>.app → Vercel           │
  │  api       → Render   (NestJS)    │   │                                  │
  │  media     → R2       (images)    │   │  libago.<name>.app               │
  │  TXT/DKIM  → Resend   (email)     │   │  liprobakin.<name>.app           │
  └───────────────────────────────────┘   └──────────────────────────────────┘
```

### Why two, and not one

`*.domain` on Vercel **requires Vercel's nameservers** — the docs are explicit: *"If using your
custom domain as a wildcard domain, you must use the nameservers method for verification."*

An R2 bucket's public custom domain **requires the zone to be on Cloudflare's nameservers**.

On one apex those are mutually exclusive, and the resolution offered — manual subdomains, no
wildcard — was **wrong for this product**: self-serve onboarding is a Phase 5 goal, and a federation
that signs up at nine in the morning cannot wait for somebody to add a DNS record before their site
exists. Wildcard is not a convenience here, it is the feature.

Two domains makes the conflict disappear rather than trading against it. Each gets the nameservers
it needs.

### Why `.app` for tenants

- It is on the **HSTS preload list**, so every tenant site is HTTPS-only at the browser level, with
  no http:// fallback to get wrong. Vercel issues the certificates automatically.
- It reads as *a thing that belongs to them* rather than a folder on our site — which matters for
  the artefact this product exists to replace, a signed sheet a federation publishes under its own
  name.
- It leaves the road open: a federation that later wants `libago.cd` points it at Vercel and the
  subdomain becomes a redirect.

---

## 2. Each piece

### Domain registration — Namecheap

Registration only. Nameservers move elsewhere for both domains, so the registrar's DNS panel is
never used. Chosen because it is what the owner already knows; nothing about it is load-bearing, and
moving registrars later costs an afternoon.

**~$12–26/year, the only recurring cost of the whole stack.**

### DNS — Cloudflare (the `.com`) and Vercel (the `.app`)

Free on both. Cloudflare on the `.com` is what makes R2's custom domain and Resend's DKIM records
possible; Vercel on the `.app` is what makes the wildcard possible. Neither is a preference.

### Frontend — Vercel, Hobby

The app is Next.js; this is the host it is built for. **Hobby is free, with 50 custom domains per
project** (checked 2026-08-28 doc revision), which is the ceiling on *bring-your-own-domain*
tenants, not on subdomain tenants — those are covered by the one wildcard entry.

> **Hobby is licensed for non-commercial use.** The launch is free, so this is fine today. The day
> DXScores charges anybody, Vercel Pro ($20/mo) stops being optional. That is a licence term, not a
> technical limit, and it is worth knowing before it is a surprise.

### Backend — Render, free tier + a keep-alive ping

**Decided: free, with a ping, and revisit with numbers.**

Checked against Render's own free-tier documentation:

| | |
|---|---|
| Spin-down | after **15 minutes** without inbound traffic |
| Cold start | **about one minute**, showing a loading page |
| Budget | **750 instance-hours per month, per workspace** |
| Free Postgres | **expires 30 days after creation** |

A federation secretary opens Elenem once a day. Without intervention *every* first request of the
day is a one-minute wait — which is not slowness, it is the product appearing to be broken.

So a free cron (cron-job.org, UptimeRobot) hits `/health` every ten minutes and it never sleeps.
The arithmetic is tight and worth writing down: **24/7 is ~730 hours against a 750 budget.** It
fits, with about twenty hours spare, and it means **there is no room for a second free service** in
the same workspace — no free staging backend. That is the actual cost of this choice, and it is
worth more than $7/month until there is a reason otherwise.

Render Starter is **$7/month** and removes all of the above. Revisit when the ping proves
unreliable, when a staging backend is wanted, or when the first federation is paying.

*(Railway was the original plan and is out: it requires a card, and not a prepaid one.)*

### Database — Neon

**Decided: Neon over Supabase.**

Supabase was the instinct and it is a good product. But Elenem uses **none of what Supabase adds** —
it has its own JWT auth, and object storage is going to R2 — so it would be a large platform
operated as a plain Postgres, with a free project that **pauses after 7 days idle and needs a manual
restore from a dashboard**. In an off-season that is a live hazard.

Neon is a plain Postgres with **0.5 GB free**, autosuspend that **resumes in under a second with no
human involved**, and branching — which matters more here than it looks, because this project's
migration rule is strict (`docs/ELENEM_LOCAL_DEV`: never `db push`, always a migration off the
baseline). Testing a migration against a branch of real data is the cheapest way to keep that rule.

The backend is a long-lived Render process, not a serverless function, so a direct connection is
correct and none of the pooling complexity applies.

### Object storage — Cloudflare R2

**Decided, and it is the clearest decision in this document — but it does not gate the launch.**

Roadmap item 17 was written as *"blocking for the public site"*. **That framing is withdrawn.** A
club in Goma frequently has no logo at all, and a federation that has never published a photograph
still has a table, a calendar and results — which is the entire product. **A missing image must
never stop a game being saved, a standing being computed, or a page being served.** Every image in
the public site renders a placeholder and moves on. R2 is how images work when they exist; it is not
a precondition for anything.

- **10 GB free, with no expiry** — not twelve months.
- **Zero egress fees.** This is the one that matters long-term: images are read far more than they
  are written, and egress is what makes object storage expensive everywhere else.
- **S3-compatible API**, so `@aws-sdk/client-s3` works against it unchanged and nothing in the code
  is R2-specific.
- **No card at signup** — confirmed by the owner opening an account on 2026-09-10.

Public reads go through a custom domain on the `.com` (`media.<name>.com`). The
`pub-<hash>.r2.dev` URL exists but is rate-limited and documented as not for production.

### Transactional email — Resend

Free: **3,000 emails/month, 100/day, one verified domain.** Elenem sends verification and
password-reset mail and nothing else, so the daily cap is the binding one and it is not close.
Verification needs DKIM/SPF records — on the `.com`, at Cloudflare.

### Errors — Sentry, free tier

Unchanged from the roadmap.

---

## 3. What this costs

| | Monthly | Yearly |
|---|---|---|
| Two domains | — | ~$12–26 |
| Vercel Hobby | $0 | |
| Render free + cron ping | $0 | |
| Neon free | $0 | |
| Cloudflare R2 (10 GB) | $0 | |
| Resend free | $0 | |
| Sentry free | $0 | |
| **Total** | **$0** | **~$12–26** |

First things to cost money, in the order they will:

1. **Render Starter, $7/mo** — the moment the ping is not enough, or a staging backend is wanted.
2. **Vercel Pro, $20/mo** — the moment DXScores charges anybody, on licence grounds.
3. Neon and R2 have real headroom; neither is a near-term concern.

---

## 4. What the code has to change

Three things, none large, all of which have to land before the first deploy.

### 4.1 Two root domains, not one

`utils/resolveTenantSlugFromHostname.ts` and `middleware.ts` assume **one** `NEXT_PUBLIC_ROOT_DOMAIN`
(today `elenem.site`) and treat every subdomain of it as a tenant. With the split, the app's own
domain and the tenant domain are different:

- `<name>.com`, `www.<name>.com` → the app. Never a tenant.
- `*.<name>.app` → a tenant, and the label is the slug.

So it needs `NEXT_PUBLIC_APP_DOMAIN` and `NEXT_PUBLIC_TENANT_DOMAIN`, and the resolver returns a
slug only for the second. `lvh.me` stays the local equivalent of the tenant domain, which is what
already works today.

### 4.2 Reserved slugs

Self-serve onboarding means a tenant slug becomes a public hostname **the instant somebody signs
up**. `www`, `api`, `app`, `admin`, `media`, `cdn`, `mail`, `static` and friends have to be refused
at registration, or the first person to call their federation *API* takes out a subdomain the
infrastructure needs. Enforced server-side, next to the existing slug generation.

### 4.3 The storage adapter

There is no S3 code yet, which is fortunate — nothing has to be unpicked. What lands should be an
**`@aws-sdk/client-s3` client pointed at R2's endpoint**, behind a small interface, so the product
never names its provider. That is the same rule the sport columns follow (`PLAYERS_AND_STATS` §1)
and it is what keeps a move cheap if R2's terms ever change.

---

## 5. Decisions, dated

| Date | Decision | Because |
|---|---|---|
| 2026-09-11 | **Not AWS S3** | Card required; 5 GB free expires at 12 months; overage bills immediately even inside the free year |
| 2026-09-11 | **Cloudflare R2** for object storage | 10 GB free with no expiry, zero egress, S3-compatible, no card |
| 2026-09-11 | **Two domains**, `.com` app / `.app` tenants | Vercel wildcard needs Vercel NS; R2 custom domain needs Cloudflare NS; one apex cannot do both |
| 2026-09-11 | **Wildcard, not manual subdomains** | Self-serve onboarding is a Phase 5 goal; a tenant cannot wait on a human adding DNS |
| 2026-09-11 | **Render free + keep-alive ping** | 15-min sleep and a 1-min cold start would meet the secretary every morning; 730 of 750 hours fits, and $7/mo is deferred, not refused |
| 2026-09-11 | **Neon, not Supabase** | Elenem uses none of Supabase's extras; a free Supabase project pauses after 7 days idle needing a manual restore, Neon resumes in under a second |
| 2026-09-11 | **Not Railway** | Requires a card, and will not take a prepaid one |
| 2026-09-11 | **Vercel Hobby** | Free and correct for Next.js; Pro becomes a licence requirement the day DXScores charges |
| 2026-09-11 | **Renamed DXScores**, domains `dxscores.com` / `dxscores.app` | `elenem.com` unavailable; `dx` as in `d/dx` — deriving insight from scores. Code rename is a Phase 5 task, not a prerequisite |
| 2026-09-11 | **Item 17 is not blocking** | Local clubs often have no logo. A missing image renders a placeholder; launching is the requirement, images are not |

---

## 6. DNS, explained once

You will be asked to create half a dozen records across two domains, and every instruction below is
meaningless without this page. It is short.

### What a domain actually is

A domain name is a **lookup**. `dxscores.com` is not a place; it is a question — *which machine
should I talk to?* — and DNS is the phone book that answers it.

Buying a domain at Namecheap gets you the **name**. It does not decide who keeps the phone book.

### Nameservers: who keeps the phone book

**Nameservers** are the servers that hold your domain's records. Your registrar points at a set of
them, and whoever runs those nameservers is who you edit records with.

This is the single most important idea here, and it is the reason this stack uses two domains:

| Domain | Nameservers | Because |
|---|---|---|
| `dxscores.com` | **Cloudflare** | R2's public image domain only works on a Cloudflare zone |
| `dxscores.app` | **Vercel** | `*.dxscores.app` wildcards only work on Vercel's nameservers |

Changing nameservers is done **at Namecheap**, once per domain, and takes minutes to a few hours to
take effect. After that you never touch Namecheap's DNS panel again.

### The four record types you will use

| Type | Answers | Looks like | Where you'll use it |
|---|---|---|---|
| **A** | "which IP address?" | `@ → 76.76.21.21` | the apex `dxscores.com` → Vercel |
| **CNAME** | "same as this other name" | `api → elenem-api.onrender.com` | every subdomain |
| **TXT** | "here is some text" | `@ → v=spf1 include:...` | proving you own the domain; email |
| **MX** | "who receives mail here" | only if you host email | not needed unless you add mailboxes |

Two terms in the forms:

- **Name** (or *host*) is the part **before** the domain. `api` means `api.dxscores.com`. `@` means
  the domain itself with nothing in front. `*` means *anything*.
- **TTL** is how long others may cache the answer. **Leave it on Auto.** It only matters when you
  are about to change a record and want the old answer to expire quickly.

### The apex problem, in one line

A CNAME cannot legally sit on the apex (`@`). That is why the apex uses an **A** record pointing at
an IP, and every subdomain uses a **CNAME** pointing at a name.

### Cloudflare's orange cloud

Cloudflare puts a cloud icon next to each record.

- **Orange (Proxied)** — traffic goes *through* Cloudflare. Caching, DDoS protection, and
  Cloudflare's certificate.
- **Grey (DNS only)** — Cloudflare just answers the question and steps out of the way.

> **Use grey for anything pointing at Vercel or Render.** Both issue their own certificates, and
> stacking Cloudflare's proxy on top is the classic cause of redirect loops and
> `ERR_TOO_MANY_REDIRECTS` on a first launch. The one record that **must stay orange** is R2's
> media domain, and Cloudflare creates that one for you.

### How to check anything, from your own terminal

```bash
dig dxscores.com +short            # should print an IP
dig api.dxscores.com +short        # should print the Render hostname
dig NS dxscores.com +short         # which nameservers are live right now
```

`dig` never lies and is faster than refreshing a dashboard. If `dig NS` still shows Namecheap's
nameservers, nothing else you do will work yet — wait.

---

## 6b. Order of operations

Do these in order. Each step says **what you will see when it worked**, because the commonest
mistake is moving on from a step that has not finished propagating.

---

### Step 1 — Register both domains (Namecheap)

Buy `dxscores.com` and `dxscores.app`. *(Already done, pending payment.)*

- Turn **WHOIS privacy** on for both. It is free at Namecheap and keeps your home address out of a
  public database.
- Turn **auto-renew** on. A launched product whose domain lapses is a very bad afternoon.
- Ignore every upsell: no hosting, no email, no SSL. All of it is provided free by the services
  below.

**Worked when:** both domains appear under *Domain List*.

---

### Step 2 — `dxscores.com` onto Cloudflare

1. Create a free account at `dash.cloudflare.com` (sign in with GitHub, as you planned).
2. **Add a domain** → type `dxscores.com` → choose the **Free** plan.
3. Cloudflare scans for existing records and finds none. Fine — the domain is new.
4. It shows you **two nameservers**, something like:
   ```
   arya.ns.cloudflare.com
   rex.ns.cloudflare.com
   ```
5. In **Namecheap** → *Domain List* → `dxscores.com` → **Manage** → *Nameservers* → change
   **Namecheap BasicDNS** to **Custom DNS**, and paste both Cloudflare nameservers. Save.

**Worked when:** `dig NS dxscores.com +short` prints the Cloudflare names, and Cloudflare's
dashboard says **Active**. Usually minutes; allow up to a few hours. Do not start step 5 before
this.

> Leave `dxscores.app` alone for now. It goes to Vercel in step 7, not Cloudflare.

---

### Step 3 — Neon (the database)

1. `neon.tech` → sign in with GitHub → **Create project**.
2. Region: **Frankfurt** or **Paris** — closest to Kinshasa and Goma of what is offered, and the
   same choice you will make for Render so the two are not talking across an ocean.
3. Copy the **connection string**. It looks like:
   ```
   postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Locally, run the migrations against it **once**:
   ```bash
   cd elenem-backend
   DATABASE_URL="<the connection string>" npx prisma migrate deploy
   ```
   `migrate deploy`, never `db push` — the baseline rule holds in production more than anywhere.

**Worked when:** `npx prisma migrate status` against that URL reports no pending migrations.

---

### Step 4 — Render (the API)

1. `render.com` → sign in with GitHub → **New** → **Web Service** → pick the `elenem` repository.
2. Settings:
   - **Region**: Frankfurt.
   - **Build command**: `npm install && npx prisma generate && npm run build`
   - **Start command**: `npm run start:prod`
   - **Instance type**: **Free**.
3. **Environment variables** — everything the API needs:
   ```
   DATABASE_URL       = the Neon string from step 3
   JWT_SECRET         = a long random string
   JWT_REFRESH_SECRET = a different long random string
   FRONTEND_URL       = https://dxscores.com
   NODE_ENV           = production
   ```
   Generate secrets with `openssl rand -base64 48`. Never reuse your local ones.
4. Deploy. The first build takes a few minutes. You get a URL like
   `https://elenem-api.onrender.com`.
5. **Custom domain**: Render → *Settings* → *Custom Domains* → add `api.dxscores.com`. Render shows
   a CNAME target.
6. In **Cloudflare** → `dxscores.com` → **DNS** → **Add record**:

   | Field | Value |
   |---|---|
   | Type | `CNAME` |
   | Name | `api` |
   | Target | `elenem-api.onrender.com` |
   | Proxy | **Grey — DNS only** |

**Worked when:** `curl https://api.dxscores.com/health` answers. The very first call may take a
minute — that is the free tier waking up, and step 10 is what stops it happening again.

---

### Step 5 — Vercel (the frontend), on `dxscores.com`

1. `vercel.com` → sign in with GitHub → **Add New** → **Project** → `elenem-frontend`.
2. **Environment variables**:
   ```
   NEXT_PUBLIC_API_URL       = https://api.dxscores.com
   NEXT_PUBLIC_APP_DOMAIN    = dxscores.com
   NEXT_PUBLIC_TENANT_DOMAIN = dxscores.app
   ```
   (The last two are the split described in §4.1 — the code change lands before this deploy.)
3. Deploy. You get `elenem-frontend.vercel.app`.
4. **Settings → Domains** → add `dxscores.com`. Vercel offers to add `www` too — accept.
5. Vercel shows you what to create. In **Cloudflare → DNS**:

   | Type | Name | Value | Proxy |
   |---|---|---|---|
   | `A` | `@` | `76.76.21.21` | **Grey** |
   | `CNAME` | `www` | the target Vercel shows you | **Grey** |

   > Use the value **Vercel shows for your project**, not one copied from a tutorial. The CNAME
   > target is per-project.

**Worked when:** Vercel's Domains page shows **Valid Configuration** with a green tick, and
`https://dxscores.com` loads the app over HTTPS.

---

### Step 6 — Cloudflare SSL, before you go further

Cloudflare → `dxscores.com` → **SSL/TLS** → **Overview** → set encryption mode to **Full
(strict)**.

If it is left on *Flexible*, Cloudflare talks to Vercel over plain HTTP while telling the browser
the connection is secure — Vercel redirects to HTTPS, Cloudflare re-requests over HTTP, and the
browser gives up with `ERR_TOO_MANY_REDIRECTS`. It is the single most common launch-day failure and
it costs an hour to diagnose if you do not know to look.

**Worked when:** `https://dxscores.com` and `https://api.dxscores.com` both load with a valid
padlock.

---

### Step 7 — `dxscores.app` onto Vercel, with the wildcard

This is the one that makes self-serve onboarding possible.

1. In the **same Vercel project** → *Settings* → *Domains* → **Add** → type `*.dxscores.app`.
2. Vercel will tell you a wildcard **requires Vercel's nameservers** and show you two, like:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
3. In **Namecheap** → `dxscores.app` → *Nameservers* → **Custom DNS** → paste both. Save.
4. Also add the bare `dxscores.app` to the project, so the naked domain does something sensible
   rather than failing.

**Worked when:** `dig NS dxscores.app +short` prints the Vercel nameservers, Vercel shows **Valid
Configuration**, and a made-up subdomain — `https://anything.dxscores.app` — reaches your app rather
than a DNS error. It will show whatever your middleware does with an unknown tenant slug; that it
*reaches you at all* is the proof.

> `.app` is on the browsers' HSTS preload list: it is HTTPS-only, everywhere, with no http://
> fallback. Vercel issues the certificates automatically, including for the wildcard. Nothing to do
> — just do not be surprised that `http://` never works.

---

### Step 8 — Cloudflare R2 (images)

1. Cloudflare dashboard → **Storage & databases** → **R2**.
2. **Create bucket**: `dxscores-media`. Location: **Automatic** or **EU**.
3. **Public access** → *Custom domain* → add `media.dxscores.com`.
   Cloudflare creates the DNS record for you, **orange-clouded**. Leave it orange — that one is
   supposed to be proxied, and it is what gives you free caching on every image.
4. **API token for the backend**: R2 → *Manage API tokens* → **Create token** → *Object Read &
   Write*, scoped to that bucket. You get three values, shown **once**:
   ```
   Access Key ID
   Secret Access Key
   Endpoint     https://<account-id>.r2.cloudflarestorage.com
   ```
5. Add them to **Render**'s environment:
   ```
   R2_ACCOUNT_ID        = ...
   R2_ACCESS_KEY_ID     = ...
   R2_SECRET_ACCESS_KEY = ...
   R2_BUCKET            = dxscores-media
   R2_PUBLIC_URL        = https://media.dxscores.com
   ```

**Worked when:** you upload a file through the R2 dashboard and it loads at
`https://media.dxscores.com/<filename>`.

---

### Step 9 — Resend (email)

1. `resend.com` → **Domains** → **Add domain** → `dxscores.com`.
2. Resend shows three or four records — a DKIM `TXT`, an SPF `TXT`, and usually an MX for the
   return path. Add each one in **Cloudflare → DNS** exactly as shown, **grey-clouded**.

   These prove to Gmail that mail claiming to be from `dxscores.com` really is. Without them your
   verification emails land in spam, which on a self-serve product means nobody ever finishes
   signing up.
3. Create an **API key** and add it to Render:
   ```
   RESEND_API_KEY = re_...
   MAIL_FROM      = DXScores <noreply@dxscores.com>
   ```

**Worked when:** Resend's Domains page shows **Verified**, and a real sign-up delivers a
verification mail to a Gmail address **in the inbox, not spam**. Test with a real address.

---

### Step 10 — The keep-alive ping

Without this, the API sleeps after fifteen minutes and the next person waits a minute (§2).

1. `cron-job.org` → free account → **Create cronjob**.
2. URL `https://api.dxscores.com/health`, every **10 minutes**, enabled.

**Worked when:** open the app cold after an hour and the first page is fast.

> Watch **Render → Metrics → instance hours** for the first month. 24/7 is ~730 against a 750
> budget. If it creeps, that is the signal to take the $7 plan, not a crisis.

---

### Step 11 — Sentry, and CI

1. `sentry.io` → free account → two projects, Next.js and Node. Add each DSN to the matching
   environment.
2. A GitHub Action on the backend that runs `prisma migrate status` against a scratch database and
   fails if migrations do not apply cleanly from the baseline — roadmap item 21.

---

### When something does not work

| Symptom | Almost always |
|---|---|
| `ERR_TOO_MANY_REDIRECTS` | Cloudflare SSL is on *Flexible*. Set **Full (strict)** (step 6) |
| Vercel says *Invalid Configuration* | Record is orange-clouded. Set it **grey** |
| Domain does nothing at all | Nameservers have not propagated. `dig NS dxscores.com +short` |
| Verification mail in spam | A Resend DNS record is missing or mistyped |
| API takes a minute, always | The cron ping is not running (step 10) |
| `.app` refuses http:// | Correct and unavoidable. `.app` is HSTS-preloaded — use https:// |
| Wildcard will not verify | `dxscores.app` must be on **Vercel** nameservers, not Cloudflare |

---

## 7. Open

- **The names are settled.** `dxscores.com` and `dxscores.app` are registered at Namecheap, pending
  payment confirmation (2026-09-11).
- **The code still says `elenem`** — repository names, `NEXT_PUBLIC_ROOT_DOMAIN`, the brand mark,
  every document. The rename is Phase 5 work and is deliberately *not* a blocker for any step above:
  DNS does not care what the repository is called.
- **Bring-your-own-domain tenants** (`libago.cd`) is a real Phase 5+ ask and is not designed yet.
  On Vercel it means adding each as a project domain — inside the 50-domain Hobby ceiling for a
  while, and eventually the Domains API on a paid plan.
- **Cloudflare's agent plugin** (`claude plugin marketplace add cloudflare/skills`) would let this
  session drive R2 directly. It changes the owner's local Claude Code setup, so it is theirs to run,
  and nothing here needs it — the dashboard is a five-minute job.
