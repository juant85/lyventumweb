# LyVenTum: Functionality & QA Checklist

Use this checklist to perform regression testing and ensure all core functionalities are working as expected after implementing changes.

---

## 1. Public Pages & Authentication

- [ ] **Landing Page:**
  - [ ] Loads correctly for unauthenticated users.
  - [ ] "Access Event Portal" button navigates to the Client Portal.
  - [ ] Automatically redirects to the correct dashboard if a user is already logged in.
- [ ] **Client Portal (`/client-portal`):**
  - [ ] Displays a list of all client companies.
  - [ ] Clicking a company navigates to its specific event selection page.
- [ ] **Event Selection (`/events/:companyId`):**
  - [ ] Displays events only for the selected company.
  - [ ] Login buttons (Organizer, Attendee, Vendor) navigate to the correct login pages.
- [ ] **Organizer Login (`/login`):**
  - [ ] Successful login redirects to the main dashboard.
  - [ ] Shows an error message for incorrect credentials.
- [ ] **Attendee Login (`/portal/login`):**
  - [ ] Successfully sends a magic link upon entering a valid, registered email.
  - [ ] Shows an error if the email is not registered as an attendee.
  - [ ] Shows an error if the email belongs to an organizer.
- [ ] **Vendor/Booth Login (`/booth/login`):**
  - [ ] Successful login with a valid access code redirects to the QR Scanner.
  - [ ] Shows an error for an invalid access code.
- [ ] **Logout:**
  - [ ] Logs out the user from any role.
  - [ ] Redirects to the Landing Page.

## 2. Superadmin Portal

- [ ] **Event Management (`/superadmin/events`):**
  - [ ] Can view a list of all events across all companies.
  - [ ] Can create a new event for a new company.
  - [ ] Can create a new event for an existing company.
  - [ ] Can edit an existing event's details.
  - [ ] Can delete an event and all its associated data.
- [ ] **Client Management (`/superadmin/clients`):**
  - [ ] Can view all client companies.
  - [ ] Can create a new company with contacts.
  - [ ] Can edit an existing company's details and contacts.
  - [ ] Can delete a company.
- [ ] **Plan Management (`/superadmin/plans`):**
  - [ ] Can create a new subscription plan.
  - [ ] Can edit an existing plan by enabling/disabling features.
  - [ ] Can delete a plan.
- [ ] **Plan Simulation:**
  - [ ] Can select a plan to simulate from the header dropdown.
  - [ ] The UI correctly hides/shows features based on the simulated plan.
  - [ ] Can stop the simulation.

## 3. Organizer Portal (Core Functionality)

### 3.1. Setup & Configuration
- [ ] **Event Selection:**
  - [ ] Can switch between different managed events using the header dropdown.
  - [ ] The application data updates correctly after switching events.
- [ ] **Session Settings (`/session-settings`):**
  - [ ] Can create a new session with a name, start time, and end time.
  - [ ] Can edit an existing session.
  - [ ] Can assign attendees to a specific booth within a session.
- [ ] **Booth Setup (`/booth-setup`):**
  - [ ] Can create a new booth with a Physical ID and Company Name.
  - [ ] Can edit an existing booth's details.
  - [ ] Can delete a booth.
  - [ ] Can copy a booth's access code to the clipboard.
- [ ] **Master Import (`/master-import`):**
  - [ ] Correctly parses a valid Excel file.
  - [ ] Displays parsed sessions, booths, and registrations for review.
  - [ ] Allows editing of parsed data before import.
  - [ ] Successfully imports the data, creating all necessary records.
  - [ ] Displays parsing errors for an invalid file.
- [ ] **Flexible Attendee Import (`/attendee-registration`):**
  - [ ] Correctly parses a CSV/Excel file.
  - [ ] Auto-maps columns with common names.
  - [ ] Allows manual mapping of columns, including custom fields.
  - [ ] Allows editing of data before import.
  - [ ] Successfully imports attendees, creating new profiles or updating existing ones.

### 3.2. On-Site & Live Operations
- [ ] **Check-in Desk (`/check-in-desk`):**
  - [ ] Displays a searchable list of all event attendees.
  - [ ] "Check In" button works and updates the UI to show "Checked-in".
  - [ ] "Undo" check-in button works.
  - [ ] Can add a new "walk-in" attendee.
  - [ ] Can add/edit notes and preferences for an attendee.
  - [ ] Can take a photo for an attendee profile.
