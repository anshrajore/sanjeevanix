# Sanjeevani X — Voice, Emergency Operations & National Network

## Goal
Fix Talk to AI first, then make every submitted emergency request visible and reviewable in one secure admin workflow with exports, advanced filters, notification recovery, lifecycle timelines, configurable alerts, realistic hospital mapping, and dual phone verification.

## 1. Repair and upgrade Talk to AI
- Replace the fragile VAPI SDK loading path that produces `The superclass is not a constructor` with a browser-only, export-shape-safe adapter and clean instance re-creation after SDK errors.
- Make every Talk to AI control call the same provider action directly; show distinct states for microphone permission, connecting, active, ended, provider rejection, and retry.
- Upgrade wake mode to pause while a call is active, restart safely after a call, prevent duplicate recognizers/calls, and recognize common “Hey Sanjeevani” variations.
- Keep the typed assistant available as a fallback, but never report a simulated voice call as successful.

## 2. Unify request creation and admin visibility
- Move the normal blood request submission into the authenticated backend request workflow instead of leaving it only in browser storage/Google Sheet.
- Keep Google Sheet sync as a secondary integration, not the source of truth; a sync failure will not hide a successfully created request.
- Add a request type/source field so standard and emergency requests can be distinguished while both appear in Admin Console.
- Invalidate/refetch admin request queries immediately and subscribe to live inserts/updates so newly submitted requests appear without waiting for the current polling interval.
- Add explicit delivery states such as `delivery_failed` to filters and status rendering.

## 3. Request history and detailed timeline
- Add an immutable `emergency_request_events` table for created, dispatched, searching, donor alerted, donor reply, accepted, ETA changed, fulfilled, cancelled, delivery failed, and timed out events.
- Record events from dispatch, donor reply, admin status changes, ETA changes, notification retries, and timeout processing.
- Render a vertical timeline/stepper in each request detail with timestamps, actor/channel, state, ETA, and failure reason.
- Attach the requester’s latest eligibility/questionnaire audit summary and risk flags to the request detail when available.

## 4. Advanced Admin Console search
- Add status, blood group, city, created-date range, request source/type, and risk-flag filters plus patient/hospital/request-ID search.
- Apply filters server-side, sort newest first, paginate results, and provide reset/active-filter indicators.
- Preserve strict admin authorization on every new server function; sensitive phone, donor reply, and questionnaire data never becomes public.

## 5. CSV and PDF exports
- Add per-request Export CSV and Export PDF actions.
- Export request metadata, matching progress, ranked donor pool, masked contact data, donor replies, notification attempts/errors, complete lifecycle timeline, and linked questionnaire/risk audit.
- Generate CSV in the browser from an admin-authorized export DTO; generate the printable PDF client-side from the same DTO to avoid adding a server runtime-incompatible PDF package.
- Include request ID, export timestamp, and “confidential admin record” labeling.

## 6. Notification templates and resend operations
- Add admin-only template management for SMS, email, WhatsApp, and push with event type, subject, body, enabled state, and safe placeholder preview.
- Seed sensible templates for dispatch, donor alert, acceptance, ETA update, timeout, verification OTP, and delivery failure.
- Add a delivery log with attempt number, provider message ID, error, retry timestamp, and admin actor.
- In request detail, allow resending only failed/skipped notifications to a selected recipient/channel or retrying all failed notifications; every retry is audited.

## 7. Admin-configurable alert rules
- Add rules for “no donor accepted within X minutes,” delivery failure threshold, high-risk city shortage, critical blood group, request timeout approaching, and ETA breach.
- Support severity, threshold/window, enabled state, recipient admins, and channels: in-app, SMS, email, and web push.
- Evaluate immediate rules during request lifecycle writes and persist scheduled rule checks as auditable alert events; prevent duplicate alerts with idempotency keys and cooldowns.
- Add an Admin Alerts inbox with unread counts, acknowledge/resolve actions, and links to affected requests.
- Outbound channels degrade safely: in-app always works; SMS/email/push show “channel not configured” rather than pretending delivery. Browser push requires an explicit admin subscription.

## 8. Hospital network and realistic map
- Replace the six-record map experience with two layers:
  1. a curated India-wide hospital network with verified name, address, city/state, coordinates, switchboard phone, capabilities, and verification timestamp;
  2. broader OpenStreetMap hospital discovery labeled “unverified” when phone/contact data is absent or not validated.
- Add hospital search, city/state filters, marker clustering or bounded rendering, detail popovers, phone display, verification badge, directions link, and selected-hospital handoff into the request form.
- Never claim “all hospitals” are verified; open-map records remain clearly separated from curated operational partners.

## 9. Dual phone OTP verification
- Require OTP verification for the requester/coordinator number and the selected hospital contact before emergency dispatch.
- Store only hashed OTP challenges, expiration, attempt count, verification time, phone purpose, and rate-limit metadata; never store plaintext OTPs.
- Send OTP through the existing SMS connector, enforce expiry/attempt limits/resend cooldown, mask numbers in the UI/logs, and bind verification to the signed-in session and request draft.
- A curated hospital’s registered number can be verified; unverified open-map hospitals require manual contact entry and verification.

## 10. Backend schema and security
- Add tables for request events, notification templates/attempts, alert rules/events/subscriptions, hospital directory, and phone verification challenges using migrations with explicit grants, RLS, indexes, and admin policies.
- Keep roles in `user_roles` and use `has_role`; no client-side admin trust.
- Add narrow owner/admin policies and server functions; privileged connector usage stays server-side after role verification.
- Run the database linter after migrations and resolve actionable security findings.

## 11. Validation
- Reproduce and verify Talk to AI start/end/retry and wake-word behavior in a real browser, including denied microphone state.
- Submit both a standard and emergency request and verify each appears live in Admin Console.
- Verify filters, request timeline, CSV/PDF downloads, failed-notification resend, template edits, rule creation, alert inbox, hospital selection, and both OTP steps.
- Check desktop and mobile layouts and confirm no sensitive unmasked contact data appears in non-admin views.

## Technical notes
- The backend database becomes the source of truth; Google Sheet remains an optional mirror.
- Automatic in-app alert evaluation is durable in the database. Timed outbound alert delivery will use a protected scheduled server endpoint; if the external scheduler/email sender is not connected, the UI will surface that configuration state without blocking core request handling.
- “All hospitals” is implemented as a hybrid network because no trustworthy source guarantees complete, current names, coordinates, and phone numbers for every hospital in India.
