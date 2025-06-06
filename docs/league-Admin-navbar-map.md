# League Administrator Feature Manifest

This manifest details the navigation structure specifically for League Administrators.

---

## I. League Dashboard

### A. Overview
- **Route:** `/league/dashboard`
- **Description:** Main landing page for the League Admin. Shows key statistics for their league (active teams, player count, upcoming games, recent results), pending tasks (e.g., game scores to confirm, registrations to approve), league announcements, and a snapshot of league finances.

### B. League Analytics
- **Route:** `/league/analytics`
- **Description:** In-depth analytics for the league, including team performance trends, player statistics leaderboards, game attendance (if tracked), member engagement, and financial reporting specific to the league.

---

## II. League Setup & Configuration

### A. General Settings
- **Route:** `/league/settings/general`
- **Description:** Manage core league information: league name, description, logo/banner, sport type, contact details, and public visibility settings.

### B. Competition Rules
- **Route:** `/league/settings/rules`
- **Description:** Configure points systems, tiebreaker rules, season structures, game parameters (duration, periods), substitution rules, and other sport-specific regulations for the league.

### C. Branding & Public Page
- **Route:** `/league/settings/branding`
- **Description:** Customize the league's public-facing page appearance, including colors, banners, welcome messages, and social media links. (Corresponds to LeaguesModule's branding capabilities).

### D. Registration Management
- **Route:** `/league/settings/registration`
- **Description:** Set up and manage registration periods for teams and players. Configure registration forms with custom fields, set fees, payment options, and approval workflows.

