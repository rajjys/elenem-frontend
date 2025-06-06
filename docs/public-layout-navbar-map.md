# Public User & Features Manifest

This manifest outlines the key pages, features, and user journeys for the public-facing areas of your platform.

---

## I. Core SAAS Marketing Pages

These pages are designed to attract and convert new League Admins.

### A. Homepage (`/`)
- **Purpose:** The main landing page. Its goal is to capture interest immediately.
- **Content:**  
  - A compelling hero section with a clear value proposition ("The All-In-One Platform for Managing Your Sports League").
  - Key feature highlights.
  - Testimonials from existing League Admins.
  - Trust signals (logos of leagues using the platform).
  - A clear call-to-action (CTA) to "Get Started" or "See a Demo".
  - Links to pricing and feature pages.

### B. Features (`/features`)
- **Purpose:** To provide a detailed breakdown of the platform's capabilities.
- **Content:**  
  - A comprehensive overview of features tailored for different roles (League Admins, Team Admins, Players, Fans).
  - Visuals, screenshots, and short videos to demonstrate functionality like schedule generation, live scoring, team management, and financial tracking.

### C. Pricing (`/pricing`)
- **Purpose:** To present clear, transparent pricing for the SAAS subscription plans.
- **Content:**  
  - A pricing table comparing different tiers (e.g., Basic, Pro, Enterprise).
  - Each tier should clearly list its included features, limits (if any), and price.
  - An FAQ section can address common questions about billing and plans.

### D. Contact (`/contact`)
- **Purpose:** To provide a way for potential customers and public users to get in touch.
- **Content:**  
  - A contact form for sales inquiries and general questions.
  - An email address.
  - Potentially a phone number or link to book a demo.

---

## II. Public Content & Community Portal

This section is the entry point for fans and users looking for specific leagues or teams.

### A. Explore Leagues (`/explore`)
- **Purpose:** A directory for discovering all public leagues hosted on the platform.
- **Content:**  
  - A searchable, filterable grid or list of leagues.
  - Users can search by league name, sport, or location.
  - Each entry should display the league's logo, name, sport, and a brief description, linking to the league's homepage.

### B. League Microsite (`/leagues/[leagueId]`)
- **Purpose:** The public homepage for a specific league. Its look and feel might be customized by the League Admin.
- **Content:**  
  - This page should have its own sub-navigation:
    - **Home:** League overview, latest news, upcoming games.
    - **Schedule/Results:** Full game schedule and past results.
    - **Standings:** Official league tables.
    - **Teams:** A directory of all teams in the league.
    - **News:** League-specific news and announcements.
    - **Media:** Photo and video galleries for the league.

### C. Team Microsite (`/teams/[teamId]`)
- **Purpose:** The public profile page for a specific team.
- **Content:**  
  - Team logo, name, roster.
  - News feed (from Team Admin posts).
  - Team-specific schedule.
  - Stats and media galleries.

### D. Player Profile (`/players/[playerId]`)
- **Purpose:** A public profile for an individual player.
- **Content:**  
  - Player's photo, bio, current team.
  - Detailed statistics for the current and past seasons.

---

## III. User Authentication

### A. Login (`/login`)
- **Purpose:** The entry point for all existing registered users (Admins, Players, etc.).
- **Content:**  
  - A clean login form.
  - Given the multi-tenant nature, it should prominently feature a field for `leagueCode` or a searchable dropdown to help users find their league easily before entering their credentials.

### B. Register (`/register`)
- **Purpose:** The sign-up page, primarily for new League Admins wanting to create a new league on the platform.
- **Content:**  
  - A sign-up form that captures user details and the desired information to create their new league.
  - Leads the user into the payment/subscription flow.

---

## IV. Standard Informational Pages (Footer)

### A. About Us (`/about`)
- **Purpose:** Company story and mission.

### B. Blog (`/blog`)
- **Purpose:** Content marketing, platform updates, sports management tips.

### C. Legal (`/terms`, `/privacy`)
- **Purpose:** Terms of Service and Privacy Policy.

### D. Help Center (`/help`)
- **Purpose:** Public-facing help articles.

---

_This manifest provides a comprehensive structure for the public-facing and marketing areas of the platform._