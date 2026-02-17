# Phase 5: Testing & QA Checklist

**Status:** Ready to execute
**Estimated Duration:** 2-3 hours
**Goal:** Ensure Our Family Nest is production-ready with no critical bugs

---

## 🎯 Testing Overview

This checklist covers:
1. **Functional Testing** - Core features work as expected
2. **Phase 2 CRO Testing** - New landing page components render correctly
3. **Phase 3 Email Testing** - Drip campaigns send properly
4. **Phase 4 AI Testing** - Transcription, parsing, prompts work
5. **Cross-Browser Testing** - Works on all major browsers
6. **Mobile Responsiveness** - Perfect on phones/tablets
7. **Security Testing** - RLS policies protect data
8. **Performance Testing** - Fast load times

---

## ✅ Phase 2: Landing Page & CRO Testing

### Homepage Components

- [ ] **Testimonials Section**
  - [ ] Displays 3 testimonial cards
  - [ ] Responsive grid (3 cols → 2 cols → 1 col on mobile)
  - [ ] Text is readable and properly styled
  - [ ] Section appears after AdditionalFeatures

- [ ] **Homepage FAQ**
  - [ ] All 5 questions visible
  - [ ] Accordion opens/closes on click
  - [ ] ChevronDown icon rotates correctly
  - [ ] Border and spacing looks clean
  - [ ] Questions:
    - [ ] "Is my family's data private?"
    - [ ] "What happens if I stop paying?"
    - [ ] "Can my 80-year-old grandma actually use this?"
    - [ ] "How is this different from Google Photos or iCloud?"
    - [ ] "Can I import my existing photos?"

- [ ] **Hero Section Trust Signal**
  - [ ] "✨ Join 500+ families..." text appears below CTA
  - [ ] Text is muted color and readable
  - [ ] Doesn't break layout on mobile

- [ ] **Emotional Section Trust Badges**
  - [ ] 4 badges display above differentiators
  - [ ] Icons render correctly (Lock, Shield, Database, Globe)
  - [ ] Text: "Bank-level encryption", "Privacy-first design", "Own your data", "US-based secure servers"
  - [ ] Flexbox wraps properly on mobile

- [ ] **Landing Page Order (Critical)**
  - [ ] 1. HeroSection
  - [ ] 2. FamilyMosaic
  - [ ] 3. FeaturesBento
  - [ ] 4. AdditionalFeatures
  - [ ] 5. Testimonials ← NEW
  - [ ] 6. EmotionalSection (with trust badges)
  - [ ] 7. HomepageFAQ ← NEW
  - [ ] 8. PricingCards
  - [ ] 9. FinalCTA

### Pricing Page

- [ ] **Annual Plan (The Full Nest)**
  - [ ] Badge shows "Most Popular" (not on Free plan)
  - [ ] Price: "$49 /year"
  - [ ] Breakdown: "Just $4.08/month or 13¢/day" appears below price
  - [ ] Breakdown text is subtle muted color

- [ ] **Legacy Plan (The Legacy)**
  - [ ] Badge shows "Best Value" (not "Recommended")
  - [ ] Price: "$349 one-time"
  - [ ] Breakdown: "Just $7/year over 50 years — true lifetime value"
  - [ ] Card is highlighted (border + shadow + scale)

- [ ] **Pricing FAQ**
  - [ ] "Which plan is right for me?" is FIRST question
  - [ ] Answer guides Free → Annual → Legacy
  - [ ] 4 total FAQs display
  - [ ] All FAQs styled consistently

---

## ✅ Phase 3: Email & Onboarding Testing

### Welcome Email (Immediate)

- [ ] **Trigger Test**
  - [ ] Sign up with new test account
  - [ ] Welcome email arrives within 60 seconds
  - [ ] Email subject: "Welcome to Our Family Nest! 🏡"
  - [ ] From: "Our Family Nest <notifications@...>"

- [ ] **Email Content**
  - [ ] Personalized with user's name
  - [ ] 3 steps checklist visible
  - [ ] "Upload Your First Photo" CTA button works
  - [ ] Footer includes "Our Family Nest" branding
  - [ ] No broken images or formatting issues

- [ ] **Email Rendering** (Test in 3 clients)
  - [ ] Gmail (desktop)
  - [ ] Outlook (desktop)
  - [ ] Apple Mail (iOS or macOS)