- [ ] **Attendee Locator (`/attendee-locator`):**
  - [ ] Activates only when a session is live.
  - [ ] Displays a prioritized list of attendees who have not checked into their assigned booth.
  - [ ] List updates in near real-time as attendees are scanned.

### 3.3. Monitoring & Analysis
- [ ] **Dashboard (`/dashboard`):**
  - [ ] Activates only when a session is live.
  - [ ] "Meeting Completion" gauge updates correctly.
  - [ ] "Missing in Action" list is accurate.
  - [ ] Booth performance lists are accurate.
- [ ] **Data Visualization (`/data-visualization`):**
  - [ ] Can switch between different sessions.
  - [ ] Booth grid displays correct occupancy and status (Empty, Active, At Capacity).
  - [ ] Booth grid updates in near real-time.
  - [ ] Clicking a booth shows a detailed modal of present/absent attendees.
- [ ] **Real-Time Analytics (`/real-time-analytics`):**
  - [ ] All charts (Funnel, Session Performance, Leaderboard, etc.) load with data.
  - [ ] Charts are visually correct and readable.
- [ ] **Reports (`/reports`):**
  - [ ] Can generate a full Event Summary PDF with charts.
  - [ ] Can generate a detailed PDF report for a specific booth.
  - [ ] Can export booth leads to a CSV file.

### 3.4. Data Management
- [ ] **Attendee Profiles (`/attendee-profiles`):**
  - [ ] Displays all non-vendor attendees.
  - [ ] Search functionality works.
  - [ ] Duplicate detection banner appears when duplicates exist.
  - [ ] Merging duplicates works correctly.
  - [ ] Can select multiple attendees and mark them as "Vendors".
  - [ ] Can generate PDF badges for selected attendees.
- [ ] **Vendor Profiles (`/vendor-profiles`):**
  - [ ] Displays all vendor/staff attendees.
  - [ ] Can select multiple vendors and revert them to "Attendees".
- [ ] **Attendee Profile Detail (`/attendee-profiles/:id`):**
  - [ ] All details are displayed correctly.
  - [ ] Can edit and save profile information.
  - [ ] Can delete the attendee profile.
  - [ ] Journey timeline is accurate.
  - [ ] Can download the QR code as a PNG.
  - [ ] Can find a LinkedIn photo for the attendee.
- [ ] **Data Editor (`/data-editor`):**
  - [ ] Displays a list of all scan records for the event.
  - [ ] Can delete a scan record.
  - [ ] Can export the filtered list to CSV.

## 4. QR Scanner

- [ ] **Authentication:**
  - [ ] Organizer can select a booth and start scanning.
  - [ ] Vendor can log in with an access code.
- [ ] **Functionality:**
  - [ ] Camera view appears and starts scanning.
  - [ ] Successfully scans a QR code and provides feedback via toast notification.
  - [ ] Manual entry works correctly.
- [ ] **Offline Mode:**
  - [ ] Disconnect from the internet.
  - [ ] Scan a QR code.
  - [ ] A toast indicates the scan was saved locally.
  - [ ] The offline indicator appears at the bottom of the screen.
  - [ ] Reconnect to the internet.
  - [ ] The app automatically syncs the offline scan.
  - [ ] A success toast confirms the sync.
- [ ] **Integrated Chat:**
  - [ ] Can open the chat panel from the scanner page.
  - [ ] Can send and receive messages with the supervisor.

## 5. Attendee Portal

- [ ] **Authentication:**
  - [ ] Login via magic link works correctly.
- [ ] **Dashboard (`/portal/dashboard`):**
  - [ ] Displays the attendee's virtual badge correctly.
  - [ ] Displays the attendee's personalized agenda in chronological order.
  - [ ] Agenda updates in real-time if a change is made by an organizer.
- [ ] **Notifications:**
  - [ ] Can enable/disable web push notifications.
  - [ ] Receives push notifications for session reminders (requires testing Edge Function).
- [ ] **Chat:**
  - [ ] Can open chat panel and communicate with a supervisor.

## 6. General
- [ ] **UI/UX:**
  - [ ] Dark/Light mode toggle works across the entire application.
  - [ ] Language switcher (EN/ES) translates all relevant UI text.
- [ ] **Responsiveness:**
  - [ ] The application is usable and looks good on mobile, tablet, and desktop screens.
  - [ ] Sidebar works correctly on mobile (opens/closes).
