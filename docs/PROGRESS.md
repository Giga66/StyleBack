# StyleBack - Project Progress Tracker

This document serves as a living record of the progress, features, and technical milestones we have achieved while building the StyleBack Shopify App.

## Phase 1: Core Architecture & Setup
**Status:** ✅ Completed

*   **App Initialization:** Scaffolded a new Shopify app using the official Remix template (`@shopify/shopify-app-remix`).
*   **Database Design:** Replaced the default session storage and built out a robust SQLite database using Prisma.
    *   Created `AbandonedCart` model to store customer emails, checkout tokens, and raw cart contents.
    *   Created `EmailSchedule` model to queue and track the status of the 3-part email sequence.
*   **Webhook Integration:** Configured `checkouts/create` and `checkouts/update` webhooks. The app successfully intercepts abandoned checkouts from Shopify and saves them to the database.
*   **Premium Dashboard UI:** Built a stunning, high-fashion merchant dashboard using dark mode `#0a0a0a`, `#D4AF37` golden accents, glassmorphic containers, and elegant typography (a mix of `Didot` and geometric sans-serif).
*   **Background Scheduler:** Implemented a continuous Node.js background worker (`scheduler.js`) that polls the database every 60 seconds to find and process emails that are due to be sent.

## Phase 2: The Smart Marketing Engine
**Status:** ✅ Completed

*   **Protected Customer Data:** Successfully navigated Shopify's API access restrictions to grant the app `read_customers` and `read_orders` scopes, allowing us to legally read abandoned checkout emails.
*   **Email Customization Schema:** Updated the database to include `MerchantSettings`, allowing merchants to define custom `delay1Hour`, `delay2Hour`, `delay3Hour`, `brandColor`, `replyToEmail`, and override the default text for all three emails.
*   **Premium HTML Emails:** Created `emailTemplates.js` to generate beautiful, responsive HTML emails that dynamically inject the merchant's brand color, store name, and the specific items left in the customer's cart.
*   **Nodemailer Integration:** Replaced mock logs with `nodemailer` and integrated Ethereal Email to dynamically generate test SMTP accounts on boot, allowing us to securely preview real emails in the browser during development.
*   **Shopify GraphQL API Enrichment:**
    *   **Scarcity Logic (Email 1):** The app queries Shopify's Admin API for live inventory. If a cart item has < 5 in stock, it dynamically adds an urgent "Low Stock" warning.
    *   **Style Pairings (Email 2):** The app queries Shopify's machine-learning Product Recommendations API to find and suggest items that pair perfectly with the abandoned product.
    *   **Dynamic Discounts (Email 3):** The app automatically generates unique, random discount codes (e.g., `STYLEBACK-X8A21B`) for the final offer email.
*   **Dashboard Enhancements:** 
    *   Added an onboarding "How StyleBack Works" card to the dashboard.
    *   Added Textareas for merchants to edit their email copy.
    *   Injected a Crisp Live Chat widget script into the dashboard so merchants can contact support directly from the app.
*   **App Monetization:** Fully implemented the Shopify Billing API to lock the app behind a $29 one-time lifetime access charge *(Note: Temporarily commented out during development because Shopify dev stores block billing for non-public apps).*

## Phase 3: Launch Preparation
**Status:** ✅ Completed

*   [x] Swapped Ethereal Test Email for the Resend SDK using a production API key.
*   [x] Injected the real Crisp Chat `WEBSITE_ID` for live customer support.
*   [x] Re-enabled the $29 Shopify Billing API lock and verified the charge approval screen.
*   [x] Configured the app for "Public Distribution" in the Shopify Partner Dashboard.