### Drip Campaign (Days 1, 3, 5, 14, 30)

**Note:** Test by backdating `created_at` in database or manually triggering cron

- [ ] **Day 1 Activation Email**
  - [ ] Sends to families with 0 photos after 24 hours
  - [ ] Subject references "first photo"
  - [ ] CTA links to `/dashboard/photos`
  - [ ] Tracks in `email_campaigns` table

- [ ] **Day 3 Feature Discovery**
  - [ ] Sends to low-engagement families
  - [ ] Highlights underutilized features
  - [ ] CTA links work

- [ ] **Day 5 Invite Encouragement**
  - [ ] Sends to single-member families
  - [ ] Encourages inviting family members

- [ ] **Day 14 Upgrade Prompt**
  - [ ] Sends to Free tier approaching limits
  - [ ] Shows pricing breakdown

- [ ] **Day 30 Re-engagement**
  - [ ] Sends to dormant users
  - [ ] Gentle reminder CTA

### Onboarding Flow

- [ ] **Welcome Modal**
  - [ ] Appears on first login
  - [ ] Can be dismissed
  - [ ] Progress indicator shows 1/3, 2/3, 3/3

- [ ] **Onboarding Checklist**
  - [ ] Shows 5 steps
  - [ ] Progress bar updates as steps complete
  - [ ] Confetti animation on 100% completion
  - [ ] Checklist hides after all steps done

- [ ] **Empty States**
  - [ ] Dashboard shows "Get Started" cards when empty
  - [ ] Activity feed has "Upload Your First Photo" CTA
  - [ ] CTAs link to correct pages

---

## ✅ Phase 4: AI Features Testing

### Voice Memo Transcription (Whisper API)

- [ ] **Upload & Transcribe**
  - [ ] Upload 30-second voice memo
  - [ ] Status shows "processing" immediately
  - [ ] Transcript appears within 30 seconds
  - [ ] Transcript text is accurate
  - [ ] "Copy" button copies to clipboard

- [ ] **Long Audio**
  - [ ] Upload 5-minute voice memo
  - [ ] Transcription still completes successfully
  - [ ] No timeout errors

- [ ] **Failed Transcription**
  - [ ] Upload corrupted/invalid file
  - [ ] Status shows "failed" gracefully
  - [ ] Original audio still playable

- [ ] **Search Integration**
  - [ ] Search for word in transcript
  - [ ] Voice memo appears in global search results
  - [ ] Search highlights matched text

### Recipe URL Parsing (GPT-4o-mini)

- [ ] **URL Import**
  - [ ] Test NYT Cooking URL: https://cooking.nytimes.com/recipes/...
  - [ ] Test AllRecipes URL
  - [ ] Test Food Network URL
  - [ ] All fields pre-fill (title, ingredients, instructions, servings, times)

- [ ] **Editing Parsed Data**
  - [ ] Can edit pre-filled fields before saving
  - [ ] Save works correctly
  - [ ] Recipe displays properly after save

- [ ] **Error Handling**
  - [ ] Invalid URL shows error message
  - [ ] Non-recipe URL handles gracefully
  - [ ] User can still manually enter recipe if parsing fails

### Journal Writing Prompts (GPT-4o-mini)

- [ ] **Prompt Generation**
  - [ ] Fill in location: "Paris"
  - [ ] Click "Get Writing Ideas"
  - [ ] 3 prompts appear within 2 seconds
  - [ ] Prompts are relevant to location

- [ ] **Prompt Insertion**
  - [ ] Click on prompt
  - [ ] Text inserts into editor with trailing space
  - [ ] Can continue writing after insertion

- [ ] **Contextual Prompts**
  - [ ] Add date + location → prompts reference timing
  - [ ] Add members + location → prompts mention people
  - [ ] Minimal context (just location) still works

### Rate Limiting

- [ ] **Daily Limit**
  - [ ] Make 10 AI calls (any combination)
  - [ ] All 10 succeed
  - [ ] 11th call shows error: "Daily AI limit reached (10 per day). Try again tomorrow!"
  - [ ] Error is user-friendly, not technical

- [ ] **Cost Monitoring**
  - [ ] Check OpenAI usage dashboard
  - [ ] Verify costs: ~$0.006/min for transcription, ~$0.01 for recipe, ~$0.002 for prompts
  - [ ] No unexpected spike in API calls

---

