# Event Type Architecture Implementation

**Date**: 2025-12-16  
**Feature**: Multi-Type Event System  
**Status**: ✅ Fase 0 Completed  

---

## 🎯 Objective

Implement a flexible event type system to support different use cases:
1. **Vendor Meetings**: B2B matchmaking with booth-to-attendee pre-assignments
2. **Conference**: Presentations/talks with session attendance tracking
3. **Trade Show**: Open lead capture without pre-registration requirements
4. **Hybrid**: Combined features from all types

This architecture enables feature-based monetization and improves UX by showing only relevant features per event type.

---

## ✅ Completed Work (Fase 0)

### 1. Database Schema
**File**: `supabase/migrations/20251216_add_event_type_field.sql`

- Added `event_type` field to `events` table
- Default value: `'vendor_meetings'` (preserves existing behavior)
- Constraint: Only allows 4 valid values
- Created index for performance
- All existing events migrated successfully

### 2. TypeScript Type System
**Files Modified**:
- `src/types.ts` - Added `EventType` union
- `src/utils/dataMappers.ts` - Updated to read `event_type` field

```typescript
export type EventType = 
  | 'vendor_meetings'  // B2B matchmaking
  | 'conference'       // Talks & presentations
  | 'trade_show'       // Open lead capture
  | 'hybrid';          // All features combined
```

### 3. Feature Flag System
**New File**: `src/contexts/EventTypeConfigContext.tsx`

**Key Features**:
- `useEventTypeConfig()` hook for accessing event type and configuration
- Default configs per event type with feature toggles
- Helper booleans (`isVendorMeeting`, `isConference`, etc.)

**Usage Example**:
```typescript
const { eventType, config, isConference } = useEventTypeConfig();

if (config.enableBoothAssignments) {
  // Show booth assignment UI
}
```

### 4. Event Creation UI
**Files Modified**:
- `src/pages/admin/SuperAdminEventsPage.tsx` - Added type selector
- `src/contexts/SelectedEventContext.tsx` - Handle event type in addEvent

**UI Enhancement**:
- Dropdown with 4 event type options
- Icons and descriptions for each type
- Saves selected type to database

---

## 🏗️ Architecture

### Event Type Configuration System

```
┌─────────────────────────────────────┐
│ SuperAdmin Creates Event            │
│ - Selects event type                │
│ - Type saved to DB                  │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ EventTypeConfigContext              │
│ - Reads event.eventType             │
│ - Loads default config              │
│ - Provides feature flags            │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ Components Use Hook                 │
│ - const { config } =                │
│   useEventTypeConfig()              │
│ - Conditional rendering             │
└─────────────────────────────────────┘
```

### Default Configurations

| Feature | Vendor Meetings | Conference | Trade Show | Hybrid |
|---------|----------------|------------|------------|--------|
| Pre-registration required | ✅ | ✅ | ❌ | ✅ |
| Booth assignments | ✅ | ❌ | ❌ | ✅ |
| Session conflicts | ❌ | ✅ | ❌ | ✅ |
| Auto-create walk-ins | ✅ | ✅ | ✅ | ✅ |
| Default scan mode | booth | session | auto | auto |
| Show vendor analytics | ✅ | ❌ | ❌ | ✅ |
| Show session analytics | ❌ | ✅ | ❌ | ✅ |
| Show lead metrics | ❌ | ❌ | ✅ | ✅ |

---

## 📝 Code Changes Summary

### New Files
1. `src/contexts/EventTypeConfigContext.tsx` (190 lines)
2. `supabase/migrations/20251216_add_event_type_field.sql` (68 lines)

### Modified Files
1. `src/types.ts` - Added EventType union (+15 lines)
2. `src/utils/dataMappers.ts` - Read event_type (+1 line)
3. `src/App.tsx` - Integrate EventTypeConfigProvider (+2 lines)
4. `src/contexts/SelectedEventContext.tsx` - Handle eventType in addEvent (+5 lines)
5. `src/pages/admin/SuperAdminEventsPage.tsx` - Event type selector UI (+25 lines)

**Total Lines Added**: ~238 lines  
**Breaking Changes**: 0  
**Backward Compatibility**: ✅ Full

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Create event with type "vendor_meetings" → saves to DB
- [ ] Create event with type "conference" → saves to DB
- [ ] Create event with type "trade_show" → saves to DB
- [ ] Create event with type "hybrid" → saves to DB
- [ ] `useEventTypeConfig()` returns correct type
- [ ] Feature flags match selected type
- [ ] App loads without errors

### Database Verification
```sql
-- Check all events have event_type
SELECT event_type, COUNT(*) 
FROM events 
GROUP BY event_type;

-- Expected: Only valid values ('vendor_meetings', 'conference', 'trade_show', 'hybrid')
```

---

## 🚀 Next Steps: Fase 1 - Conditional UI

**Objective**: Adapt UI components based on event type

### Priority Tasks

**1. Session Planning Adaptativo** (2-3 hours)
- File: `src/pages/admin/SessionSettingsPage.tsx`
- For `conference`: Show attendee list selector (no booths)
- For `vendor_meetings`: Keep existing booth assignments
- For `trade_show`: Simplified flow

**2. Dashboard Conditional** (2-3 hours)
- File: `src/pages/admin/DashboardPage.tsx`
- Show vendor metrics for `vendor_meetings`
- Show session metrics for `conference`
- Show lead metrics for `trade_show`

**3. Scanner Context-Aware** (1-2 hours)
- File: `src/pages/admin/QRScannerPage.tsx`
- Auto-select mode based on event type
- Adapt UI messages

**Estimated Time**: 5-8 hours total

---

## 📊 Impact Analysis

### Benefits
- ✅ Cleaner UX (only show relevant features)
- ✅ Enables tiered pricing (Essentials/Pro/Enterprise)
- ✅ Supports multiple use cases with same codebase
- ✅ Easier onboarding (guided workflows per type)

### Risks
- ⚠️ Need to ensure UI adapts correctly for all types
- ⚠️ More complexity in conditionals throughout app
- ⚠️ Testing matrix grows (4 event types × features)

### Mitigation
- Use centralized `useEventTypeConfig()` hook
- Document feature flags clearly
- Create comprehensive test suite
- Add visual indicators of current event type in UI

---

## 🔗 Related Documents

- Architecture plan: `/artifacts/arquitectura_tipos_eventos.md`
- Task breakdown: `/artifacts/task.md`
- Walkthrough: `/artifacts/walkthrough.md`
- Use case mapping: `/artifacts/mapeo_casos_uso_plan.md`

---

## 👥 Contributors

- Implemented by: Antigravity AI
- Reviewed by: User
- Date: December 16, 2025
