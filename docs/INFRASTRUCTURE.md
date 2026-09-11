# Infrastructure — decisions, and why

> Written 2026-09-11, before Phase 5. Every claim about a provider's limits here was **checked
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
> Elenem charges anybody, Vercel Pro ($20/mo) stops being optional. That is a licence term, not a
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

**Decided, and it is the clearest decision in this document.**

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
2. **Vercel Pro, $20/mo** — the moment Elenem charges anybody, on licence grounds.
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
| 2026-09-11 | **Vercel Hobby** | Free and correct for Next.js; Pro becomes a licence requirement the day Elenem charges |

---

## 6. Order of operations

Nothing here is hard; the order is what saves the afternoon. Each step is expanded when we reach it.

1. **Register both domains** at Namecheap.
2. **`.com` → Cloudflare**: add the site, copy the nameservers to Namecheap, wait for propagation.
3. **Neon**: create the project, take the connection string, `prisma migrate deploy` against it.
4. **Render**: deploy the API from GitHub, set the environment, point `api.<name>.com` at it.
5. **Vercel**: deploy the frontend, attach `<name>.com` and `www` (Cloudflare CNAMEs).
6. **`.app` → Vercel nameservers**, add `*.<name>.app` to the same project.
7. **R2**: create the bucket, an S3-compatible API token, and `media.<name>.com` as its custom
   domain.
8. **Resend**: verify the sending domain with DKIM/SPF on the `.com`.
9. **Sentry**, then the **cron ping** on `/health`.
10. **Migration-baseline check in CI**, per the roadmap's item 21.

---

## 7. Open

- **The names.** `dxscores.com` / `dxscores.app` is the current candidate; availability has not been
  checked and is the owner's to choose. Nothing above depends on the word, only on the split.
- **Bring-your-own-domain tenants** (`libago.cd`) is a real Phase 5+ ask and is not designed yet.
  On Vercel it means adding each as a project domain — inside the 50-domain Hobby ceiling for a
  while, and eventually the Domains API on a paid plan.
- **Cloudflare's agent plugin** (`claude plugin marketplace add cloudflare/skills`) would let this
  session drive R2 directly. It changes the owner's local Claude Code setup, so it is theirs to run,
  and nothing here needs it — the dashboard is a five-minute job.
