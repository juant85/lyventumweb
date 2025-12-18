

# LyVenTum: Advanced Event Management System

**LyVenTum** is a comprehensive, multi-tenant SaaS platform for the end-to-end management of professional events. It empowers organizers with a powerful suite of tools for configuration, real-time monitoring, and data analysis, while providing a streamlined access portal for clients and attendees.

---

## Core Features

### 1. **Multi-Tenant Client & Event Architecture**
- **Public-Facing Portal:** A professional entry point that separates marketing information from the event management application.
- **Client Portal:** A directory page listing all client companies. This allows users to first select a company and then view only the events associated with it.
- **Event-Specific Access:** Each event has its own dedicated login points for Organizers, Attendees, and Vendors, ensuring a clean, scalable, and secure user journey.

### 2. **Authentication & Multi-Role System**
- **Superadmin:** Global control over the platform, with the ability to create, manage, and oversee multiple client events and subscription plans.
- **Organizer/Admin:** Manages assigned events with full access to configuration, reporting, and monitoring tools within a selected event.
- **Attendee:** A dedicated, secure portal for attendees to view their personalized agenda, manage notifications, and receive a virtual badge.
- **Vendor:** A direct, code-based login for booth staff to access the QR scanner.

### 3. **Advanced Data Import Suite**
- **Master Import (Excel):** Configure an entire event—including sessions with specific times, booth locations, and attendee pre-registrations—from a single, intuitively formatted Excel spreadsheet.
- **Flexible Attendee Import (Excel/CSV):** A powerful tool to import attendee lists from Excel or CSV files. It features a column-mapping interface that allows organizers to map their file's columns to standard fields (name, email, etc.) and import any other data as flexible "custom fields".

### 4. **Live QR Code Scanner**
- **Intelligent Check-in:** Provides real-time, contextual feedback to the operator for each scan (e.g., "Expected Attendee," "Walk-in," "Unexpected Booth," "Duplicate Scan").
- **Robust Offline Mode:** Utilizes IndexedDB to save all scans locally if the internet connection is lost. Scans are automatically and reliably synced to the cloud once connectivity is restored, with clear UI indicators for sync status.
- **Integrated Chat:** Booth operators can communicate directly with supervisors on the dashboard in real-time without leaving the scanner interface.

### 5. **Real-time Dashboards & Visualization**
- **Main Dashboard:** At-a-glance metrics on total attendance, live activity levels, and the currently active session.
- **Visualization Grid:** A dynamic grid displaying the live occupancy of each booth with color-coded status (Empty, Active, At Capacity) for easy monitoring of event flow.
- **Live Analytics:** Trend charts visualizing attendance patterns over time, most popular booths by traffic, and session-by-session engagement.
- **Live Chat Panel:** Supervisors can view all conversations from all booths in a single, unified interface, with real-time notifications for new messages.

### 6. **Comprehensive Attendee Management**
- **Unified Profiles:** A central repository for all attendees. View, create, edit, and delete attendee profiles, which now display any custom data imported.
- **Duplicate Detection & Merging:** The system intelligently identifies potential duplicate profiles (based on email or name/organization). A user-friendly modal allows admins to review and merge these records, consolidating all related data into a single primary profile.
- **Detailed Scan History:** Each attendee profile includes a complete log of all their interactions and check-ins throughout the event.

### 7. **Dynamic Feature Management & Plans**
- **Multi-Tier Architecture:** The system is built on a feature-flag architecture, allowing for the creation of different subscription plans (e.g., "Basic", "Professional", "Enterprise").
- **Superadmin Control:** A superadmin can create and manage these plans, enabling or disabling specific features (like advanced reporting, master import, or real-time analytics) for each tier.
- **Scalable Product Offering:** This modular approach allows for flexible pricing strategies and the ability to tailor the application's functionality to different client needs without changing the core codebase.

### 8. **Professional Outputs & Reporting**
- **PDF Report Generation:**
  - **Event Summary Report:** A comprehensive overview of the event, including key metrics and data visualizations.
  - **Booth-Specific Report:** A detailed report for a single booth, including a full list of unique visitors, perfect for sharing with exhibitors.
- **Badge & QR Code Generation:**
  - **Individual QR Download:** Download a high-quality PNG of any attendee's QR code directly from their profile.
  - **Batch PDF Badge Generation:** Select multiple attendees and generate a single, multi-page PDF of print-ready event badges, each formatted with the attendee's name, organization, and unique QR code.

---

## Future Direction & Monetization Strategy

For details on the upcoming features and strategic direction of the platform, including the plan for a full **Event Sponsorship Module**, please see the [**Future Roadmap**](./FUTURE_ROADMAP.md) and the [**Sponsorship Module Plan**](./SPONSORSHIP_MODULE_PLAN.md).

---

## Technology Stack

- **Frontend:** React 19, TypeScript, Vite.
- **Styling:** Tailwind CSS.
- **Routing:** React Router.
- **State Management:** React Context API
- **Backend & Database:** Supabase (PostgreSQL, Auth, Realtime, Edge Functions).
- **Data Visualization:** Recharts.
- **Offline Storage:** IndexedDB.
- **File Handling & Parsing:**
  - `xlsx` for Excel/CSV file parsing.
  - `jsPDF` & `jspdf-autotable` for PDF report generation.
  - `qrcode.react` & `qrcode` for QR code and badge generation.
- **UI/UX:** `react-hot-toast` for non-intrusive notifications.

---

## Recommended Import Workflow

To maximize the platform's flexibility, we recommend a two-step "dual-entry" import strategy. This approach treats your data sources as complementary, building a rich and accurate event profile.

