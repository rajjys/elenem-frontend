Administrator Feature Manifests
This document outlines the navigation structure and key features for each administrative role in the platform, updated to reflect the hierarchical TENANT_ADMIN architecture.

1. SYSTEM_ADMIN Manifest
Scope: Platform-wide oversight. Not scoped to any tenant unless explicitly choosing a context.
Primary Route: /admin

I. Dashboard
Overview (/admin/dashboard): Global platform metrics, system health, revenue, new tenant sign-ups.

Platform Analytics (/admin/analytics): Deep dive into platform growth, user trends, and feature adoption.

II. Platform Management
Tenants (/admin/tenants): View, create, edit, and manage all tenant organizations.

Users (/admin/users): Manage all users across all tenants. Assign SYSTEM_ADMIN roles.

Global Settings (/admin/settings): Manage platform-wide configurations, default feature sets, and global policies.

III. Financials & Billing
Subscription Plans (/admin/financials/plans): Manage the SAAS subscription tiers offered to tenants.

All Subscriptions (/admin/financials/subscriptions): View and manage the subscription status of all tenants.

Payment Gateways (/admin/financials/gateways): Configure platform-level payment processors (e.g., Stripe, PayPal).

IV. System & Infrastructure
System Health (/admin/system/health): Real-time monitoring of servers, databases, and services.

API & Integrations (/admin/system/api): Manage public API settings, webhooks, and third-party integrations.

Audit Logs (/admin/system/audit): View a log of all critical actions performed by System Admins.

2. TENANT_ADMIN Manifest
Scope: Manages a single tenant (organization) and all leagues/resources within it.
Primary Route: /tenant

I. Tenant Dashboard
Overview (/tenant/dashboard): Aggregated view of all leagues within the tenant (total players, teams, revenue).

II. Organization Management
Leagues (/tenant/organization/leagues): Create, edit, and manage all leagues within the tenant.

Users & Staff (/tenant/organization/users): Manage users (LEAGUE_ADMIN, TEAM_ADMIN, etc.) and their roles within the tenant.

Tenant Settings (/tenant/organization/settings): Manage organization branding and global settings for their leagues.

Billing (/tenant/organization/billing): Manage the tenant's subscription plan and view payment history.

III. Shared Resources
Venues (/tenant/resources/venues): Manage a central pool of venues for all leagues.

Player Database (/tenant/resources/players): Manage a central database of all players in the organization.

Officials Pool (/tenant/resources/officials): Manage a central list of referees.

Sponsors (/tenant/resources/sponsors): Manage organization-wide sponsors.

IV. Tenant-Wide Operations
Player Transfers (/tenant/operations/transfers): Manage player movements between leagues within the tenant.

Announcements (/tenant/operations/announcements): Send announcements to all members of the tenant.

Reports (/tenant/operations/reports): Generate consolidated reports across all leagues.

3. LEAGUE_ADMIN Manifest
Scope: Manages a single league.
Primary Route: /league

I. League Dashboard
Overview (/league/dashboard): Key stats and upcoming tasks for the specific league.

II. Competition Management
Seasons (/league/seasons): Manage seasons for this league.

Teams (/league/teams): Manage team registrations and profiles for this league.

Games & Fixtures (/league/games): Manage the schedule and results for this league.

Standings (/league/standings): View the official league table.

III. People Management
Players (/league/players): Manage player registrations and assignments for this league.

Officials (/league/officials): Assign officials (from the tenant's pool) to games.

IV. League Finances
Financial Overview (/league/finances/dashboard): Dashboard for league-specific finances (e.g., team fees).

Invoices & Payments (/league/finances/invoices): Manage invoices for teams in this league.

V. Communication & Content
Announcements (/league/communication/announcements): Send news and updates to members of this league.

Media Galleries (/league/content/media): Manage photos and videos for this league.

4. TEAM_ADMIN Manifest
Scope: Manages a single team.
Primary Route: /team

I. Team Dashboard
Overview (/team/dashboard): At-a-glance view of the team's next game, recent results, and messages.

II. Team Management
Edit Profile & Media (/team/profile/edit): Update the team's public profile, logo, and photo galleries.

Team Posts (/team/profile/posts): Create social-style updates for the team's page.

III. Roster & Competition
View Roster (/team/roster): View the list of players on the team.

Manage Lineups (/team/competition/lineups): Submit and update lineups for upcoming games.

Schedule & Stats (/team/competition/schedule): View the team's schedule, results, and stats.

IV. Communication
Team Messaging (/team/communication/messages): Internal chat with team players and staff.

Fan Engagement (/team/communication/fans): View fans and their interactions.

V. Commerce
Merchandise (/team/merchandise/products): Manage team-specific merchandise for sale.

Transactions (/team/merchandise/transactions): View sales transactions for the team's merch.