## ✅ Core Functionality Testing

### Authentication & Authorization

- [ ] **Signup**
  - [ ] Can create account with email
  - [ ] Email verification sent (if enabled)
  - [ ] Redirects to dashboard after signup
  - [ ] Welcome email sent

- [ ] **Login**
  - [ ] Can log in with correct credentials
  - [ ] Wrong password shows error
  - [ ] "Forgot password" flow works

- [ ] **Password Reset**
  - [ ] Request reset link
  - [ ] Email arrives with reset link
  - [ ] Can set new password
  - [ ] Can log in with new password

- [ ] **Logout**
  - [ ] Logout button works
  - [ ] Redirects to login page
  - [ ] Cannot access dashboard after logout

### Family Management

- [ ] **Create Family**
  - [ ] New user creates family on signup
  - [ ] Family name is editable

- [ ] **Invite Members**
  - [ ] Send invite via email
  - [ ] Invite link works
  - [ ] Invited user can join family
  - [ ] Shows in "Our Family" list

- [ ] **Roles & Permissions**
  - [ ] Owner can edit everything
  - [ ] Adult can add content
  - [ ] Teen has limited access
  - [ ] Kid has view-only access

### Journal

- [ ] **Create Entry**
  - [ ] New journal entry form loads
  - [ ] Can add title, content, location, date
  - [ ] Can select family members
  - [ ] Can upload photo
  - [ ] Save works, redirects to journal list

- [ ] **Edit Entry**
  - [ ] Can edit existing entry
  - [ ] Changes save correctly

- [ ] **Delete Entry**
  - [ ] Delete confirmation shows
  - [ ] Entry removed from list

### Photos

- [ ] **Upload Photos**
  - [ ] Single photo upload works
  - [ ] Multiple photo upload works
  - [ ] Progress indicator shows during upload
  - [ ] Photos appear in gallery

- [ ] **Photo Display**
  - [ ] Grid layout responsive
  - [ ] Click photo opens lightbox
  - [ ] Navigation arrows work in lightbox

- [ ] **Delete Photo**
  - [ ] Confirmation shows
  - [ ] Photo removed from storage
  - [ ] Photo removed from display

### Voice Memos (Non-AI)

- [ ] **Record Memo**
  - [ ] Microphone permission requested
  - [ ] Recording indicator shows
  - [ ] Can stop recording
  - [ ] Audio file saves

- [ ] **Play Memo**
  - [ ] Audio player controls work
  - [ ] Play/pause works
  - [ ] Volume control works

### Recipes

- [ ] **Add Recipe (Manual)**
  - [ ] Form fields all work
  - [ ] Can add multiple ingredients (array)
  - [ ] Can add multiple steps (array)
  - [ ] Save works

- [ ] **View Recipe**
  - [ ] Recipe displays nicely
  - [ ] All fields visible

### Family Tree

- [ ] **Add Member**
  - [ ] Can add new family member
  - [ ] Can set relationships (parent, child, sibling)
  - [ ] Tree diagram updates

- [ ] **Edit Member**
  - [ ] Can edit member details
  - [ ] Changes reflect in tree

### Search

- [ ] **Global Search**
  - [ ] Search finds journals by title/content
  - [ ] Search finds photos by metadata
  - [ ] Search finds recipes by name
  - [ ] Search finds voice memos by transcript (if Phase 4 done)
  - [ ] Results link to correct pages

### Messages

- [ ] **Send Message**
  - [ ] Can compose message
  - [ ] Can select recipient(s)
  - [ ] Send works

- [ ] **Receive Message**
  - [ ] Notification shows (if enabled)
  - [ ] Message appears in inbox
  - [ ] Can reply

---

## ✅ Cross-Browser Testing

Test in these browsers (priority order):

### Desktop

- [ ] **Chrome** (latest)
  - [ ] Landing page renders
  - [ ] Dashboard works
  - [ ] All features functional

- [ ] **Safari** (macOS)
  - [ ] Same as Chrome
  - [ ] Check for Safari-specific CSS issues

- [ ] **Firefox** (latest)
  - [ ] Same as Chrome

- [ ] **Edge** (latest)
  - [ ] Same as Chrome

### Mobile

- [ ] **Chrome Mobile** (Android)
  - [ ] Landing page responsive
  - [ ] Dashboard usable
  - [ ] Forms work with touch