1.  **Step 1: Master Import (The Structural Blueprint)**
    - **Purpose:** To define the core structure of the event: sessions, meetings, and the initial list of participants (both attendees and vendors).
    - **Action:** Use the **Master Import** tool with your main event schedule (Excel grid).
    - **Outcome:** This process creates basic profiles for all mentioned attendees and booths. Importantly, attendees listed under a booth in the grid are automatically flagged as **Vendors**. This creates the relational skeleton of your event.

2.  **Step 2: Attendee Import (The CRM Enrichment)**
    - **Purpose:** To add detailed information to all profiles created in Step 1.
    - **Action:** Use the **Flexible Attendee Import** tool with a detailed list of attendees (CSV or Excel). This file should contain columns like phone number, job title, email, and any other custom data you want to track.
    - **Outcome:** The system uses the **email address** or **name/organization combination** as a unique key. Instead of creating duplicates, it intelligently finds the existing profiles (both regular attendees and vendors) and updates them with the rich, detailed information from your second file.

This workflow ensures that you can structure your event and enrich participant data from different sources without conflict, leveraging LyVenTum's full CRM-like capabilities.

---

## Setup and Installation

Follow these steps to get a local copy of LyVentum up and running.

### Prerequisites
- Node.js (v18 or later)
- npm or yarn
- A Supabase account

### Installation Steps

1.  **Clone the repository:**
    ```bash
    git clone [your-repository-url]
    cd [repository-folder]
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Supabase Credentials:**
    The application requires your Supabase project's URL and Public Anon Key to connect to the backend.
    
    - Create a file named `.env` in the root of the project.
    - Add the following lines to the `.env` file, replacing the placeholders with your actual credentials from your Supabase project dashboard (Settings > API).

      ```env
      VITE_SUPABASE_URL=YOUR_SUPABASE_URL_HERE
      VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
      ```
    
    > **Note:** The application will fail to start if these credentials are not provided.

4.  **Set up the Database Schema and Functions:**
    The application relies on a specific database structure and custom RPC functions. You must run the SQL script provided in the **Database Setup** section below in your Supabase project's SQL Editor. This is a one-time setup step for a new project.

5.  **Configure Email System (Edge Function):**
    The application uses a Supabase Edge Function to send emails via Resend, bypassing CORS restrictions.
    
    - **Deploy the Edge Function** (already deployed for production):
      ```bash
      npx supabase functions deploy send-email --project-ref YOUR_PROJECT_REF
      ```
    
    - **Configure Resend API Key:**
      ```bash
      npx supabase secrets set RESEND_API_KEY=re_YourResendAPIKey --project-ref YOUR_PROJECT_REF
      ```
      
      Get your Resend API key from [resend.com](https://resend.com) → API Keys section.
    
    - **Verify deployment:**
      ```bash
      npx supabase functions list --project-ref YOUR_PROJECT_REF
      npx supabase secrets list --project-ref YOUR_PROJECT_REF
      ```
    
    > **Note:** The Edge Function is located at `supabase/functions/send-email/index.ts` and handles:
    > - Access code emails
    > - Test emails from Email Settings page
    > - Manual resend functionality
    > 
    > See the [**Email System Documentation**](#email-system) section below for more details.

6.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running on `http://localhost:5173` (or another port if 5173 is in use).

---

## Email System

LyVentum includes a robust email delivery system for sending access codes to attendees. The system is built on a **Supabase Edge Function** architecture to ensure security and avoid CORS issues.

### Architecture Overview

```
Frontend (React)
    ↓
Supabase Edge Function (send-email)
    ↓
Resend API
    ↓
Email Delivered to User
```

**Key Benefits:**
- ✅ **No CORS issues** - Edge Function acts as a secure proxy
- ✅ **API key security** - Resend API key never exposed to frontend
- ✅ **Simple & portable** - Single Edge Function handles all email types
- ✅ **Full HTML control** - Custom email templates with branding

### Features

1. **Access Code Emails**
   - Automatically sent when creating/resending access codes
   - Custom HTML template with event branding
   - Sponsor logo integration (if configured)
   - Direct access link for one-click login

2. **Test Email Functionality**
   - Located in Email Settings page (`/email-settings`)
   - Send test emails to verify configuration
   - Uses same template as production emails

3. **Manual Resend**
   - Available in Attendee Profile pages
   - Resends existing access code if valid
   - Generates new code if expired

### Setup Instructions

#### 1. Get Resend API Key

