# MVP Launch Checklist — Family Nest

Use this before inviting family to test.

---

## Mobile testing (phone)

- [ ] **Photo upload:** Select from camera roll → upload → appears in gallery; caption/location work.
- [ ] **Voice memo:** Mic permission → record → save → playback works.
- [ ] **Navigation:** Menu opens/closes; all sections reachable; no content covered.
- [ ] **Forms:** Full-width inputs; no unwanted zoom on focus (16px); buttons tappable; date pickers work.
- [ ] **Layout:** Single column on phone; no horizontal scroll; readable text; images load and scale.

---

## Empty states (all have icon + heading + description + CTA)

- [ ] Photos, Journal, Voice Memos, Messages, Events, Members
- [ ] Activity Feed (no activity), Recipes, Traditions, Achievements

---

## Auth & members

- [ ] Sign up works; redirect to dashboard.
- [ ] Login works; redirect to dashboard.
- [ ] Logout works; session cleared; back to login.
- [ ] Forgot password sends reset (if enabled).
- [ ] Add / edit / remove family members (with confirmation); relationships show correctly.

---

## Content creation (end-to-end)

- [ ] **Photos:** Upload → caption/date/location → saves → shows in gallery and Activity.
- [ ] **Journal:** New entry → title, text, photos → saves → shows in list and Activity.
- [ ] **Voice memos:** Record → title, author → saves → playback and Activity.
- [ ] **Messages:** Create → recipients, date → saves.
- [ ] **Events:** Create → date → saves and shows on dashboard.

---

## Display & errors

- [ ] Photos in grid; journal readable; voice players work; dates consistent; attribution correct (“Added by Mom (Jodi)”).
- [ ] Upload failure: clear message and retry possible.
- [ ] Offline: clear message when connection is lost.

---

## Final checks

- [ ] No console errors; all links work; buttons have hover states.
- [ ] Mobile layout looks good; dark theme and orange accent consistent.
- [ ] No broken images or icons; loading states work.

---

## Before inviting family

- [ ] Create your account (and spouse if needed).
- [ ] Add all family members.
- [ ] Upload a few photos, one journal entry, one voice memo.
- [ ] Test invite/signup for one family member.
- [ ] Share **GETTING_STARTED.md** (or a link to it) with family.