- [ ] **Safari Mobile** (iOS)
  - [ ] Same as Chrome Mobile
  - [ ] Check iOS-specific issues

---

## ✅ Mobile Responsiveness

### Breakpoints to Test

- [ ] **Mobile (375px - iPhone SE)**
  - [ ] Landing page: all sections stack vertically
  - [ ] Testimonials: 1 column
  - [ ] FAQ: accordion works with touch
  - [ ] Pricing: cards stack vertically
  - [ ] Hero CTA: full width on mobile
  - [ ] Trust badges: wrap properly

- [ ] **Tablet (768px - iPad)**
  - [ ] Testimonials: 2 columns
  - [ ] Pricing: 2-3 columns
  - [ ] Navigation: hamburger menu (if applicable)

- [ ] **Desktop (1440px)**
  - [ ] All components use max-width (no ultra-wide stretch)
  - [ ] Content centered
  - [ ] Testimonials: 3 columns

### Touch Interactions

- [ ] **FAQ Accordion**
  - [ ] Tap opens/closes smoothly
  - [ ] No delay or jank

- [ ] **Buttons**
  - [ ] All buttons have proper touch targets (min 44x44px)
  - [ ] No accidental clicks on adjacent buttons

- [ ] **Forms**
  - [ ] Input fields focus correctly
  - [ ] Virtual keyboard doesn't hide submit button
  - [ ] Date pickers work on mobile

---

## ✅ Performance Testing

### Lighthouse Scores (Desktop)

Run: Chrome DevTools → Lighthouse → Desktop

- [ ] **Performance:** 90+ (green)
- [ ] **Accessibility:** 95+ (green)
- [ ] **Best Practices:** 95+ (green)
- [ ] **SEO:** 95+ (green)

### Lighthouse Scores (Mobile)

Run: Chrome DevTools → Lighthouse → Mobile

- [ ] **Performance:** 85+ (green/yellow)
- [ ] **Accessibility:** 95+ (green)
- [ ] **Best Practices:** 95+ (green)
- [ ] **SEO:** 95+ (green)

### Page Load Times

Test with "Slow 3G" throttling in DevTools:

- [ ] **Landing Page:** <3 seconds to interactive
- [ ] **Dashboard:** <4 seconds to interactive
- [ ] **Photos Page:** <5 seconds to interactive

### Image Optimization

- [ ] **Hero Image:** Uses optimized format (WebP with fallback)
- [ ] **Photo Gallery:** Lazy loads images below fold
- [ ] **Thumbnails:** Properly sized (not full-res scaled down)

---

## ✅ Security Testing

### Row Level Security (RLS)

**Test by logging in as different users:**

- [ ] **User A cannot see User B's family data**
  - [ ] Create 2 test accounts
  - [ ] User A creates journal entry
  - [ ] Log in as User B
  - [ ] User B should NOT see User A's journal

- [ ] **User can only edit their own content**
  - [ ] Try to edit another user's journal via URL manipulation
  - [ ] Should get permission denied

- [ ] **Family members can see shared content**
  - [ ] User A invites User B to family
  - [ ] User B should see family's journals, photos, etc.

### Authentication Edge Cases

- [ ] **Expired Session**
  - [ ] Leave browser open for 24+ hours
  - [ ] Try to use app → should redirect to login

- [ ] **Direct URL Access**
  - [ ] Log out
  - [ ] Try to visit `/dashboard` directly
  - [ ] Should redirect to `/login`

### API Endpoints

- [ ] **Protected Routes**
  - [ ] Try to access API endpoints without auth
  - [ ] Should return 401 Unauthorized

- [ ] **Rate Limiting**
  - [ ] AI endpoints limit to 10/day per family (tested above)
  - [ ] Email endpoints protected from spam

---

## ✅ Error Handling

### Network Errors

- [ ] **Offline Mode**
  - [ ] Turn off internet
  - [ ] Try to save journal
  - [ ] Shows user-friendly error (not technical stack trace)

- [ ] **Slow Connection**
  - [ ] Throttle to "Slow 3G"
  - [ ] Loading indicators show during requests
  - [ ] No silent failures

### Form Validation

- [ ] **Required Fields**
  - [ ] Leave required field empty
  - [ ] Submit form
  - [ ] Error message shows next to field

- [ ] **Invalid Email**
  - [ ] Enter malformed email
  - [ ] Submit
  - [ ] "Invalid email" error shows

