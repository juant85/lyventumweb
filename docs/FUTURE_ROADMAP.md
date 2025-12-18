# Future Roadmap: LyVentum 2.0 - The Evolution to the Attendee Experience

This document outlines a strategic, phased roadmap to evolve LyVentum from an event management tool into a comprehensive platform that delivers high value directly to attendees.

---

### **Phase 1: Multi-tenant Architecture & Client Portal (COMPLETED)**

**Objective:** To establish a scalable Software-as-a-Service (SaaS) architecture that cleanly separates public information from client-specific event portals.

*   **[DONE] Landing & Marketing Page:** The homepage has been redesigned to serve as a public portal with marketing information and pricing plans.
*   **[DONE] Client Portal:** A page (`/client-portal`) has been created that displays a list of all client companies using the platform.
*   **[DONE] Client-Specific Event Selection:** When a user clicks on a company, they are directed to a page that shows only the events for that company.
*   **[DONE] Specific Access Points:** Each event now has its own access buttons for "Organizer," "Attendee," and "Vendor," streamlining the login process and ensuring the user accesses the correct event.

**Result:** The platform now supports a true multi-tenant architecture, laying the groundwork for future growth and the organized onboarding of new clients.

---

### **Phase 2: The Attendee Portal (Next Objective)**

**Objective:** To create a secure and functional web portal where attendees can log in and view their most critical information: their personalized agenda. This is the cornerstone of the entire new experience.

1.  **Backend - Security & Authentication:**
    *   **Task 1.1: Implement Magic Link Authentication.** Configure Supabase Auth to allow passwordless login. This is modern, secure, and provides the best user experience for attendees.
    *   **Task 1.2: Design and Apply Row-Level Security (RLS) Policies for Attendees.** This is the most important security task. We will create database rules to ensure that a logged-in attendee can **ONLY AND EXCLUSIVELY** read their own data (their registrations, their sessions, their profile). We will rigorously protect data privacy.

2.  **Frontend - The Portal Interface:**
    *   **Task 2.1: Create New Route and Login Page.** We will implement a login page (`AttendeeLoginPage.tsx`) where the attendee only needs to enter their email to receive their Magic Link.
    *   **Task 2.2: Design and Build the Attendee Dashboard.** We will create the `AttendeeDashboardPage.tsx`. Its main function will be to query and display a clear, chronological list of the sessions the attendee is registered for, indicating the time, session name, and assigned booth.

**Result at the end of Phase 2:** We will have a secure and functional web portal. Attendees will be able to log in and see their personal agenda, which is already a great added value.

---

### **Phase 3: Proactive Communication & Engagement**

**Objective:** To make the event experience more dynamic and connected, using the portal as a communication hub.

1.  **Backend - Automated Notification System:**
    *   **Task 3.1: Implement an Edge Function in Supabase.** We will create a function that runs on Supabase's servers to handle the reminder logic.
    *   **Task 3.2: Set up a Cron Job.** We will schedule the Edge Function to run automatically every few minutes (e.g., every 5 min).
    *   **Task 3.3: Integrate with an Email Service.** We will connect the function with a service like **Resend**. The function will look for sessions that are about to start and send a reminder email to registered attendees.

2.  **Frontend - Preferences & Chat:**
    *   **Task 4.1: Add Notification Preferences.** In the `AttendeeDashboardPage`, we will add a small section where the attendee can enable or disable email reminders.
    *   **Task 4.2: Integrate Attendee-Booth Chat.** We will adapt the existing chat system so that from their dashboard, an attendee can start a conversation with the booth they are assigned to in the active session.

**Result at the end of Phase 3:** Attendees will receive automatic reminders and be able to communicate directly, creating a more connected and efficient event. The operational cost of this phase is virtually nil.

---

### **Phase 4: The Native Application Experience**

**Objective:** To take the definitive leap to a superior mobile experience, publishing LyVentum in the app stores and using push notifications for unbeatable communication.

1.  **Smart Intermediate Step - Convert the Portal into a PWA (Progressive Web App):**
    *   **Task 5.1: Implement Service Worker and Manifest.** We will modify the web application so that users can "install" it on their phone's home screen.
    *   **Task 5.2: Enable Push Notifications.** We will use **Firebase Cloud Messaging (FCM)**. The PWA will ask the user for permission to send notifications. If they accept, we will save their device token in Supabase.
    *   **Task 5.3: Adapt the Edge Function.** We will modify the reminder function so that, instead of (or in addition to) sending an email, it sends a push notification via FCM.

2.  **Cross-Platform App Development (React Native):**
    *   **Task 6.1: Create the React Native Project.** We will start a new codebase for the mobile app, sharing all business logic and calls to Supabase.
    *   **Task 6.2: Adapt the User Interface.** We will re-implement the attendee portal views (`Dashboard`, `Agenda`, `Chat`) using React Native components.
    *   **Task 6.3: Native Integration.** We will configure the native SDKs for seamless handling of push notifications on iOS and Android.
    *   **Task 6.4: Publication Process.** We will prepare the application and submit it for review on the Apple App Store and Google Play.

**Result at the end of Phase 4:** LyVentum establishes itself as a premium solution with a dedicated mobile application, offering the best possible experience and the most direct and effective communication channel: push notifications.