### E. Payment Configuration
- **Route:** `/league/settings/payments`
- **Description:** Configure payment collection methods for league fees (e.g., connect their own Stripe/PayPal if allowed by the platform, or manage settings for payments processed via the platform's PaymentsModule).

### F. League Staff & Permissions
- **Manage Staff**
  - **Route:** `/league/staff/manage`
  - **Description:** Invite, assign roles, and manage other administrators or volunteers for this league, e.g., scorers, treasurers.
- **Staff Roles**
  - **Route:** `/league/staff/roles`
  - **Description:** Define custom roles and their specific permissions within the league, e.g., "Fixture Secretary" can only manage games.

---

## III. People & Teams

### A. Teams
- **Manage Teams**
  - **Route:** `/league/teams/`
  - **Description:** View list of all teams, create new teams, edit team profiles, approve pending team registrations, manage team status.

### B. Players and Coaches
- **Manage Players**
  - **Route:** `/league/players/`
  - **Description:** View all registered players in the league, edit player details, assign players to teams, manage player status, view statistics, Oversee player registration, approve pending player sign-ups, manage custom registration fields.
- **Player Registration Forms**
  - **Route:** `/league/Coaches`
  - **Description:** 

### C. Officials & Referees
- **Manage Officials**
  - **Route:** `/league/officials/`
  - **Description:** Maintain a database of referees and other officials for the league, track availability, qualifications, and assign to games.
- **Official Assignments**
  - **Route:** `/league/officials/assignments`
  - **Description:** View and manage game assignments for officials.

- **Team Invitations**
  - **Route:** `/league/teams/invitations`
  - **Description:** Send and track invitations for new or existing teams to join the league.
### D. Home Venues
- **Stadiums**
- **Route:** `/league/stadiums`
  - **Description:** View and manage Stadiums and home venues.
### E. Users
- **Users**
- **Route:** `/league/users`
  - **Description:** View and manage different types of users in the league. League Users, Team managers and general users
---

## IV. Competition Management

### A. Seasons
- **Manage Seasons**
  - **Route:** `/league/seasons`
  - **Description:** Create new seasons, edit existing season details like dates and names, activate/deactivate seasons for the league.

### B. Games & Fixtures
- **Schedule Games**
  - **Route:** `/league/games/schedule`
  - **Description:** Create individual games or generate full season fixtures, assign dates, times, venues, and officials.
- **Game Results & Scores**
  - **Route:** `/league/games/results`
  - **Description:** Enter, confirm, and edit game scores and key match events.
- **Live Game Center**
  - **Route:** `/league/games/live-management`
  - **Description:** Interface for League Admins or designated scorers to log live game events like goals, cards, substitutions for ongoing matches.

### C. Standings
- **League Standings**
  - **Route:** `/league/standings`
  - **Description:** View automatically updated league tables/standings. May include options for manual adjustments if rules require.

### D. Lineups
- **View Submitted Lineups**
  - **Route:** `/league/lineups/view`
  - **Description:** Review team lineups submitted for games, potentially lock lineups before match start.

### E. Disciplinary Actions
- **Manage Discipline**
  - **Route:** `/league/discipline`
  - **Description:** Record and track disciplinary actions such as suspensions, fines, or warnings for players and teams.

---

## V. League Finances

### A. Financial Overview
- **Route:** `/league/finances/dashboard`
- **Description:** Dashboard summarizing the league's financial health: total income, expenses, outstanding payments, and key financial metrics.

### B. Income & Revenue Sources
- **Registration Fees**
  - **Route:** `/league/finances/registration-fees`
  - **Description:** Track payments received from team and player registrations.
- **Sponsorship Income**
  - **Route:** `/league/finances/sponsorships`
  - **Description:** Log income from league sponsors.
- **Other Revenue**
  - **Route:** `/league/finances/other-revenue`
  - **Description:** Track income from other sources like donations, grants, or league-run events.

### C. Expense Tracking
- **Manage Expenses**
  - **Route:** `/league/finances/expenses`
  - **Description:** Record and categorize league operational expenses, e.g., venue rentals, official payments, equipment.

### D. Invoicing & Payments
- **Team Invoices**
  - **Route:** `/league/finances/invoices`
  - **Description:** Create, send, and track invoices to teams for league fees or other charges.
- **Payment Tracking**
  - **Route:** `/league/finances/payments-log`
  - **Description:** View a log of all payments made and received by the league.

### E. Financial Reporting
- **Generate Reports**
  - **Route:** `/league/finances/reports`
  - **Description:** Create detailed financial reports, profit & loss statements, and budget summaries for the league.

---

## VI. Communication & Marketing

### A. League Announcements
- **Route:** `/league/communication/announcements`
- **Description:** Create, schedule, and send announcements to all league members or specific groups (teams, players, staff) via in-app notifications and email.

### B. Direct Messaging & Email
- **Compose & Send**
  - **Route:** `/league/communication/composer`
  - **Description:** Tools to send targeted emails or internal platform messages to individuals or groups within the league.
- **Contact Lists & Groups**
  - **Route:** `/league/communication/groups`
  - **Description:** Manage mailing lists and communication groups for efficient messaging.

### C. Marketing & Promotion (Basic tools)
- **League Newsletter**
  - **Route:** `/league/communication/newsletter`
  - **Description:** Simple tools to create and distribute a league newsletter.
- **Promotional Codes**
  - **Route:** `/league/communication/promos`
  - **Description:** Create discount codes for registrations or league events, if applicable.

---

## VII. Content & Media

### A. League News & Articles
- **Route:** `/league/content/news`
- **Description:** Publish news articles, match reports, and other textual content on the league's public page or internal member portal.

### B. Media Galleries
- **Route:** `/league/content/media`
- **Description:** Upload, organize, and display photo albums and video content related to league games, events, and teams.

### C. Document Center
- **Route:** `/league/content/documents`
- **Description:** A repository for sharing important documents with league members, such as rulebooks, policy documents, meeting minutes, and forms.

---

## VIII. Sponsorship Management

### A. Manage League Sponsors
- **Route:** `/league/sponsors`
- **Description:** Add and manage information for league sponsors, including logos, contact details, sponsorship levels, and display settings on the league's public page.

---

## IX. League Events & Ticketing (If enabled by the platform)

### A. Manage Events
- **Route:** `/league/events/manage`
- **Description:** Create and manage special league events such as tournaments, finals, award ceremonies, or social gatherings.

### B. Ticket Sales & Management
- **Route:** `/league/events/ticketing`
- **Description:** For league-run events, manage ticket inventory, set pricing, monitor sales, and handle attendee check-in.

---

## X. Merchandise Store (If enabled by the platform)

### A. Store Configuration
- **Route:** `/league/merchandise/settings`
- **Description:** Set up and customize the league's online merchandise store (if offered as a feature by the platform).

### B. Manage Products
- **Route:** `/league/merchandise/products`
- **Description:** Add, edit, and manage merchandise items, including descriptions, images, pricing, and inventory.

### C. View Orders
- **Route:** `/league/merchandise/orders`
- **Description:** Track and manage orders placed through the league's merchandise store.

---

## XI. Platform Support

### A. Help Center & FAQs
- **Route:** `/league/support/help`
- **Description:** Access the platform's knowledge base, tutorials, and frequently asked questions.

### B. Submit Support Ticket
- **Route:** `/league/support/faq`
- **Description:** FAQ

### C. Help Center & FAQs
- **Route:** `/league/support/feedback`
- **Description:** Feedback from users

### D. Submit Support Ticket
- **Route:** `/league/support/contact`
- **Description:** A system for League Admins to submit support requests or report issues to the platform's administrators (SYSTEM_ADMIN or support team).
---

_This manifest provides a comprehensive structure for the League Admin's capabilities._