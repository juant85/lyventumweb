# LyVenTum: Business & Monetization Strategy

This document outlines a strategic framework for packaging LyVentum's features into distinct subscription tiers. This approach allows for flexible pricing, targeted upselling, and a scalable business model.

---

## Tiered Plan Philosophy

The core idea is to bundle features into logical packages that provide increasing value. Each tier caters to a different level of event complexity and organizer needs.

- **Basic Plan:** For simple, small-scale events. Focuses on core setup and management.
- **Professional Plan:** For standard events that require more efficiency and data output.
- **Enterprise Plan:** For large, complex events demanding advanced automation, real-time control, and premium communication tools.

---

## Feature Breakdown by Tier

### 1. Reports & Analytics (The Value of Data)

- **Basic Plan:**
  - **No Access** to "Reports" or "Real-Time Analytics" pages.
  - Organizers can view data within the app but cannot export it.

- **Professional Plan:**
  - **Enables "Reports" page.**
  - **CSV Export:** Full export capabilities for Scans, Attendee Activity, etc.
  - **Basic PDF Reports:** Generation of standard reports (e.g., individual booth reports).

- **Enterprise Plan:**
  - **Enables "Real-Time Analytics" page** with all its interactive graphs.
  - **Advanced PDF Reports:** Future capability to add custom branding/logos (white-labeling).

### 2. Import & Automation (The Value of Time)

- **Basic Plan:**
  - **Manual Configuration Only:** Organizers must add all sessions and booths through the UI.

- **Professional Plan:**
  - **Attendee CSV Import:** Enables the `AttendeeRegistrationPage` for bulk registration of attendees into sessions. A significant time-saver.

- **Enterprise Plan:**
  - **Master Excel Import:** Enables the powerful master import tool. Configure the entire event (sessions, booths, registrations) from a single Excel file. This is a primary driver for upgrading.

### 3. Live Visualization & Control (The Value of Real-Time Operations)

- **Basic Plan:**
  - Access to the main `Dashboard` page only.

- **Professional Plan:**
  - **Full access to `DataVisualizationPage`:** View the live status grid of all booths.

- **Enterprise Plan:**
  - **Enables "Attendee Locator":** A powerful live operations tool to find specific attendees who are expected but not yet checked in at their assigned booths.

### 4. Communication & Engagement (The Value of Connection)

- **Basic Plan:**
  - **No Communication Features:** The attendee portal is purely informational (agenda view). No chat or alerts.

- **Professional Plan:**
  - **One-Way Alerts (`feature_attendee_alerts`):**
    - Organizers can send broadcast notifications (push/email) to all or groups of attendees.
    - Example: "The keynote has been delayed by 15 minutes."
    - The attendee is a passive recipient.

- **Enterprise Plan:**
  - **Two-Way Interactive Chat (`feature_attendee_chat`):**
    - **Attendees** can initiate chats with their assigned booths during an active session via the portal.
    - **Booths** can chat with attendees scheduled for meetings via the scanner interface.
    - **Supervisors** can monitor and moderate all conversations from the main dashboard.
    - This is a premium, high-value feature justifying the top-tier plan.

### 5. On-Site Operations & Enhancements

- **Basic Plan:**
  - Standard Check-in Desk functionality.
  - Manual data entry.

- **Professional Plan:**
  - **Check-in Photo Capture (`feature_check_in_photo`):** Enables staff to take attendee photos with a camera directly from the Check-in Desk and Profile pages for enhanced identification.

- **Enterprise Plan:**
  - Includes all Professional features.
  - (Future) Advanced on-site features like NFC/RFID integration.