1. Create account at [resend.com](https://resend.com)
2. Navigate to **API Keys** section
3. Create new API key (name it "LyVentum Production")
4. Copy the key (starts with `re_`)

#### 2. Configure Edge Function

From your project directory:

```bash
# Set the Resend API key as a secret
npx supabase secrets set RESEND_API_KEY=re_YourActualAPIKey --project-ref YOUR_PROJECT_REF

# Verify it was set correctly
npx supabase secrets list --project-ref YOUR_PROJECT_REF
```

#### 3. Test Email Delivery

1. Open `http://localhost:5173/email-settings`
2. Scroll to "Test Email" section
3. Enter your email address
4. Click "Send Test Email"
5. Check your inbox (and spam folder)

### Edge Function Details

**Location:** `supabase/functions/send-email/index.ts`

**Endpoint:** `https://[project-ref].supabase.co/functions/v1/send-email`

**Request Format:**
```typescript
{
  type: 'test' | 'access_code',
  recipientEmail: string,
  code?: string,
  html: string,
  eventId: string
}
```

**Environment Variables:**
- `RESEND_API_KEY` - Your Resend API key (configured via Supabase secrets)

### Email Templates

Email templates are built dynamically in `src/emails/services/emailService.ts` using the `buildAccessCodeEmailHTML()` method.

**Template Features:**
- Event/company logo display
- Sponsor logo integration
- Formatted 6-digit access code
- Direct access button with deep link
- Responsive HTML design
- Custom branding per event

### Troubleshooting

**Emails not sending:**
1. Verify Resend API key is set: `npx supabase secrets list --project-ref YOUR_PROJECT_REF`
2. Check Edge Function logs in Supabase dashboard
3. Verify sender email is using a verified domain in Resend
4. Check Resend dashboard for delivery status

**CORS errors:**
- This should not happen with Edge Function architecture
- If it does, verify you're calling `supabase.functions.invoke('send-email')` and not calling Resend directly

**Browser cache issues:**
- Use Incognito/Private browsing during development
- Hard refresh: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + F5` (Windows)
- Clear browser cache in Developer Tools → Application → Clear Storage

### Deployment Notes

The Edge Function is already deployed to production. If you need to redeploy:

```bash
npx supabase functions deploy send-email --project-ref YOUR_PROJECT_REF
```

For detailed setup instructions, see `docs/PLAN_DICIEMBRE_4.md`.

---

## Database Setup

To ensure the application functions correctly, you must set up the database schema, functions, and security policies in your Supabase project.

**Action Required:**
1.  Navigate to the **SQL Editor** in your Supabase project dashboard.
2.  Click **"+ New query"**.
3.  Copy the entire SQL script below and paste it into the query window.
4.  Click **"RUN"**. This will create all necessary tables, relationships, functions, and security policies for a new project.

```sql
-- =========== LyVenTum: Master Database Setup Script ===========
-- This script sets up the entire database schema, functions, and security policies.
-- It is designed to be run once on a new Supabase project.

-- =========== 1. EXTENSIONS AND TRIGGERS ===========
-- Enable moddatetime to automatically update 'updated_at' columns
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;
-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========== 2. TABLE CREATION (CORE) ===========

-- Stores client company information.
CREATE TABLE IF NOT EXISTS public.companies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    logo_url text, -- For the company's main logo
    website_url text,
    country text,
    city text,
    notes text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Stores multiple contacts for each company.
CREATE TABLE IF NOT EXISTS public.contacts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    position text,
    email text,
    phone text,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT contacts_company_id_email_key UNIQUE (company_id, email)
);

-- Stores high-level information about each event.
CREATE TABLE IF NOT EXISTS public.events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    event_logo_url text,
    start_date timestamptz,
    end_date timestamptz,
    location text,
    created_by_user_id uuid REFERENCES auth.users(id),
    company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    booth_layout_config JSONB DEFAULT NULL,
    CONSTRAINT event_dates_check CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
    CONSTRAINT events_company_id_name_key UNIQUE (company_id, name)
);

-- Idempotent update for existing databases
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'booth_layout_config') THEN
        ALTER TABLE public.events ADD COLUMN booth_layout_config JSONB DEFAULT NULL;
    END IF;
END $$;

-- Stores user profile data for organizers/admins, linked to authentication.
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username text,
    role text CHECK (role IN ('admin', 'organizer', 'superadmin')) DEFAULT 'organizer',
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Central repository for all attendee profiles across all events.
CREATE TABLE IF NOT EXISTS public.attendees (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    email text,
    organization text,
    phone text,
    position text,
    notes text,
    linkedin_url text,
    avatar_url text,
    last_day_lunch boolean DEFAULT false,
    is_veggie boolean DEFAULT false,
    has_tour boolean DEFAULT false,
    is_vendor boolean DEFAULT false NOT NULL,
    push_subscription jsonb,
    metadata jsonb,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    linkedin_scrape_snapshot_id TEXT,
    linkedin_scrape_status TEXT DEFAULT 'idle' NOT NULL
);

-- Represents exhibitor booths or stands for a specific event.
CREATE TABLE IF NOT EXISTS public.booths (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    physical_id text NOT NULL,
    company_name text NOT NULL,
    email text,
    phone text,
    notes text,
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    access_code text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(event_id, physical_id)
);

-- Represents time-slotted sessions within an event.
CREATE TABLE IF NOT EXISTS public.sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(event_id, name)
);

-- Links attendees to events (Many-to-Many) and stores event-specific info like check-in time.
CREATE TABLE IF NOT EXISTS public.event_attendees (
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    attendee_id uuid NOT NULL REFERENCES public.attendees(id) ON DELETE CASCADE,
    check_in_time timestamptz,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY(event_id, attendee_id)
);

-- Defines specific capacity for a booth within a particular session.
CREATE TABLE IF NOT EXISTS public.session_booth_capacities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    booth_id uuid NOT NULL REFERENCES public.booths(id) ON DELETE CASCADE,
    capacity integer NOT NULL DEFAULT 5 CHECK (capacity >= 0),
    UNIQUE(session_id, booth_id)
);

-- Logs every single QR code scan action.
CREATE TABLE IF NOT EXISTS public.scan_records (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    attendee_id uuid NOT NULL REFERENCES public.attendees(id) ON DELETE CASCADE,
    attendee_name text,
    booth_id uuid NOT NULL REFERENCES public.booths(id) ON DELETE CASCADE,
    booth_name text,
    session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    "timestamp" timestamptz NOT NULL DEFAULT now(),
    notes text,
    scan_type text NOT NULL CHECK (scan_type IN ('regular', 'out_of_schedule')),
    device_id text
);

-- Pre-registers attendees for specific sessions and tracks their attendance status.
CREATE TABLE IF NOT EXISTS public.session_registrations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    attendee_id uuid NOT NULL REFERENCES public.attendees(id) ON DELETE CASCADE,
    expected_booth_id uuid REFERENCES public.booths(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'Registered' CHECK (status IN ('Registered', 'Attended', 'No-Show')),
    registration_time timestamptz NOT NULL DEFAULT now(),
    actual_scan_id uuid REFERENCES public.scan_records(id) ON DELETE SET NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(event_id, session_id, attendee_id)
);

