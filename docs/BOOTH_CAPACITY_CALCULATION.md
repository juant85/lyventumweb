# Booth Capacity Calculation - Technical Documentation

## Overview
This document explains how booth capacity numbers (attendee counts) are calculated and displayed in the Data Visualization page, specifically how vendor staff are excluded from capacity counts.

## Problem Statement
Booths display capacity as `X/Y` where:
- **X** = Current attendees who have scanned in
- **Y** = **Total expected regular attendees** (excluding vendor staff)

The original implementation incorrectly included vendor staff in the capacity count (Y), making it impossible to see actual customer capacity.

## Solution Architecture

### Core Principle
**Calculate capacity where it's displayed, not where it's imported.**

Instead of pre-calculating and storing capacity during the Master Import process, we query the database in real-time when rendering the Data Visualization page.

### Implementation

#### Hook: `useBoothCapacity.ts`
Location: `/src/hooks/useBoothCapacity.ts`

**Purpose**: Fetch real-time booth capacity by counting non-vendor registrations.

**Query Logic**:
```typescript
const { data } = await supabase
  .from('session_registrations')
  .select('expected_booth_id, attendees!inner(is_vendor)')
  .eq('session_id', sessionId)
  .eq('attendees.is_vendor', false)  // CRITICAL: Excludes vendors
  .not('expected_booth_id', 'is', null);
```

**How it works**:
1. Queries `session_registrations` for a specific session
2. Joins with `attendees` table to access `is_vendor` field
3. Filters to only include records where `is_vendor = false`
4. Groups results by `expected_booth_id` to count per booth
5. Returns a map: `{ "sessionId|boothId": count }`

**Returns**:
- `getCapacity(boothId)`: Function to get capacity for a specific booth
- `loading`: Boolean indicating if data is being fetched
- `capacityMap`: Raw map of all capacities (for debugging)

#### Integration: `DataVisualizationPage.tsx`

**Usage**:
```typescript
const { getCapacity: getBoothCapacity } = useBoothCapacity(selectedSession?.id || null);

// Later in boothsData calculation:
const capacity = getBoothCapacity(setting.boothId);
```

**Why it works**:
- Hook re-runs automatically when `selectedSession` changes
- Always reflects current database state
- No race conditions with import process
- Simple, predictable, testable

## Design Decisions

### Why NOT calculate during import?
**Attempted Approach**: Calculate capacity during Master Import and store in `session_booth_capacities` table.

**Problems**:
1. **Race Conditions**: Import creates booths/sessions asynchronously; capacity calculation ran before data was committed to DB
2. **Complexity**: Required complex vendor detection logic during import
3. **Stale Data**: Pre-calculated values could become outdated if data changed
4. **Maintenance**: Hard to debug when calculations were wrong

### Why real-time calculation wins?
1. **Always Accurate**: Reads current state from database
2. **Simple**: Single query, clear logic
3. **Maintainable**: Easy to understand and modify
4. **Reliable**: No timing issues or race conditions
5. **Performant**: Query is fast, runs only when needed

## Vendor Detection

**Primary Field**: `attendees.is_vendor` (boolean)

The Excel parser (`excelParser.ts`) sets this field during import by:
1. Checking if attendee's organization matches booth's company name
2. Flagging as vendor if they match

**DB Schema**:
- `attendees` table has `is_vendor` column
- `session_registrations` links to `attendees` via `attendee_id`

## Data Flow

```
Master Import (Excel)
    ↓
Parse attendees → Set is_vendor flag
    ↓
Insert into attendees table
    ↓
Insert into session_registrations table
    ↓
[Later, when viewing Data Visualization]
    ↓
useBoothCapacity hook queries DB
    ↓
Filters is_vendor = false
    ↓
Counts per booth
    ↓
Displays on booth cards
```

## Testing

### Manual Testing
1. Import Excel with mix of vendors and regular attendees
2. Navigate to Data Visualization
3. Check booth cards show correct capacity (excluding vendors)
4. Verify modal shows all attendees (including vendors) when clicked

### What to Verify
- Capacity denominator (Y) excludes vendor staff
- Vendor staff still appear in attendee detail modal
- Numbers update correctly after re-import

## Troubleshooting

### Issue: Capacity shows 0/0
**Check**:
1. Console logs: `[useBoothCapacity] Query returned X registrations`
2. Verify `session_registrations` has data for the session
3. Check that `expected_booth_id` is not null
4. Verify join with `attendees` table is working

### Issue: Vendors still counted
**Check**:
1. Verify `attendees.is_vendor` field is set correctly
2. Review Excel parser logic in `excelParser.ts`
3. Check database: `SELECT * FROM attendees WHERE is_vendor = true`

## Future Improvements

### Performance Optimization
If the app scales to thousands of registrations:
- Consider caching capacity results in React Query
- Add database index on `(session_id, expected_booth_id, is_vendor)`

### Alternative Approaches
- **Materialized View**: Pre-calculate as a DB view that updates automatically
- **Realtime Subscriptions**: Use Supabase realtime to update capacities live

## Related Files
- `/src/hooks/useBoothCapacity.ts` - Core hook implementation
- `/src/pages/admin/DataVisualizationPage.tsx` - Integration point
- `/src/utils/excelParser.ts` - Sets is_vendor flag during import
- `/src/contexts/EventDataContext.tsx` - Overall data management

## Questions?
If you need to modify capacity calculation logic:
1. Start at `useBoothCapacity.ts`
2. The SQL query is the single source of truth
3. Test with real data that includes vendors
4. Check console logs to debug

---
**Last Updated**: December 8, 2024  
**Author**: AI Assistant (via discussion with development team)
