# LyVenTum: AI Developer Context

This document provides a concise overview of the LyVenTum web application, intended for AI assistants to quickly gain context about the project's architecture, purpose, and key functionalities.

## 1. Project Purpose & Core Concept

**LyVenTum** is a multi-tenant SaaS platform for professional event management. It provides tools for organizers to set up and monitor events, and portals for attendees and vendors to interact with the event.

**Core User Roles:**
- **Superadmin:** Manages the entire platform, including client companies and subscription plans.
- **Organizer/Admin:** Manages specific events (setup, monitoring, data analysis).
- **Attendee:** Accesses a personal portal to view their agenda and receive notifications.
- **Vendor (Booth Staff):** Uses a simplified interface to scan attendee QR codes at their designated booth.

## 2. Technology Stack

- **Frontend:** React 19 (using hooks), TypeScript, Vite.
- **Backend & Database:** Supabase (PostgreSQL DB, Auth, Realtime subscriptions, Storage, Edge Functions).
- **Styling:** Tailwind CSS.
- **Routing:** React Router.
- **State Management:** React Context API is used extensively. There are specific contexts for Auth, Event Data, Selected Event, etc.
- **Key Libraries:** `recharts` (charts), `xlsx` (Excel parsing), `jspdf` (PDF generation), `html5-qrcode` (scanner).

## 3. High-Level Architecture & File Structure

The application is a Single Page Application (SPA) built with React and TypeScript.

- `src/`: Main application source code.
  - `components/`: Reusable UI components.
    - `ui/`: Generic, styled components (Button, Card, Input).
    - Other components are feature-specific (e.g., `AttendeeBadge.tsx`).
  - `contexts/`: All React Context providers, which manage global state. This is the heart of the app's state management.
    - `AuthContext.tsx`: Manages user authentication and roles.
    - `EventDataContext.tsx`: Manages all data for a *selected event* (sessions, booths, attendees, scans). This is a critical context.
    - `SelectedEventContext.tsx`: Manages the list of all available events and which one is currently selected by the organizer.
  - `pages/`: Contains all route-level components (the main views of the app).
    - `admin/`: Pages for organizers/superadmins.
    - `public/`: Publicly accessible pages like Login and Landing.
  - `utils/`: Helper functions, data mappers, parsers.
  - `App.tsx`: Defines application routes using React Router.
  - `supabaseClient.ts`: Initializes the Supabase client.

## 4. Key Functionalities

- **Multi-Tenant System:** The platform separates data and access by `company` and `event`. A superadmin oversees all companies. Organizers work within a specific event they select from a dropdown.
- **Data Import:**
  - **Master Import:** A powerful feature to configure an entire event (sessions, booths, registrations) from a single structured Excel file (`src/utils/excelParser.ts`).
  - **Flexible Attendee Import:** Allows importing attendee lists from CSV/Excel with a column-mapping UI.
- **QR Code Scanning:**
  - Uses the `html5-qrcode` library.
  - **Offline Mode:** Critically important. Uses `IndexedDB` (`src/utils/localDb.ts`) to queue scans when the user is offline. Scans are synced automatically upon reconnection.
- **Real-time Dashboards:** Uses Supabase Realtime subscriptions to update dashboards and data grids live as new scans occur.
- **Feature Flag System:**
  - A tiered plan system (`plans`, `features` tables in DB) controls which features are available.
  - The `FeatureFlagContext` and `FeatureGuard` component are used to conditionally render UI and protect routes based on the selected event's plan.
  - A Superadmin can **simulate** any plan to test the user experience.
- **Attendee Portal:** A separate, secure area for attendees to log in via magic link (passwordless) and view their personalized agenda. It supports web push notifications for reminders.

## 5. Important Notes for AI

- **State Management is Context-Based:** Before suggesting complex state management solutions like Redux, remember the app heavily relies on React Context for modular state.
- **Supabase is the Backend:** All data fetching, authentication, and real-time updates are handled through the Supabase client (`supabase`). The app uses Supabase RPC (Remote Procedure Calls) for complex database operations.
- **Data Flow:**
  1. User (organizer) logs in.
  2. `SelectedEventContext` fetches all events available to the user.
  3. User selects an event from the header dropdown.
  4. The `selectedEventId` is updated globally.
  5. `EventDataContext` listens for changes to `selectedEventId` and fetches all relevant data for that event (sessions, booths, attendees, scans).
  6. All pages then consume data from `EventDataContext`.
- **UI is built with Tailwind CSS:** UI changes should use Tailwind utility classes.
