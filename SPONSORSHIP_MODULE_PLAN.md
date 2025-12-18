# Strategic Plan: The LyVenTum Event Sponsorship Module

This document outlines a strategic, phased plan to design and implement a flexible, tiered event sponsorship module. This feature will create significant new revenue streams by allowing event organizers to sell high-visibility digital real estate within the LyVenTum application to their event sponsors.

---

## The Vision: Tiered Sponsorship for Maximum Value

Instead of a one-size-fits-all approach, we will offer a tiered system (e.g., Platinum, Gold, Silver) that allows for different levels of visibility to be sold at different price points. This creates a flexible and highly profitable monetization engine.

### Tier 1: Platinum Sponsor (The Main Event Partner)
- **Exclusivity:** Only one Platinum sponsor per event.
- **Placement:** Maximum visibility across high-impact user touchpoints.
    - **Magic Link Email:** The sponsor's banner/logo is featured prominently in the transactional magic link email sent to attendees. This is a premium, high-value placement.
    - **Login & Pre-Event Pages:** The sponsor's logo is displayed on the Attendee Login and Event Selection pages, capturing attention before the user even enters the portal.
    - **Attendee Portal Header:** A "Sponsored by" banner is permanently visible in the header of the attendee's dashboard, ensuring constant brand exposure.
    - **Push Notifications (Future):** The sponsor's logo is included in the icon for all push notifications sent to attendees.

### Tier 2: Gold Sponsors (High-Visibility Partners)
- **Availability:** Multiple Gold sponsorship slots can be sold.
- **Placement:** High-traffic areas within the attendee portal.
    - **Virtual Badge:** A "Sponsored by" logo is added directly to the attendee's virtual badge. This is a very personal and persistent placement.
    - **Agenda Page:** A rotating banner featuring Gold sponsors is displayed at the top or bottom of the attendee's agenda page.

### Tier 3: Silver Sponsors (General Supporters)
- **Availability:** An unlimited number of entry-level slots.
- **Placement:** General visibility in a dedicated section.
    - **Portal Footer:** A "Thank You to Our Sponsors" section in the footer of the attendee portal, featuring a grid of Silver sponsor logos.

### Handling Sub-Sponsors (e.g., The Event Organizer's Company)
The event organizer's own company can be featured as a sponsor. This is elegantly integrated into the model as a premium option. For example, the **Platinum "Main Event Partner"** package can include co-branding the public event selection page, making the sponsor appear as a true partner of the event. This adds another high-value asset to the top-tier sponsorship package.

---

## Phased Implementation Plan

### **Phase 1: Database and Backend Foundation (COMPLETED)**
**Objective:** To create the database structure to store sponsor information.
1.  **New `sponsors` Table:** A new table has been added to store sponsor `name`, `logo_url`, `website_url`, and `sponsorship_level`.
2.  **Updated `events` Table:** A `main_sponsor_id` column has been added to the `events` table to easily identify the single Platinum sponsor for an event.
3.  **Updated Database Types:** The `src/database.types.ts` file has been updated to reflect these new schema changes, ensuring full type safety in the application.

### **Phase 2: Super Admin Configuration UI (Future)**
**Objective:** To build the interface for event organizers to manage their sponsors.
1.  **New "Sponsorship" Page:** Add a new "Sponsorship" link to the main navigation sidebar for organizers.
2.  **Sponsor CRUD Interface:** On this new page, organizers will be able to:
    - **Add/Edit Sponsors:** A form to enter sponsor details, upload their logo (to Supabase Storage), and assign a sponsorship level.
    - **Set Platinum Sponsor:** A special tool to designate one sponsor as the "Main Event Partner".

### **Phase 3: Frontend Component Integration (Future)**
**Objective:** To visually integrate the sponsor placements into the application.
1.  **`SponsorBanner` Component:** Create a reusable React component to display sponsor logos and links consistently.
2.  **Integrate Placements:** Add sponsor banners/logos to the Attendee Portal, Virtual Badge, and public login pages as defined by the tiers.

### **Phase 4: Advanced Integration (Future)**
**Objective:** To integrate sponsorship into transactional communications.
1.  **Magic Link Email Customization:** Modify the Supabase email template to dynamically inject the Platinum sponsor's banner.
2.  **Push Notification Integration:** Update the `meeting-reminder` Edge Function to include the sponsor's logo in the push notification payload.

This phased plan allows for the systematic build-out of a powerful and flexible monetization engine, enhancing the value of the LyVenTum platform for both organizers and sponsors.