### File Upload Errors

- [ ] **File Too Large**
  - [ ] Try to upload 100 MB photo (over limit)
  - [ ] Error: "File size exceeds limit"

- [ ] **Unsupported Format**
  - [ ] Try to upload .exe file
  - [ ] Error: "Unsupported file type"

---

## ✅ Accessibility (a11y)

### Keyboard Navigation

- [ ] **Tab Through Landing Page**
  - [ ] Can tab to all interactive elements
  - [ ] Focus indicator visible
  - [ ] Logical tab order

- [ ] **FAQ Accordion**
  - [ ] Can open/close with keyboard (Enter/Space)
  - [ ] Focus moves to expanded content

- [ ] **Forms**
  - [ ] Can tab through all fields
  - [ ] Can submit with Enter key

### Screen Reader Testing

Use NVDA (Windows) or VoiceOver (Mac):

- [ ] **Hero Section**
  - [ ] Heading announced correctly
  - [ ] CTA button has clear label

- [ ] **Testimonials**
  - [ ] Each testimonial is readable
  - [ ] Author names announced

- [ ] **FAQ**
  - [ ] Questions are proper headings
  - [ ] Expanded/collapsed state announced

### Color Contrast

Use Chrome DevTools → Lighthouse → Accessibility:

- [ ] **Text on Background:** 4.5:1 ratio minimum
- [ ] **Interactive Elements:** Clear focus states
- [ ] **Error Messages:** Not color-only (use icons + text)

---

## ✅ Edge Cases

### Data Limits

- [ ] **Free Tier Storage Limit**
  - [ ] Upload photos until 500 MB reached
  - [ ] Error: "Storage limit reached. Upgrade to continue."
  - [ ] CTA links to pricing page

- [ ] **Free Tier Journal Limit**
  - [ ] Create 10 journal entries
  - [ ] 11th entry blocked
  - [ ] Upgrade prompt shows

### Empty States

- [ ] **No Search Results**
  - [ ] Search for gibberish
  - [ ] Shows "No results found" with helpful message

- [ ] **No Family Members Yet**
  - [ ] New account with 1 user
  - [ ] Shows "Invite family members" CTA

### Long Content

- [ ] **Long Journal Entry**
  - [ ] Create 5000-word journal entry
  - [ ] Saves successfully
  - [ ] Displays without breaking layout

- [ ] **Many Photos**
  - [ ] Upload 100+ photos
  - [ ] Gallery paginated or lazy loads
  - [ ] No performance degradation

---

## 🐛 Bug Tracking Template

If you find bugs, use this format:

```markdown
### Bug: [Short Description]

**Severity:** Critical / High / Medium / Low
**Found In:** [Page/Feature]
**Browser:** [Chrome/Safari/etc.]
**Steps to Reproduce:**
1. Go to...
2. Click...
3. Observe...

**Expected:** ...
**Actual:** ...
**Screenshots:** [if applicable]
```

---

## 📊 Testing Report Template

After completing checklist, fill this out:

```markdown
# Phase 5 Testing Report

**Date:** [Today's date]
**Tester:** [Your name]
**Total Tests:** [Number of checkboxes]
**Passed:** [Count]
**Failed:** [Count]
**Critical Bugs:** [Count]

## Summary

[Overall assessment - is the app production-ready?]

## Phase 2 (Landing Page CRO)
- Status: ✅ / ⚠️ / ❌
- Notes: [Any issues found]

## Phase 3 (Email & Onboarding)
- Status: ✅ / ⚠️ / ❌
- Notes: [Any issues found]

## Phase 4 (AI Features)
- Status: ✅ / ⚠️ / ❌
- Notes: [Any issues found]

## Critical Issues Found

[List any showstoppers that must be fixed before launch]

## Minor Issues Found

[List nice-to-fix items that can wait]

## Recommendations

[Next steps based on testing results]
```

---

## 🚀 Post-Testing Actions

After completing all tests:

1. **Fix Critical Bugs** - Block launch until resolved
2. **Document Known Issues** - Create GitHub issues for minor bugs
3. **Update Docs** - Note any workarounds or limitations
4. **Notify Stakeholders** - Share testing report
5. **Schedule Launch** - If all critical tests pass

---

**Good luck with testing!** 🧪

Remember: It's better to find bugs now than after users do. Be thorough!