-- Table for Chat Messages between supervisors and booths.
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    booth_id uuid NOT NULL REFERENCES public.booths(id) ON DELETE CASCADE,
    sender_id text NOT NULL,
    sender_name text NOT NULL,
    sender_type text NOT NULL CHECK (sender_type IN ('supervisor', 'booth', 'attendee')),
    content text NOT NULL,
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Table for In-App Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    attendee_id uuid NOT NULL REFERENCES public.attendees(id) ON DELETE CASCADE,
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    message text NOT NULL,
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- =========== 2.1. TABLE CREATION (TRACKS FEATURE) ===========
-- Tabla para definir los tracks específicos de cada evento (ej. 'VIP', 'Prensa').
CREATE TABLE IF NOT EXISTS public.event_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  color text,
  sort_order int DEFAULT 0,
  active boolean DEFAULT true,
  CONSTRAINT uq_event_track_slug UNIQUE (event_id, slug)
);
COMMENT ON TABLE public.event_tracks IS 'Defines specific tracks or categories within an event (e.g., VIP, Speaker).';
CREATE INDEX IF NOT EXISTS idx_event_tracks_event_id ON public.event_tracks(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tracks_sort ON public.event_tracks(event_id, sort_order);

-- Tabla pivote para asignar asistentes a los tracks de un evento.
CREATE TABLE IF NOT EXISTS public.attendee_tracks (
  event_id uuid NOT NULL,
  attendee_id uuid NOT NULL,
  track_id uuid NOT NULL,
  assigned_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  assigned_at timestamptz DEFAULT now(),
  PRIMARY KEY (event_id, attendee_id, track_id),
  FOREIGN KEY (event_id, attendee_id) REFERENCES public.event_attendees(event_id, attendee_id) ON DELETE CASCADE,
  FOREIGN KEY (track_id) REFERENCES public.event_tracks(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.attendee_tracks IS 'Links attendees to specific tracks for an event.';
CREATE INDEX IF NOT EXISTS idx_attendee_tracks_attendee ON public.attendee_tracks(event_id, attendee_id);
CREATE INDEX IF NOT EXISTS idx_attendee_tracks_track ON public.attendee_tracks(event_id, track_id);


-- =========== 3. TABLE CREATION (PLANS, FEATURES) ===========
-- Stores different subscription plans (e.g., Basic, Pro).
CREATE TABLE IF NOT EXISTS public.plans (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Stores a catalog of all modular features in the application.
CREATE TABLE IF NOT EXISTS public.features (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    key text NOT NULL UNIQUE,
    name text,
    description text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Links plans to features (many-to-many relationship).
CREATE TABLE IF NOT EXISTS public.plan_features (
    plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
    feature_id uuid NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (plan_id, feature_id)
);

-- Add 'plan_id' to the events table to associate each event with a plan.
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL;

-- Add 'is_active' to the events table for visibility control (for existing databases)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;

COMMENT ON COLUMN public.events.is_active IS 'Controls whether the event appears in the public client portal. Admins can toggle this to hide past events or drafts.';

-- Add indexes for is_active column (for existing databases)
CREATE INDEX IF NOT EXISTS idx_events_active ON public.events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_end_date ON public.events(end_date);
CREATE INDEX IF NOT EXISTS idx_events_company_active ON public.events(company_id, is_active) WHERE is_active = true;


-- =========== 3.1. TABLE CREATION (RBAC - EVENT_USERS) ===========
-- Enables event-scoped access control: SuperAdmin assigns organizers to specific events
-- This table creates a many-to-many relationship between users and events with role information

CREATE TABLE IF NOT EXISTS public.event_users (
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('organizer', 'viewer')) DEFAULT 'organizer',
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_users_user_id ON public.event_users(user_id);
CREATE INDEX IF NOT EXISTS idx_event_users_event_id ON public.event_users(event_id);

COMMENT ON TABLE public.event_users IS 'Maps users to events they have access to. SuperAdmin assigns organizers here.';
COMMENT ON COLUMN public.event_users.role IS 'organizer = can edit, viewer = read-only';
COMMENT ON COLUMN public.event_users.assigned_by IS 'Tracks which SuperAdmin assigned this access';

-- Migrate existing events to grant access to their creators
-- This ensures existing organizers don't lose access when RLS is enabled
DO $$
BEGIN
    INSERT INTO public.event_users (event_id, user_id, role, assigned_by)
    SELECT 
        e.id as event_id,
        e.created_by_user_id as user_id,
        'organizer' as role,
        e.created_by_user_id as assigned_by  -- Self-assigned for migration
    FROM events e
    WHERE e.created_by_user_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM event_users eu 
        WHERE eu.event_id = e.id AND eu.user_id = e.created_by_user_id
      );
END $$;


-- =========== 4. TRIGGER SETUP ===========
-- Create triggers for all tables with 'updated_at' to handle automatic updates.
CREATE OR REPLACE TRIGGER handle_updated_at_companies BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);
CREATE OR REPLACE TRIGGER handle_updated_at_contacts BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);
CREATE OR REPLACE TRIGGER handle_updated_at_events BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);
CREATE OR REPLACE TRIGGER handle_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);
CREATE OR REPLACE TRIGGER handle_updated_at_attendees BEFORE UPDATE ON public.attendees FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);
CREATE OR REPLACE TRIGGER handle_updated_at_booths BEFORE UPDATE ON public.booths FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);
CREATE OR REPLACE TRIGGER handle_updated_at_sessions BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);
CREATE OR REPLACE TRIGGER handle_updated_at_session_registrations BEFORE UPDATE ON public.session_registrations FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- =========== 5. RPC FUNCTIONS & HELPER FUNCTIONS ===========
-- Helper function to check if a user is an organizer/admin based on 'profiles' table.
CREATE OR REPLACE FUNCTION is_organizer(p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE user_id = p_user_id);
END;
$$;

