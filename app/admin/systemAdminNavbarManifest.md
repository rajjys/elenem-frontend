I. Dashboard
A. Overview
Route: /admin/dashboard
Description: The main landing page for System Admins. Displays key platform metrics, system health overview, recent activities, active leagues, user registrations, platform revenue snapshots, and quick access to critical functions.
B. Platform Analytics
Route: /admin/analytics
Description: In-depth analytics and reporting on platform usage. Includes user engagement metrics, league growth trends, feature adoption rates, traffic sources, and customizable reports for strategic decision-making.
II. Platform Core Management
A. Leagues (Tenants)
Manage Leagues:
Route: /admin/leagues
Description: View, search, filter, and manage all leagues on the platform. Actions include viewing league details, editing configurations, activating/deactivating leagues, and accessing league-specific settings.
Create League:
Route: /admin/leagues/create
Description: Form to create a new league (tenant), assign an owner, and set initial configurations.
League Configuration Defaults:
Route: /admin/leagues/defaults
Description: Set and manage default configurations for new leagues (e.g., default sport types, points systems, tiebreaker rules, feature sets, privacy settings).
B. User Management
Manage All Users:
Route: /admin/users
Description: Comprehensive list of all users across all leagues. Allows System Admins to search, filter, view profiles, edit user details, manage account status (activate/deactivate/ban), and assign/change roles.
Create User:
Route: /admin/users/create
Description: Create a new user account in any league with a specified role.
System Administrators:
Route: /admin/users/system-admins
Description: Manage accounts of other System Administrators. Add new admins, edit permissions (if granular roles exist), and manage their status.
Role & Permission Management:
Route: /admin/users/permissions
Description: Define and manage roles and their associated permissions across the platform (e.g., what a LEAGUE_ADMIN can do). View access control lists.
C. Content & Data
Global Announcements:
Route: /admin/content/announcements
Description: Create, manage, and publish platform-wide announcements visible to all users or specific roles/leagues.
Data Management & Integrity:
Route: /admin/content/data-tools
Description: Tools for data management, such as bulk import/export capabilities (e.g., users, league data), data validation checks, and data cleanup utilities.
Static Content Pages:
Route: /admin/content/pages
Description: Manage content for static pages like 'About Us', 'Platform Features', etc.
III. Financials & Billing
A. Platform Subscriptions (SAAS Billing)
Subscription Plans:
Route: /admin/financials/plans
Description: Create and manage SAAS subscription plans for leagues (e.g., Basic, Premium, Pro tiers) detailing features, pricing, and billing cycles.
League Subscriptions Management:
Route: /admin/financials/league-subscriptions
Description: View and manage subscriptions of all leagues. Track status, upgrade/downgrade plans, handle trial periods, and manage billing issues.
Platform Revenue & Invoicing:
Route: /admin/financials/revenue
Description: Overview of platform revenue from league subscriptions. Access financial reports, view generated invoices for leagues, and track payment statuses.
B. Payment Gateway Configuration
Gateway Settings:
Route: /admin/financials/payment-gateways
Description: Configure and manage payment gateway integrations (e.g., Stripe, PayPal, Mobile Money) for platform subscription billing and potentially for league-level transactions if centralized.
Global Transaction Log:
Route: /admin/financials/transactions
Description: View a log of all financial transactions processed by the platform (subscription payments, fees, etc.). Filterable and exportable.
C. Payout Management (If Applicable)
Payout Settings & Requests:
Route: /admin/financials/payouts
Description: Manage settings and process payouts if the platform handles revenue sharing or disburses funds to leagues/organizations.
IV. Modules & Features Configuration
A. Core Sports Logic Defaults
Game & Season Defaults:
Route: /admin/features/sports-core/settings
Description: Define platform-wide default settings for sports logic, such as common game rules, season structures, player registration fields, and statistic types that leagues can then customize.
B. Notifications System
Notification Templates:
Route: /admin/features/notifications/templates
Description: Create and manage global email and in-app notification templates used for system events (e.g., welcome emails, password resets, payment confirmations).
Delivery Configuration:
Route: /admin/features/notifications/delivery-settings
Description: Configure notification delivery services (e.g., SMTP server settings for email, push notification service credentials like FCM/APNS).
C. E-commerce & Merchandise (Platform Settings)
E-commerce Setup:
Route: /admin/features/ecommerce/setup
Description: Configure platform-level settings if e-commerce/merchandise is a globally offered feature. This might include default providers, fee structures, or global product categories.
D. Ticketing & Event Sales (Platform Settings)
Ticketing Platform Configuration:
Route: /admin/features/ticketing/settings
Description: Global settings for the ticketing module, such as service fee configurations, integration with payment gateways, and default ticket templates.
E. Live Streaming & Video (Platform Settings)
Streaming Provider Integration:
Route: /admin/features/live-streaming/providers
Description: Configure integrations with third-party live streaming services or manage settings for an in-built streaming solution.
F. Media Management (Platform Settings)
Storage & CDN Configuration:
Route: /admin/features/media/storage-cdn
Description: Configure default storage solutions (e.g., S3 buckets) and Content Delivery Network (CDN) settings for media assets uploaded across the platform.
G. Sponsorship & Advertising (Platform Settings)
Platform Ad Management:
Route: /admin/features/sponsorship/ad-management
Description: Define global ad placements, manage platform-level sponsors, and set policies for advertising if applicable.
H. Feature Flags & Toggles
Route: /admin/features/flags
Description: Manage feature flags to enable/disable specific functionalities across the platform or for beta testing with certain leagues/users.
V. System & Infrastructure
A. System Health & Monitoring
Real-time System Status:
Route: /admin/system/status
Description: Dashboard displaying real-time health and performance of servers, databases, background job queues, and critical services.
Background Job Monitoring:
Route: /admin/system/jobs
Description: View the status of background tasks, scheduled jobs, and queues. Manage and troubleshoot failed jobs.
Application Error Logs:
Route: /admin/system/logs/errors
Description: Access and search application error logs for troubleshooting and diagnostics.
Request Logs (API & System):
Route: /admin/system/logs/requests
Description: Monitor incoming API requests and system-level request logs for performance and security analysis.
B. API & Integrations Management
Public API Configuration:
Route: /admin/system/api/public-api
Description: Manage settings for the public API, including versioning, rate limits, developer key generation, and access to documentation.
Webhook Configuration:
Route: /admin/system/api/webhooks
Description: Configure and monitor platform-level outgoing webhooks to external services. Track delivery status and logs.
Third-Party Service Integrations:
Route: /admin/system/api/integrations
Description: Manage and monitor the status of integrations with essential third-party services (e.g., mapping services, analytics platforms).
C. Security & Audit
Platform Audit Logs:
Route: /admin/system/security/audit-trail
Description: Comprehensive and immutable logs of all actions performed by System Admins and critical system events for security and compliance.
Security Configuration:
Route: /admin/system/security/settings
Description: Configure global security settings, such as Multi-Factor Authentication (MFA) requirements for admins, password policies, session timeouts, and IP allowlisting.
D. Maintenance Mode
Route: /admin/system/maintenance
Description: Enable or disable maintenance mode for the platform, displaying a notice to users during updates or critical maintenance windows.
E. Database Management (Overview)
Route: /admin/system/database
Description: View database status, manage backups (initiate, restore from), and view schema information (read-only). Direct DB manipulation should be handled via proper migration tools.
VI. Customization & Localization
A. Platform Appearance & Branding
Global Theme & Styling:
Route: /admin/customization/theme
Description: Manage the global look and feel of the platform, including themes, primary color schemes, and default logos that can be overridden by leagues if white-labeling is enabled.
B. Languages & Translations
Manage Languages:
Route: /admin/customization/languages
Description: Add, enable/disable, and set default languages for the platform. Manage translations for global UI elements and system messages.
C. System Email Templates
Route: /admin/customization/email-templates
Description: Customize system-wide email templates (e.g., user invitation, global password reset, platform announcements).
VII. Support & Communication
A. Internal Messaging / Admin Chat
Message Center:
Route: /admin/support/messaging
Description: A dedicated portal for System Admins to communicate with each other or to send direct messages to League Admins regarding platform issues or updates.
B. Support Configuration & Helpdesk
Helpdesk & Knowledge Base Settings:
Route: /admin/support/config
Description: Configure links to the support portal, knowledge base, and manage settings for any integrated helpdesk or customer support tools.
VIII. Legal & Compliance
A. Terms, Policies & Legal Documents
Manage Documents:
Route: /admin/compliance/documents
Description: Manage and update links to or content of legal documents such as Terms of Service, Privacy Policy, Cookie Policy, and Acceptable Use Policy.
B. Data Privacy & GDPR Compliance
Data Subject Requests:
Route: /admin/compliance/data-privacy
Description: Tools to help manage data subject requests (e.g., data access, data deletion) in compliance with GDPR or other privacy regulations.
C. Accessibility Compliance
Accessibility Settings & Reports:
Route: /admin/compliance/accessibility
Description: View accessibility compliance reports (if available) and manage any platform-wide settings related to WCAG or other accessibility standards.
IX. Advanced Search & Discovery
A. Global Search Configuration
Route: /admin/search/config
Description: Configure how global search works across the platform for admins (e.g., indexing options, searchable fields, relevance tuning).
X. Mobile App Management (If applicable)
A. App Version & Updates:
Route: /admin/mobile-app/versions
Description: Manage information related to native mobile apps, such as latest versions, release notes, and links to app stores.
B. Push Notification Control (Global):
Route: /admin/mobile-app/push-control
Description: Global controls for sending mass push notifications or managing push notification campaigns if not covered under general notifications.
XI. My Account (System Admin's Own)
A. My Profile
Route: /admin/account/profile
Description: Manage the System Admin's own profile information (name, contact details).
B. Security Settings
Route: /admin/account/security
Description: Manage personal security settings like password change, MFA setup for their own account.
C. Logout
Route: /logout (or handled by a function)
Description: Logs the System Admin out of the platform.