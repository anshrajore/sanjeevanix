import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Sanjeevani X shared blood-donation calendar.
const CALENDAR_ID =
  "4622ae47e71d3209b0d07946557976d98fd2bb5915fb7a8694c665c566172799@group.calendar.google.com";

const GATEWAY = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";

const scheduleSchema = z.object({
  donor_name: z.string().min(1),
  donor_id: z.string().min(1),
  blood_group: z.string().min(1),
  city: z.string().min(1),
  hospital: z.string().optional(),
  patient_name: z.string().optional(),
  starts_at: z.string().optional(), // ISO; default = now + 24h
  duration_minutes: z.number().int().min(15).max(240).optional(),
  attendee_emails: z.array(z.string().email()).optional(),
  notes: z.string().optional(),
});

export type ScheduleAppointmentInput = z.infer<typeof scheduleSchema>;

export type ScheduleAppointmentResult = {
  ok: boolean;
  event_id?: string;
  html_link?: string;
  starts_at?: string;
  ends_at?: string;
  location?: string;
  error?: string;
};

export const scheduleDonationAppointment = createServerFn({ method: "POST" })
  .inputValidator(scheduleSchema)
  .handler(async ({ data }): Promise<ScheduleAppointmentResult> => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const connKey = process.env.GOOGLE_CALENDAR_API_KEY;
    if (!lovableKey || !connKey) {
      return {
        ok: false,
        error: "Google Calendar connector not configured (missing keys).",
      };
    }

    const start = data.starts_at ? new Date(data.starts_at) : new Date(Date.now() + 24 * 3600 * 1000);
    const minutes = data.duration_minutes ?? 45;
    const end = new Date(start.getTime() + minutes * 60_000);
    const location = data.hospital ? `${data.hospital}, ${data.city}` : data.city;

    const body = {
      summary: `Blood Donation · ${data.donor_name} (${data.blood_group})`,
      description: [
        `Sanjeevani X autonomous match.`,
        `Donor: ${data.donor_name} (${data.donor_id})`,
        `Blood group: ${data.blood_group}`,
        data.patient_name ? `Patient: ${data.patient_name}` : "",
        data.notes ? `\nNotes: ${data.notes}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      location,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      attendees: (data.attendee_emails ?? []).map((email) => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 60 },
          { method: "email", minutes: 24 * 60 },
        ],
      },
    };

    const url = `${GATEWAY}/calendars/${encodeURIComponent(CALENDAR_ID)}/events?sendUpdates=all`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": connKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    if (!res.ok) {
      return { ok: false, error: `Calendar API ${res.status}: ${text.slice(0, 300)}` };
    }
    const ev = JSON.parse(text) as {
      id?: string;
      htmlLink?: string;
      start?: { dateTime?: string };
      end?: { dateTime?: string };
      location?: string;
    };
    return {
      ok: true,
      event_id: ev.id,
      html_link: ev.htmlLink,
      starts_at: ev.start?.dateTime ?? start.toISOString(),
      ends_at: ev.end?.dateTime ?? end.toISOString(),
      location: ev.location ?? location,
    };
  });
