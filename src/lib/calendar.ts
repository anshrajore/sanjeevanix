// Calendar invite helpers — generate ICS files + Google Calendar URLs
// Used when a donor confirms via VAPI to send sync-able invites to donor,
// patient family, and hospital coordinator.

export type CalendarEvent = {
  title: string;
  description: string;
  location: string;
  start: Date; // local time treated as UTC for simplicity
  durationMinutes: number;
  organizer?: { name: string; email: string };
  attendees?: { name: string; email: string }[];
  url?: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toICSDate(d: Date): string {
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    "00Z"
  );
}

function escapeICS(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildICS(ev: CalendarEvent): string {
  const end = new Date(ev.start.getTime() + ev.durationMinutes * 60_000);
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@sanjeevanix.app`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sanjeevani X//Blood Bridge//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(ev.start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${escapeICS(ev.title)}`,
    `DESCRIPTION:${escapeICS(ev.description)}`,
    `LOCATION:${escapeICS(ev.location)}`,
    ev.url ? `URL:${ev.url}` : "",
    ev.organizer ? `ORGANIZER;CN=${escapeICS(ev.organizer.name)}:mailto:${ev.organizer.email}` : "",
    ...(ev.attendees ?? []).map(
      (a) =>
        `ATTENDEE;CN=${escapeICS(a.name)};RSVP=TRUE:mailto:${a.email}`,
    ),
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT60M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeICS(ev.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

export function googleCalendarUrl(ev: CalendarEvent): string {
  const end = new Date(ev.start.getTime() + ev.durationMinutes * 60_000);
  const fmt = (d: Date) =>
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    "00Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    details: ev.description,
    location: ev.location,
    dates: `${fmt(ev.start)}/${fmt(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function outlookCalendarUrl(ev: CalendarEvent): string {
  const end = new Date(ev.start.getTime() + ev.durationMinutes * 60_000);
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: ev.title,
    body: ev.description,
    location: ev.location,
    startdt: ev.start.toISOString(),
    enddt: end.toISOString(),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function downloadICS(filename: string, ev: CalendarEvent) {
  if (typeof window === "undefined") return;
  const blob = new Blob([buildICS(ev)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function mapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function appleMapsUrl(query: string): string {
  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}
