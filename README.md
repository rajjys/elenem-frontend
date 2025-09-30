

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

#

# 📖 Usage

The following steps describe how to use **Elenem** after installation.  
Each step includes the main action, the required fields, and where to find the functionality.

---

### 1. Authentication

- Go to `/login` or `/register`.  
- **Registration mandatory fields:**  
  - `username`  
  - `email`  
  - `password`  
  - `firstName`  
  - `lastName`  
- Optional fields are available during registration.  
- After registration, you are redirected to the `/welcome` page.  
  - From here, you can either keep browsing or go directly to the **Tenant creation form**.  

📸  
![Registration Screenshot](/public/stock/auth.JPG)
### Register
![Registration Screenshot](/public/stock/register.JPG)  
### Login
![Login Screenshot](/public/stock/login.JPG)  

---

### 2. Create a Tenant

If the user is not already affiliated with a tenant, they may create one.  
A **Tenant** represents the organization the user wants to manage.  

- **Multistep form** with mandatory fields:  
  - `tenantName`  
  - `tenantCode`  
  - `sportType`  
  - `country`  
- After creation, the user is assigned the role of **TENANT_ADMIN** by the backend.  
- Redirected to: `/dashboard` for the newly created organization.  

📸 *Create Tenant Form:*  
![Create Tenant Screenshot](/public/stock/create-tenant.JPG)  

📸 *Create Tenant Preview:*  
![Create Tenant Screenshot](/public/stock/create-tenant-preview.JPG)  

---

### 3. Create a League

From the */dashboard* or */leagues* page, click **"Create League"**.  
This opens a **multistep form**:  

1. Step 1 → Mandatory fields: `name`, `division`, `gender`  
2. Step 2 → Optional fields  
3. Step 3 → Point system and rules  
4. Step 4 → Review & submit  

#
📸 *Create a League - Points System config:*  
![Create League Screenshot](/public/stock/create-league.JPG)  

---

### 4. Create a Season

A **Season** can be created:  
- From the **/dashboard**, or  
- From `/seasons`  page 

Mandatory fields:  
- `name`  
- `startDate`  
- `endDate`  

Optional fields are available as well.  

#
📸 *Create a season:*  
![Create Season Screenshot](/public/stock/create-season.JPG)  

---

### 5. Create Teams

Teams can be created before or after creating a season.  
- **Multistep form** with mandatory fields:  
  - `name`  
  - `shortCode`  

#
📸 *Team Creation:*  
![Create Team Screenshot](/public/stock/create-team.JPG)  

---

### 6. Create Games

Games can be created:  
- From the **dashboard**, or  
- From `/games` page (via the **"Create Game"** button)  

This redirects to `/game/create`.  

📸 *Create a game:*  
![Create Game Screenshot](/public/stock/create-game.JPG)  

---

### 7. Manage Games

To manage an existing game:  
- Go to the dashboard or `/games` page  
- Select the desired game → redirects to the **Game Dashboard**  
- From here, you can update:  
  - Game status  
  - Score  
  - Time  

All updates automatically reflect on the **public site**:  
- `https://mainsite.com`  
- `https://tenant.mainsite.com`  

📸 *Manage a game:*  
![Manage Game Screenshot](/public/stock/manage-game.JPG)  

📸 *Manage a game real-time:*  
![Manage Game Screenshot](/public/stock/manage-game-live.JPG)  

---

### 8. Blogposts

From `/posts` page, tenant admins can manage blogposts for their tenant’s website.  

📸 *Screenshot placeholder:*  
![Posts Management Screenshot](/public/docs/usage/posts.png)  

---

### 9. Settings

From `/tenant/settings`, you can update:  
- Tenant information  
- Configurations  

📸 *Screenshot placeholder:*  
![Tenant Settings Screenshot](/public/docs/usage/settings.png)  

---

### 10. Tenant Users

From `/tenant/users`, tenant admins can manage the users of their organization.  

📸 *Screenshot placeholder:*  
![Users Management Screenshot](/public/docs/usage/users.png)  

---

## 🌍 Public Visibility

