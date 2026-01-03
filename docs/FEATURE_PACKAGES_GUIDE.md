# LyVenTum Feature Packages - Commercial Guide
**Version:** 1.0  
**Last Updated:** 2026-01-03

---

## Overview

LyVenTum offers **9 Feature Packages** that can be combined into subscription plans. Each package contains a set of related features designed for specific event management needs.

---

## 📦 Feature Packages

### 1. Booth Management Suite
**Icon:** 🏪  |  **Color:** Blue

| Feature | Description |
|---------|-------------|
| Booth Setup | Create and configure exhibition booths |
| Booth Map | Visual floor plan with interactive positioning |
| QR Scanner | Scan attendee badges at booths |
| Booth Profiles | Company information and contact details |

**Ideal for:** Trade shows, exhibitions, vendor fairs

---

### 2. Session & Conference Tools
**Icon:** 📅  |  **Color:** Purple

| Feature | Description |
|---------|-------------|
| Session Settings | Configure session types and durations |
| Tracks Settings | Multi-track event organization |
| Speaker Management | Speaker profiles and assignments |
| Agenda Builder | Session scheduling and conflict detection |

**Ideal for:** Conferences, seminars, multi-day events

---

### 3. Lead Capture Pro
**Icon:** 📄  |  **Color:** Green

| Feature | Description |
|---------|-------------|
| Lead Forms | Custom data collection forms |
| Note Taking | Add notes to attendee interactions |
| Lead Export | Export leads to CSV/Excel |
| Lead Scoring | Qualify and prioritize leads |

**Ideal for:** Sales teams, exhibitors, sponsors

---

### 4. Analytics & Reporting
**Icon:** 📊  |  **Color:** Orange

| Feature | Description |
|---------|-------------|
| Dashboard | Overview of key metrics |
| Real-Time Analytics | Live attendance tracking |
| Data Visualization | Charts and graphs |
| Custom Reports | Exportable PDF reports |

**Ideal for:** Event organizers requiring ROI metrics

---

### 5. Attendee Portal Standard
**Icon:** 👤  |  **Color:** Cyan

| Feature | Description |
|---------|-------------|
| Attendee Portal | Self-service attendee dashboard |
| Daily Agenda Email | Personalized daily schedules |
| Calendar Sync | Export to Google/Outlook calendars |
| Attendee Journey | View personal event history |

**Ideal for:** Attendee-focused events, conferences

---

### 6. Gamification & Engagement
**Icon:** 🏆  |  **Color:** Yellow

| Feature | Description |
|---------|-------------|
| Achievement System | Unlock badges for activities |
| Leaderboard | Competitive ranking display |
| Booth Challenge | Scavenger hunt functionality |
| Point System | Reward engagement with points |

**Ideal for:** Trade shows wanting high engagement

---

### 7. Live Operations
**Icon:** 📱  |  **Color:** Red

| Feature | Description |
|---------|-------------|
| Real-Time Scanning | Instant check-in validation |
| Attendee Locator | Find attendees in real-time |
| Alert System | Push notifications to staff |
| Capacity Monitoring | Live occupancy tracking |

**Ideal for:** Large-scale events, security-focused venues

---

### 8. Communication Tools
**Icon:** 📧  |  **Color:** Indigo

| Feature | Description |
|---------|-------------|
| Email Communications | Send bulk event emails |
| Session Reminders | Automated reminder notifications |
| Attendee Chat | In-app messaging |
| Attendee Alerts | Push notifications to attendees |

**Ideal for:** Events requiring active communication

---

### 9. Sponsorship Management
**Icon:** ⭐  |  **Color:** Pink

| Feature | Description |
|---------|-------------|
| Sponsor Profiles | Dedicated sponsor pages |
| Sponsor Analytics | Engagement metrics for sponsors |
| Branding Options | Custom sponsor visibility |
| Sponsor Leads | Lead collection for sponsors |

**Ideal for:** Events with sponsor partnerships

---

## 💰 Suggested Plan Structure

| Plan | Packages Included | Price Range |
|------|-------------------|-------------|
| **Free Trial** | Basic Dashboard only | $0 |
| **Starter** | Booth Management + Session Tools | $99/event |
| **Professional** | + Analytics + Attendee Portal + Communication | $299/event |
| **Enterprise** | All 9 packages | Custom pricing |

---

## 🔧 Technical Configuration

### Database Tables

```
plans              → Subscription plans (Free, Pro, Enterprise)
feature_packages   → The 9 packages with features[] array
plan_packages      → M:N relationship (which plan has which packages)
events             → event.plan_id references plans.id
```

### UI Paths

| Page | URL | Description |
|------|-----|-------------|
| Plan Management | `/superadmin/plans` | Admin creates/edits plans |
| Features View | `/features` | User sees their plan's packages |
| Event Wizard | `/my-events` → Create | User selects plan when creating event |

---

## 💡 Use Cases

### Trade Show (All Features)
- Booth Management Suite ✅
- Lead Capture Pro ✅
- Gamification ✅
- Analytics ✅

### Corporate Conference
- Session & Conference Tools ✅
- Attendee Portal ✅
- Communication Tools ✅
- Analytics ✅

### Small Networking Event
- Booth Management Suite ✅
- Live Operations ✅
- Communication Tools ✅

---

## 📋 Implementation Checklist

- [x] 9 feature packages defined in database
- [x] SuperAdmin page to manage plans and packages
- [x] Event wizard includes plan selection
- [x] Feature gating via useFeatureAccess hook
- [x] Features page shows active packages
- [ ] Stripe/billing integration (future)
- [ ] Self-service plan upgrade (future)

---

*This document serves as the commercial reference for LyVenTum feature packaging.*