-- Securely checks if an attendee email exists.
CREATE OR REPLACE FUNCTION public.check_attendee_exists(p_email text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.attendees WHERE lower(email) = lower(p_email));
END;
$$;
GRANT EXECUTE ON FUNCTION public.check_attendee_exists(text) TO anon, authenticated;

-- Securely checks if an email belongs to a user with an organizer/admin profile.
CREATE OR REPLACE FUNCTION public.check_organizer_exists(p_email text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users u
        JOIN public.profiles p ON u.id = p.user_id
        WHERE lower(u.email) = lower(p_email)
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.check_organizer_exists(text) TO anon, authenticated;


-- Safely deletes an event and all its cascaded data.
CREATE OR REPLACE FUNCTION public.delete_event_and_related_data(event_id_to_delete uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Delete in correct order to respect foreign keys
    
    -- Delete attendee track assignments (uses track_id, not event_track_id)
    DELETE FROM public.attendee_tracks 
    WHERE track_id IN (SELECT id FROM public.event_tracks WHERE event_id = event_id_to_delete);
    
    -- Delete event tracks
    DELETE FROM public.event_tracks WHERE event_id = event_id_to_delete;
    
    -- Delete notifications
    DELETE FROM public.notifications WHERE event_id = event_id_to_delete;
    
    -- Delete messages (through booths)
    DELETE FROM public.messages 
    WHERE booth_id IN (SELECT id FROM public.booths WHERE event_id = event_id_to_delete);
    
    -- Delete session-related data
    DELETE FROM public.session_booth_capacities 
    WHERE session_id IN (SELECT id FROM public.sessions WHERE event_id = event_id_to_delete);
    
    DELETE FROM public.session_registrations 
    WHERE session_id IN (SELECT id FROM public.sessions WHERE event_id = event_id_to_delete);
    
    -- Delete sessions
    DELETE FROM public.sessions WHERE event_id = event_id_to_delete;
    
    -- Delete booths
    DELETE FROM public.booths WHERE event_id = event_id_to_delete;
    
    -- Delete scans
    DELETE FROM public.scan_records WHERE event_id = event_id_to_delete;
    
    -- Delete event-attendee relationships
    DELETE FROM public.event_attendees WHERE event_id = event_id_to_delete;
    
    -- Finally, delete the event itself
    DELETE FROM public.events WHERE id = event_id_to_delete;
    
    RAISE NOTICE 'Event % and all related data deleted successfully', event_id_to_delete;
END;
$$;

-- Updates a session registration to "Attended" status upon a valid scan.
CREATE OR REPLACE FUNCTION public.link_scan_to_registration(p_attendee_id uuid, p_session_id uuid, p_scan_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    UPDATE public.session_registrations
    SET status = 'Attended', actual_scan_id = p_scan_id
    WHERE attendee_id = p_attendee_id AND session_id = p_session_id AND status = 'Registered';
END;
$$;

-- Merges duplicate attendee profiles into a single primary profile.
CREATE OR REPLACE FUNCTION public.merge_attendees(primary_id uuid, duplicate_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE public.scan_records SET attendee_id = primary_id WHERE attendee_id = ANY(duplicate_ids);
    UPDATE public.session_registrations AS sr
    SET attendee_id = primary_id
    WHERE sr.attendee_id = ANY(duplicate_ids)
      AND NOT EXISTS (
        SELECT 1 FROM public.session_registrations
        WHERE event_id = sr.event_id AND session_id = sr.session_id AND attendee_id = primary_id
      );
    UPDATE public.event_attendees AS ea
    SET attendee_id = primary_id
    WHERE ea.attendee_id = ANY(duplicate_ids)
      AND NOT EXISTS (
        SELECT 1 FROM public.event_attendees
        WHERE event_id = ea.event_id AND attendee_id = primary_id
      );
    DELETE FROM public.session_registrations WHERE attendee_id = ANY(duplicate_ids);
    DELETE FROM public.event_attendees WHERE attendee_id = ANY(duplicate_ids);
    DELETE FROM public.attendees WHERE id = ANY(duplicate_ids);
END;
$$;

-- Get a booth by its access code for secure vendor login.
CREATE OR REPLACE FUNCTION public.get_booth_by_access_code(p_access_code text)
RETURNS TABLE ( id uuid, physical_id text, company_name text, event_id uuid )
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT b.id, b.physical_id, b.company_name, b.event_id
    FROM public.booths b
    WHERE b.access_code = p_access_code;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_booth_by_access_code(text) TO anon, authenticated;

-- Function to automatically mark attendees as vendors based on the exhibitor list (booths).
CREATE OR REPLACE FUNCTION public.sync_vendors_from_booths(p_event_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
DECLARE
    updated_count integer;
BEGIN
    WITH vendor_companies AS (
        SELECT DISTINCT lower(company_name) as company_name
        FROM booths
        WHERE event_id = p_event_id
    ),
    attendees_to_update AS (
        SELECT a.id
        FROM attendees a
        JOIN event_attendees ea ON a.id = ea.attendee_id
        WHERE ea.event_id = p_event_id
          AND a.is_vendor = false
          AND lower(a.organization) IN (SELECT company_name FROM vendor_companies)
    )
    UPDATE attendees
    SET is_vendor = true
    WHERE id IN (SELECT id FROM attendees_to_update);

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;
GRANT EXECUTE ON FUNCTION public.sync_vendors_from_booths(uuid) TO authenticated;

-- Function to get all events with their related counts in one go.
DROP FUNCTION IF EXISTS public.get_all_events_with_counts();
CREATE OR REPLACE FUNCTION public.get_all_events_with_counts()
RETURNS TABLE(
    id uuid,
    name text,
    start_date timestamptz,
    end_date timestamptz,
    location text,
    created_by_user_id uuid,
    plan_id uuid,
    plan_name text,
    company_id uuid,
    company_name text,
    company_logo_url text,
    event_logo_url text,
    booth_count bigint,
    attendee_count bigint,
    vendor_staff_count bigint,
    is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.name,
        e.start_date,
        e.end_date,
        e.location,
        e.created_by_user_id,
        e.plan_id,
        p.name AS plan_name,
        c.id as company_id,
        c.name as company_name,
        c.logo_url as company_logo_url,
        e.event_logo_url,
        (SELECT COUNT(*) FROM public.booths b WHERE b.event_id = e.id) AS booth_count,
        (SELECT COUNT(DISTINCT ea.attendee_id) FROM public.event_attendees ea JOIN public.attendees a ON ea.attendee_id = a.id WHERE ea.event_id = e.id AND a.is_vendor = false) AS attendee_count,
        (SELECT COUNT(DISTINCT ea.attendee_id) FROM public.event_attendees ea JOIN public.attendees a ON ea.attendee_id = a.id WHERE ea.event_id = e.id AND a.is_vendor = true) AS vendor_staff_count,
        e.is_active
    FROM
        public.events e
    LEFT JOIN
        public.plans p ON e.plan_id = p.id
    LEFT JOIN
        public.companies c ON e.company_id = c.id
    ORDER BY
        e.name;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_all_events_with_counts() TO authenticated;

-- =========== 5.1. RBAC HELPER FUNCTIONS ===========
-- These functions are used in Row Level Security (RLS) policies to check permissions
-- They enable event-scoped access control: SuperAdmin bypasses, organizers see only their events

-- Check if user is a superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = $1 AND profiles.role = 'superadmin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_superadmin IS 'Returns true if user has superadmin role in profiles table';
GRANT EXECUTE ON FUNCTION public.is_superadmin(UUID) TO authenticated;

-- Check if user has ANY access to an event (organizer or viewer)
CREATE OR REPLACE FUNCTION public.user_has_event_access(user_id UUID, event_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_users 
    WHERE event_users.user_id = $1 AND event_users.event_id = $2
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.user_has_event_access IS 'Returns true if user is assigned to event (any role)';
GRANT EXECUTE ON FUNCTION public.user_has_event_access(UUID, UUID) TO authenticated;

-- Check if user is an organizer (can edit) for a specific event
CREATE OR REPLACE FUNCTION public.is_event_organizer(user_id UUID, event_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_users 
    WHERE event_users.user_id = $1 
      AND event_users.event_id = $2 
      AND event_users.role = 'organizer'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_event_organizer IS 'Returns true if user has organizer role for event (can edit)';
GRANT EXECUTE ON FUNCTION public.is_event_organizer(UUID, UUID) TO authenticated;

-- Get user's event role (useful for application layer)
CREATE OR REPLACE FUNCTION public.get_user_event_role(user_id UUID, event_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.event_users 
  WHERE event_users.user_id = $1 AND event_users.event_id = $2
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_user_event_role IS 'Returns user role for event or NULL if no access';
GRANT EXECUTE ON FUNCTION public.get_user_event_role(UUID, UUID) TO authenticated;


-- RPC: conteos por booth filtrables por track
CREATE OR REPLACE FUNCTION public.booth_counts_by_track(
  p_session_id uuid,
  p_track_id uuid DEFAULT NULL
) RETURNS TABLE (booth_id uuid, total bigint)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT
    s.booth_id,
    count(DISTINCT s.attendee_id)::bigint AS total
  FROM scan_records s
  LEFT JOIN attendee_tracks at ON at.attendee_id = s.attendee_id AND at.event_id = s.event_id
  WHERE s.session_id = p_session_id
    AND (p_track_id IS NULL OR at.track_id = p_track_id)
  GROUP BY s.booth_id;
$$;
GRANT EXECUTE ON FUNCTION public.booth_counts_by_track(uuid, uuid) TO authenticated;


-- =========== 6. STORAGE BUCKETS AND POLICIES ===========
-- Bucket for Company Logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('company_logos', 'company_logos', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml']) ON CONFLICT (id) DO NOTHING;
-- Bucket for Event-Specific Logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('event_logos', 'event_logos', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml']) ON CONFLICT (id) DO NOTHING;
-- Bucket for Attendee Avatars (from Camera)
INSERT INTO storage.buckets (id, name, public) VALUES ('attendee-avatars', 'attendee-avatars', true) ON CONFLICT (id) DO NOTHING;

-- Policies for Buckets (Now Idempotent)
DROP POLICY IF EXISTS "Public Read Access for Logos" ON storage.objects;
CREATE POLICY "Public Read Access for Logos" ON storage.objects FOR SELECT USING ( bucket_id IN ('company_logos', 'event_logos', 'attendee-avatars') );

DROP POLICY IF EXISTS "Allow Organizers to Manage Logos" ON storage.objects;
CREATE POLICY "Allow Organizers to Manage Logos" ON storage.objects FOR ALL USING ( bucket_id IN ('company_logos', 'event_logos', 'attendee-avatars') AND is_organizer(auth.uid()) );


-- =========== 7. ROW LEVEL SECURITY (RLS) ===========
-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_booth_capacities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendee_tracks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure a clean slate
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || quote_ident(r.tablename) || ';';
    END LOOP;
END $$;

-- CREATE NEW, CORRECT POLICIES

-- Policy Group 1: Organizers (users with a 'profiles' entry) have full permissions on most tables.
CREATE POLICY "Allow ALL for organizers" ON public.companies FOR ALL USING (is_organizer(auth.uid()));
CREATE POLICY "Allow public read-only for portals" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Allow ALL for organizers" ON public.contacts FOR ALL USING (is_organizer(auth.uid()));
CREATE POLICY "Allow ALL for organizers" ON public.events FOR ALL USING (is_organizer(auth.uid()));
CREATE POLICY "Allow public read-only for portals" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow ALL for organizers" ON public.booths FOR ALL USING (is_organizer(auth.uid()));
CREATE POLICY "Allow ALL for organizers" ON public.sessions FOR ALL USING (is_organizer(auth.uid()));
CREATE POLICY "Allow ALL for organizers" ON public.attendees FOR ALL USING (is_organizer(auth.uid()));

-- Allow public read access to attendees table
-- This enables validateCode join to work properly for attendee access codes
DROP POLICY IF EXISTS "Allow public read access to attendees" ON public.attendees;
CREATE POLICY "Allow public read access to attendees" ON public.attendees
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow ALL for organizers" ON public.scan_records FOR ALL USING (is_organizer(auth.uid()));
CREATE POLICY "Allow ALL for organizers" ON public.event_attendees FOR ALL USING (is_organizer(auth.uid()));
CREATE POLICY "Allow ALL for organizers" ON public.session_registrations FOR ALL USING (is_organizer(auth.uid()));

-- ========================================
-- CRITICAL: Booth Vendor Access Policies
-- Anonymous users (booths) need these permissions to use the QR scanner
-- ========================================

-- 1. Read booths (to verify booth access code)
DROP POLICY IF EXISTS "Allow anonymous read access to booths" ON public.booths;
CREATE POLICY "Allow anonymous read access to booths" ON public.booths 
  FOR SELECT TO anon USING (true);

-- 2. Insert attendees (to create walk-ins)
DROP POLICY IF EXISTS "Allow anonymous insert to attendees" ON public.attendees;
CREATE POLICY "Allow anonymous insert to attendees" ON public.attendees 
  FOR INSERT TO anon WITH CHECK (true);

-- 3. Insert event_attendees (to link walk-ins to events)
DROP POLICY IF EXISTS "Allow anonymous insert to event_attendees" ON public.event_attendees;
CREATE POLICY "Allow anonymous insert to event_attendees" ON public.event_attendees 
  FOR INSERT TO anon WITH CHECK (true);

-- 4. Insert scan_records (to save scans)
DROP POLICY IF EXISTS "Allow anonymous insert to scan_records" ON public.scan_records;
CREATE POLICY "Allow anonymous insert to scan_records" ON public.scan_records 
  FOR INSERT TO anon WITH CHECK (true);

-- 5. Select scan_records (for duplicate detection - 5 min cooldown)
DROP POLICY IF EXISTS "Allow anonymous select scan_records" ON public.scan_records;
CREATE POLICY "Allow anonymous select scan_records" ON public.scan_records 
  FOR SELECT TO anon USING (true);

-- 6. Read sessions (to determine active session)
DROP POLICY IF EXISTS "Allow anonymous read sessions" ON public.sessions;
CREATE POLICY "Allow anonymous read sessions" ON public.sessions 
  FOR SELECT TO anon USING (true);

-- 7. Read session_registrations (to verify expected booth)
DROP POLICY IF EXISTS "Allow anonymous read session_registrations" ON public.session_registrations;
CREATE POLICY "Allow anonymous read session_registrations" ON public.session_registrations 
  FOR SELECT TO anon USING (true);

-- ========================================
-- Migration: Add Scan Status Tracking
-- Date: 2024-11-28
-- Purpose: Track scan classification (Expected/Walk-in/Wrong Booth) for improved reporting
-- ========================================

-- Add scan_status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scan_records' AND column_name = 'scan_status'
    ) THEN
        ALTER TABLE scan_records ADD COLUMN scan_status text;
        RAISE NOTICE 'Added scan_status column to scan_records';
    ELSE
        RAISE NOTICE 'scan_status column already exists';
    END IF;
END $$;

-- Add expected_booth_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scan_records' AND column_name = 'expected_booth_id'
    ) THEN
        ALTER TABLE scan_records ADD COLUMN expected_booth_id uuid REFERENCES booths(id);
        RAISE NOTICE 'Added expected_booth_id column to scan_records';
    ELSE
        RAISE NOTICE 'expected_booth_id column already exists';
    END IF;
END $$;

-- Create index on scan_status for faster filtering
CREATE INDEX IF NOT EXISTS idx_scan_records_scan_status 
ON scan_records(scan_status);

-- Create index on expected_booth_id for joins
CREATE INDEX IF NOT EXISTS idx_scan_records_expected_booth_id 
ON scan_records(expected_booth_id);

-- ========================================
-- End Migration: Scan Status Tracking
-- ========================================


CREATE POLICY "Allow ALL for organizers" ON public.session_booth_capacities FOR ALL USING (is_organizer(auth.uid()));
CREATE POLICY "Allow ALL for organizers" ON public.messages FOR ALL USING (is_organizer(auth.uid()));
CREATE POLICY "Allow ALL for organizers" ON public.notifications FOR ALL USING (is_organizer(auth.uid()));
CREATE POLICY "Allow ALL for organizers on plans" ON public.plans FOR ALL USING (is_organizer(auth.uid()));
CREATE POLICY "Allow ALL for organizers on features" ON public.features FOR ALL USING (is_organizer(auth.uid()));
CREATE POLICY "Allow ALL for organizers on plan_features" ON public.plan_features FOR ALL USING (is_organizer(auth.uid()));

-- Profiles: Organizers can manage their own profile entry.
CREATE POLICY "Allow users to manage their own profile" ON public.profiles FOR ALL USING (auth.uid() = user_id);

-- Policy Group 2: Attendees (Authenticated users WITHOUT a 'profiles' entry)
CREATE POLICY "Allow attendee to read their own data" ON public.attendees FOR SELECT USING (NOT is_organizer(auth.uid()) AND email = auth.email());
CREATE POLICY "Allow attendee to update their own profile" ON public.attendees FOR UPDATE USING (NOT is_organizer(auth.uid()) AND email = auth.email());
CREATE POLICY "Allow attendee to read their own data" ON public.event_attendees FOR SELECT USING (NOT is_organizer(auth.uid()) AND attendee_id IN (SELECT id from public.attendees WHERE email = auth.email()));
CREATE POLICY "Allow attendee to read their own data" ON public.session_registrations FOR SELECT USING (NOT is_organizer(auth.uid()) AND attendee_id IN (SELECT id from public.attendees WHERE email = auth.email()));
CREATE POLICY "Allow attendee to read their own data" ON public.notifications FOR SELECT USING (NOT is_organizer(auth.uid()) AND attendee_id IN (SELECT id from public.attendees WHERE email = auth.email()));
CREATE POLICY "Allow attendee to manage their own chat messages" ON public.messages FOR ALL USING (
    ( sender_type = 'attendee' AND sender_id IN (SELECT id::text FROM public.attendees WHERE email = auth.email()) ) 
    OR 
    ( booth_id IN (SELECT sr.expected_booth_id FROM public.session_registrations sr JOIN public.attendees a ON sr.attendee_id = a.id WHERE a.email = auth.email() AND sr.expected_booth_id IS NOT NULL) )
);

-- Policy Group 3: Tracks
CREATE POLICY "Allow organizers to manage tracks" ON public.event_tracks FOR ALL USING (is_organizer(auth.uid()));
CREATE POLICY "Allow authenticated users to read tracks" ON public.event_tracks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow organizers to manage attendee track assignments" ON public.attendee_tracks FOR ALL USING (is_organizer(auth.uid()));
CREATE POLICY "Allow attendees to read their own track assignments" ON public.attendee_tracks FOR SELECT USING (attendee_id IN (SELECT id from public.attendees WHERE email = auth.email()));

-- =========== 8. DATA SEEDING (PLANS & FEATURES) ===========
INSERT INTO public.features (key, name, description) VALUES
    ('feature_check_in_desk', 'Check-in Desk', 'Allows access to the main event check-in page.'),
    ('feature_attendee_locator', 'Attendee Locator', 'Enables the live attendee locator tool.'),
    ('feature_dashboard', 'Dashboard', 'Access to the main event dashboard.'),
    ('feature_data_visualization', 'Data Visualization', 'Access to the live session and booth visualization grid.'),
    ('feature_real_time_analytics', 'Real-Time Analytics', 'Provides access to the detailed analytics page.'),
    ('feature_reports', 'Reports', 'Enables generation of PDF and CSV reports.'),
    ('feature_attendee_profiles', 'Attendee Profiles', 'Allows viewing and managing attendee profiles.'),
    ('feature_data_editor', 'Data Editor', 'Enables editing of raw event data like scan records.'),
    ('feature_session_settings', 'Session Settings', 'Allows creation and management of event sessions.'),
    ('feature_booth_setup', 'Booth Setup', 'Allows creation and management of booths and exhibitors.'),
    ('feature_tracks', 'Tracks Management', 'Allows creation of event tracks and assignment of attendees to them.'),
    ('feature_booth_map', 'Booth Map', 'Visual map view of booths with real-time status indicators showing empty (pulsing red), partial (amber), and full booths (green) for quick operational overview.'),
    ('feature_master_import', 'Master Import', 'Enables the master Excel import functionality.'),
avanzaDROP POLICY IF EXISTS "event_users_insert_policy" ON public.event_users;
CREATE POLICY "event_users_insert_policy" ON public.event_users
  FOR INSERT
  WITH CHECK (public.is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "event_users_update_policy" ON public.event_users;
CREATE POLICY "event_users_update_policy" ON public.event_users
  FOR UPDATE
  USING (public.is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "event_users_delete_policy" ON public.event_users;
CREATE POLICY "event_users_delete_policy" ON public.event_users
  FOR DELETE
  USING (public.is_superadmin(auth.uid()));

-- ========================================
-- End RBAC / RLS Policies
-- ========================================


-- --- END OF SCRIPT ---

---

## Future Enhancements

### Landing Page - Social Proof Section

> **Note:** This section is planned for future implementation when sufficient data is available.

**Location:** Between Pricing and Footer sections on the Landing Page

**Planned Content:**
- **Statistics Dashboard**
  - "1,000+ Events Powered"
  - "50K+ Attendees Tracked"
  - "99.9% Uptime Guarantee"
- **Client Testimonials** (when available)
  - Carousel showing customer feedback
  - Industry-specific use cases
- **Company Logos** (when available)
  - Grid of companies using the platform
  - Grayscale with hover color effect
- **Industry Recognition** (if applicable)
  - Awards or certifications
  - Media mentions

**Proposed Design:**
- Animated counters for statistics (using Framer Motion)
- Testimonial cards in carousel format
- Logo grid with smooth transitions
- Glass-morphism styling to match existing design

**Implementation Priority:** Low  
**Prerequisites:** Collect sufficient customer data and testimonials
