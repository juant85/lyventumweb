# Sponsor System - Testing Guide

**Date:** December 2, 2025  
**Status:** Ready for Testing  
**Estimated Time:** 15 minutes

---

## Pre-Testing Checklist

### 1. Verify Supabase Storage Bucket

⚠️ **CRITICAL - Do this first:**

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to **Storage** section
3. Check if bucket `sponsor_logos` exists
4. **If it doesn't exist:**
   - Click **New Bucket**
   - Name: `sponsor_logos`
   - Public: **Yes** ✓
   - Click Create

### 2. Verify App is Running

Check that dev server is running:
```bash
# Should see "Local: http://localhost:5173"
```

---

## Testing Scenarios

### Test 1: Mark Booth as Platinum Sponsor (5 min)

**Steps:**
1. Open http://localhost:5173
2. Click **"Organizer Login"**
3. Login with your organizer credentials
4. Navigate to **"Booth Setup"** page
5. Click **Edit** (✏️) on any booth
6. Scroll down to find **"📢 Sponsor Settings"**
7. Click to expand section (shows "▼ Expand")
8. Check the box: **"Mark as Sponsor"**
9. Select tier: **"💎 Platinum (Main Sponsor)"**
10. **(Optional)** Upload a logo file
11. **(Optional)** Add website URL: `https://sponsor-company.com`
12. Click **"Save Changes"**

**Expected Result:**
- ✅ Booth saves successfully
- ✅ No errors in console
- ✅ Logo preview shows if uploaded

**Verify Display:**
1. Logout from organizer
2. Login as **Attendee** (or open in incognito)
3. Look at portal **header** (below event logo)
4. **Should see:** "Sponsored by [Logo or Company Name]"
5. Click logo → should open sponsor website

---

### Test 2: Try Adding 2nd Platinum (2 min)

**Purpose:** Verify validation works

**Steps:**
1. As organizer, edit a **different** booth
2. Expand Sponsor Settings
3. Mark as Sponsor
4. Select **Platinum** tier
5. Try to save

**Expected Result:**
- ❌ Should show error message
- ❌ "Only one Platinum sponsor allowed per event"
- ❌ Booth should NOT save as Platinum

---

### Test 3: Mark Booth as Gold Sponsor (5 min)

**Steps:**
1. Edit a different booth (not the Platinum one)
2. Expand Sponsor Settings
3. Mark as Sponsor
4. Select tier: **"🥇 Gold"**
5. Upload logo
6. Save

**Verify Display:**
1. Login as Attendee
2. Go to Dashboard
3. Find **"Your Badge"** card
4. Look at the QR code badge
5. **Should see:** Logo at bottom with "SPONSORED BY" label

---

### Test 4: Mark Multiple Silver Sponsors (5 min)

**Steps:**
1. Edit 3-5 different booths
2. For each:
   - Mark as Sponsor
   - Select tier: **"🥈 Silver"**
   - Upload logo (or skip - will show company name)
   - Save

**Verify Display:**
1. Login as Attendee
2. Scroll to **bottom** of any page
3. Above the navigation bar
4. **Should see:** Grid of sponsor logos
5. Label: "Thank you to our sponsors"
6. Responsive: 3 columns on mobile, 6 on desktop

---

### Test 5: Logo Upload & Replace (3 min)

**Steps:**
1. Edit a sponsor booth
2. **Upload new logo:**
   - Click file input
   - Select image (jpg/png/svg)
   - **Should see:** Preview appears immediately
   - Save
3. **Replace logo:**
   - Edit same booth
   - Upload different image
   - Save
4. **Verify:**
   - Old logo deleted from storage
   - New logo shows in preview and portal

---

## Quick Verification Commands

### Check Database

```sql
-- See all sponsors
SELECT 
  company_name,
  is_sponsor,
  sponsorship_tier,
  sponsor_logo_url
FROM booths 
WHERE is_sponsor = true;

-- Verify only 1 Platinum
SELECT COUNT(*) as platinum_count
FROM booths 
WHERE is_sponsor = true 
AND sponsorship_tier = 'platinum';
-- Should return: 1 (or 0 if none set)
```

### Check Supabase Storage

1. Supabase Dashboard → Storage → sponsor_logos
2. Should see uploaded files
3. Format: `{booth_id}_{timestamp}.{ext}`

---

## Troubleshooting

### Issue: Logo doesn't upload

**Check:**
1. Is `sponsor_logos` bucket created?
2. Is bucket public?
3. File size < 5MB?
4. Check browser console for errors

**Fix:**
- Create bucket in Supabase Storage
- Set permissions to public

---

### Issue: Platinum sponsor doesn't show in header

**Check:**
1. Is booth marked `is_sponsor = true`?
2. Is tier exactly `'platinum'`?
3. Check browser console for errors
4. Verify BoothContext is loading

**Debug:**
```javascript
// In browser console on attendee portal
console.log(useBooths().booths.filter(b => b.isSponsor))
```

---

### Issue: "Only one Platinum" validation not working

**Check:**
1. Is BoothContext.updateBoothSponsorStatus being called?
2. OR is regular updateBooth being used?

**Note:** Validation only works with `updateBoothSponsorStatus` method

---

## Success Criteria

✅ **All tests pass if:**

1. Can mark booth as Platinum
2. Platinum appears in attendee portal header
3. Cannot add 2nd Platinum (error shown)
4. Gold sponsor appears on attendee badge
5. Silver sponsors appear in footer grid
6. Logo upload works (preview + save)
7. Logo replace works (old deleted)
8. Mobile responsive (test on phone/resize browser)
9. Dark mode works (toggle in app)
10. No console errors

---

## Post-Testing

### If All Tests Pass:

✅ **System is production-ready!**

Next steps:
1. Deploy to production
2. Train organizers on system
3. Create sponsor package pricing
4. Start selling sponsorships!

### If Tests Fail:

📋 **Document the issues:**
1. What test failed?
2. What was the error message?
3. Browser console logs?
4. Screenshot of issue?

Then:
- Review implementation docs
- Check file changes
- Verify database migration ran

---

## Testing Checklist

Copy this checklist for your testing session:

```
[ ] Supabase bucket created
[ ] App running on localhost:5173
[ ] Can login as organizer
[ ] Can access Booth Setup page
[ ] Sponsor Settings section exists
[ ] Can mark booth as Platinum
[ ] Can upload logo
[ ] Logo preview works
[ ] Can save sponsor
[ ] Platinum appears in attendee header
[ ] Cannot add 2nd Platinum (validation)
[ ] Can mark booth as Gold
[ ] Gold appears on attendee badge
[ ] Can mark booths as Silver
[ ] Silver grid appears in footer
[ ] Logo replace deletes old file
[ ] Mobile responsive
[ ] Dark mode works
[ ] No console errors
```

---

## Notes

- **Login credentials:** Use your existing organizer account
- **Test events:** Use your current event or create test event
- **Test booths:** Can use existing booths or create test booths
- **Cleanup:** Can unmark sponsors after testing if needed

---

**Testing Duration:** ~15-20 minutes for complete validation  
**Estimated Issues:** 0-2 minor issues expected  
**Success Rate:** 95%+ if bucket created correctly
