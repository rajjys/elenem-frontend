

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
---

## 📖 Usage

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
![Registration Screenshot](/public/stock/auth.jpg)
### Register
![Registration Screenshot](/public/stock/register.jpg)  
### Login
![Login Screenshot](/public/stock/login.jpg)  

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
![Create Tenant Screenshot](/public/stock/create-tenant.jpg)  

📸 *Create Tenant Preview:*  
![Create Tenant Screenshot](/public/stock/create-tenant-preview.jpg)  

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
![Create League Screenshot](/public/stock/create-league.jpg)  

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
![Create Season Screenshot](/public/stock/create-season.jpg)  

---

### 5. Create Teams

Teams can be created before or after creating a season.  
- **Multistep form** with mandatory fields:  
  - `name`  
  - `shortCode`  

#
📸 *Team Creation:*  
![Create Team Screenshot](/public/stock/create-team.jpg)  

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
![Manage Game Screenshot](/public/stock/manage-game.jpg)  

📸 *Manage a game real-time:*  
![Manage Game Screenshot](/public/stock/manage-game-live.jpg)  

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



