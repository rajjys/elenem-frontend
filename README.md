

# Elenem Frontend
![Elenem On Mobile](/public/stock/elenem-mobile.JPG)

**Elenem** is a modern web platform designed to help sports leagues manage their digital presence professionally.  
Built with [Next.js](https://nextjs.org/) and powered by role-based access, Elenem offers scalable tools for league visibility, fan engagement, and operational growth.

> _“Elenem is more than a tool. It’s a lever to transform sport.”_

📍 Initially launched with the Cerclesport pilot, Elenem now enters a new phase: more robust, more ambitious, and ready for real-world impact.  
Leagues can test it for free at [elenem.site](https://elenem.site/).

This project is built with **Next.js**, uses **npm**, and follows a **role-based access system** for leagues, teams, admins, and fans.  

---

# 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/rajjys/elenem-frontend.git
cd elenem-frontend
````

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file at the root of the project and provide the following values:

```bash
# The production API URL (example: backend.up.railway.app)
NEXT_PUBLIC_API_URL=

# Secret key received from backend
JWT_SECRET=

# Inferred automatically (use "development" for dev and "production" for prod)
NODE_ENV=development

# Soon to be deprecated in favor of NEXT_PUBLIC_ROOT_DOMAIN
NEXT_PUBLIC_HOME_URL=

# Local dev entrypoint (use lvh.me for subdomain testing)
NEXT_PUBLIC_HOME_URL_LOCAL=http://lvh.me:3000

# The main root domain of the website
NEXT_PUBLIC_ROOT_DOMAIN=https://mywebsite.com
```

⚠️ **Important:**
We use `lvh.me:3000` instead of `localhost:3000`.
This allows automatic subdomain handling, e.g., `ligue2.lvh.me:3000`, without additional configuration.

### 4. Run the development server

```bash
npm run dev
```

Then navigate to:

👉 [http://lvh.me:3000](http://lvh.me:3000)

At this stage, you will access the **main page**.
In the next step (Usage), we’ll explain how to create resources such as leagues and tenants.

---

## 📂 Project Structure

The main folders are organized as follows:

```
/app
  /admin                → System admin pages (system-wide operations)
  /(auth)               → Authentication (clean URLs: /login, /register, etc.)
  /(app)                → Authenticated app paths
    /tenant             → Accessible to tenant admins and above
    /league             → Accessible to league admins, tenant admins, system admins
    /team               → Requires context (ctxTeamId for higher roles)
    /game, /season, ... → Protected by <AccessGate allowedRoles=[] />
  /(public)             → Public-facing pages (landing, tenants, games, etc.)
  /public/public_tenant/[tenantSlug] → Tenant sub-sites (resolved by middleware)

/components             → UI, layouts, and forms
/hooks                  → Custom React hooks
/schemas                → Zod validation schemas
/services               → API calls and services
/store                  → Zustand stores
/utils                  → Utility functions
/public                 → Static assets (images, etc.)
```

---

## 🔑 Role-based Access

The system defines multiple roles with different levels of permissions:

* **SYSTEM_ADMIN** → full system control
* **TENANT_ADMIN** → manages tenants and their leagues
* **LEAGUE_ADMIN** → manages leagues and teams inside a tenant
* **TEAM_ADMIN** → manages a specific team
* **GENERAL_USERS** → regular users (fans, visitors)

### Context handling

For certain pages (`/league/dashboard`, `/team/...`), additional context must be provided:

* If the user is a **LEAGUE_ADMIN**, `user.managingLeagueId` is used automatically.
* If the user is a **SYSTEM_ADMIN** or **TENANT_ADMIN**, they must pass a query param like:

  ```
  /league/dashboard?ctxLeagueId=league123456
  ```

  where `league123456` is the ID to fetch data with.

The same logic applies to teams (`ctxTeamId`).

---

## ✅ Next Steps

The next section will cover **Usage**:

* Creating tenants, leagues, and teams
* Navigating between subdomains (`ligue2.lvh.me:3000`)
* Role-based resource management

### Stay tuned.


