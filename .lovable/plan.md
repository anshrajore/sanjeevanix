# SanjeevaniX 4.0 — Phase 1 Build Plan

Frontend-only showcase. Extends the existing demo role switcher and seeded JSON data — no Lovable Cloud, no real auth, no real VAPI/n8n/Twilio. All "real-time", "AI predictions", and "voice" surfaces are simulated visually (interval-driven state) so judges see the full experience.

## Scope (this phase)

Four slices from your priority answer:
1. Multi-role auth shell (5 roles) + 5 dashboards
2. Patient live request tracker
3. Donor dashboard + Google Calendar sync
4. National Risk Map + Executive Admin KPIs

Out of scope this phase (call out only): real Supabase Realtime, real VAPI calls, real Twilio SMS, real n8n, OpenClaw memory persistence, Blood Bank inventory writes, Blood Warriors case routing engine. Hooks/UI placeholders for these will exist but not be wired to live services.

## 1. Role system — extend from 3 → 5

`src/lib/bloodbridge.ts` and `src/hooks/use-role.ts`:
- `Role = "admin" | "hospital" | "blood_bank" | "donor" | "patient"`
- `RoleSwitcher` becomes a dropdown with 5 entries + per-role accent color
- Each role pinned to a seeded identity (donor → `D001`, patient → first open request, hospital → `H001`, blood_bank → first hospital's inventory, admin → all)
- `Navbar` shows role-scoped links + a "Switch role" pill

## 2. Five dashboards (new routes)

```
src/routes/
  admin.tsx                  (already exists — upgrade to Executive KPI grid)
  hospital-dashboard.tsx     (NEW)
  blood-bank.tsx             (NEW)
  donor-dashboard.tsx        (NEW)
  patient-dashboard.tsx      (NEW)
```

Each dashboard: glass cards, KPI strip, role-scoped data pulled from existing JSON (`donors.json`, `requests.json`, `hospitals.json`).

## 3. Patient Live Request Tracker

New component `LiveRequestTracker.tsx`:
- 8-step visual progress bar (Created → Searching → Donors Found → Verification → Scheduled → In Progress → Blood Ready → Completed)
- Auto-advances every 4s for demo (so judges see motion)
- Shows assigned donor pool (primary 8 + backup 15), coordinator, hospital, expected arrival
- Lives inside `patient-dashboard.tsx` + `thalassemia-care.tsx`

## 4. Donor Dashboard + Calendar

`donor-dashboard.tsx`:
- Profile card, trust score, donation reliability, availability toggle
- Donor timeline (Registered → Verified → Matched → Scheduled → Completed → Recovery → Eligible Again) with cooldown countdown ("47 days remaining")
- Upcoming appointment card with **Sync to Google Calendar / Apple / Outlook / .ics** buttons (already have `src/lib/calendar.ts`)
- Donation history list + earned badges (reuse `donorBadges`)
- "Hello Sanjeevani" floating voice assistant button (visual only, opens chat sheet)

## 5. National Risk Map + Executive KPIs

- `national-command-map.tsx` (NEW) — full-screen version of existing `RiskMap` with severity legend (Green/Yellow/Orange/Red/Dark Red), live counters in corner overlay, demand forecast slider
- `admin.tsx` upgrade — Executive KPI grid: Total Donors, Active Requests, Patients Supported, Hospitals, Units Coordinated, Success Rate, Avg Fulfillment Time, AI Accuracy (mocked 94.2%), Donor Retention, Thalassemia Patients, Emergency Escalations, Lives Impacted. Live ticker. Animated counters.

## 6. Sanjeevani AI floating assistant

Bottom-right floating button on every page (`<SanjeevaniAssistant />` in `__root.tsx`):
- Mic icon + chat icon
- Opens a sheet with sample commands ("Find O- donor in Mumbai", "Show critical cases")
- Returns scripted demo responses — no real LLM call this phase

## Files touched

NEW:
- `src/routes/hospital-dashboard.tsx`
- `src/routes/blood-bank.tsx`
- `src/routes/donor-dashboard.tsx`
- `src/routes/patient-dashboard.tsx`
- `src/routes/national-command-map.tsx`
- `src/components/LiveRequestTracker.tsx`
- `src/components/DonorTimeline.tsx`
- `src/components/KpiCounter.tsx`
- `src/components/SanjeevaniAssistant.tsx`

EDITED:
- `src/lib/bloodbridge.ts` (extend Role union, per-role identities)
- `src/hooks/use-role.ts` (5-role type)
- `src/components/RoleSwitcher.tsx` (dropdown w/ 5 options)
- `src/components/Navbar.tsx` (role-scoped nav)
- `src/routes/__root.tsx` (mount floating assistant)
- `src/routes/admin.tsx` (Executive KPI upgrade)

## What you'll see when this ships

- Role pill in navbar → switch between Admin / Hospital / Blood Bank / Donor / Patient
- Each role lands on its own dashboard with role-relevant KPIs
- Patient view shows the live progress bar animating through stages
- Donor view shows cooldown countdown + working calendar sync buttons
- `/national-command-map` is the wow page with heatmap + live counters
- Floating Sanjeevani assistant on every page

## Confirm before I build

Reply "go" and I'll ship all of the above in one batch. If you want Lovable Cloud + real auth instead (which contradicts your demo-auth answer), say so and I'll re-plan.