All created data (leagues, teams, games, standings, posts, etc.) is visible on:  
- The **main site:** `https://mainsite.com`  
- The **tenant subdomain:** `https://tenant.mainsite.com`  

This ensures that fans and visitors always see up-to-date information.  

---

#
# 🤝 Contributing

We welcome contributions to **Elenem**!  
Whether you are fixing a bug, improving documentation, or adding a new feature, please follow these guidelines to keep the codebase clean, secure, and maintainable.

---

### 1. Fork and Clone

- Fork the repository on GitHub.  
- Clone your fork locally:

```bash
git clone https://github.com/<your-username>/elenem-frontend.git
cd elenem-frontend
````

* Add the upstream remote (to sync with main repo later):

```bash
git remote add upstream https://github.com/rajjys/elenem-frontend.git
```

---

### 2. Branching Strategy

* Always create a new branch from `main` for your work:

```bash
git checkout main
git pull upstream main
git checkout -b feature/my-new-feature
```

* Use clear branch names:

  * `feature/...` → for new features
  * `fix/...` → for bug fixes
  * `chore/...` → for config, tooling, cleanup
  * `docs/...` → for documentation changes

---

### 3. Coding Standards

* Follow **TypeScript + Next.js** conventions.
* Use **Zod** for validation and **Zustand** for state management (do not reinvent the wheel).
* Reuse **UI components** from `/components/ui` instead of creating duplicates.
* Use **hooks** from `/hooks` when possible; create new ones if logic repeats.
* Ensure **forms use react-hook-form with zodResolver**.
* Respect **role-based access** with `<AccessGate />`. Never bypass it.

---

### 4. Environment & Configuration

* Never hardcode environment variables.
* Always use values from `.env` (e.g., `NEXT_PUBLIC_API_URL`).
* For local dev, test against `lvh.me:3000` to ensure subdomains work.

---

### 5. Testing Your Changes

Before committing:

* Run the dev server:

  ```bash
  npm run dev
  ```
* Ensure **pages render without errors**.
* Check **role-based flows** (login as different roles if possible).
* Run **linting**:

  ```bash
  npm run lint
  ```
* Run **type-checking**:

  ```bash
  npm run build
  ```

---

### 6. Commit Messages

* Use clear, conventional commit messages:

  * `feat: add league creation step`
  * `fix: correct tenant redirect after registration`
  * `docs: update README usage section`
  * `chore: update dependencies`

---

### 7. Pull Requests

* Push your branch to your fork.
* Open a Pull Request (PR) to `main` in the upstream repo.
* A PR must:

  * Describe **what** you changed.
  * Explain **why** the change is needed.
  * Include screenshots (for UI changes).
  * Pass **code review** before merging.

---

### 🚫 NO-NOs in Production Code

To keep Elenem stable and professional, **never do the following**:

* ❌ Hardcode API URLs, secrets, or tokens.
* ❌ Push `.env` files or credentials.
* ❌ Use `any` or ignore TypeScript errors (`// @ts-ignore`) without strong justification.
* ❌ Leave `console.log`, `debugger`, or commented-out code.
* ❌ Commit without lint/type checks passing.
* ❌ Mix French and English in code; code stays **English-only**.
* ❌ Duplicate logic already implemented in `/hooks`, `/schemas`, `/services`, etc.
* ❌ Skip role-based access checks.
* ❌ Merge directly into `main` without a PR and review.

---

### 8. Syncing Your Fork

To update your branch with the latest changes from upstream:

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

Then rebase your feature branch:

```bash
git checkout feature/my-branch
git rebase main
```

---

### 9. Asking for Help

If you get stuck:

* Open a **draft PR** early and ask for feedback.
* Comment in the code where you’re unsure.
* Communicate clearly in the PR description.

---

### ✅ Summary for Juniors

* Always work in a branch.
* Always run lint + type-check before committing.
* Always open a PR → no direct merges.
* Always remove debug code.
* Always think about roles and contexts when building features.
* Ask questions when in doubt.
* The team needs you.

By following these practices, you’ll quickly become a valuable contributor while keeping Elenem safe, clean, and production-ready 🚀

