// n8n webhook integration — fires when a donor "Contact" trigger runs.
// The workflow handles VAPI outreach, donor confirmation, and Google Calendar
// scheduling. The webhook response (or a follow-up poll) updates the UI.

const PROD_URL = "https://darkarcanehackprix.app.n8n.cloud/webhook/frontend-status";
const TEST_URL = "https://darkarcanehackprix.app.n8n.cloud/webhook-test/frontend-status";

export function n8nWebhookUrl(): string {
  // VITE_N8N_MODE=test | prod (default: prod)
  const mode = (import.meta.env.VITE_N8N_MODE ?? "prod").toString().toLowerCase();
  return mode === "test" ? TEST_URL : PROD_URL;
}

export type ContactTriggerPayload = {
  event: "donor.contact.triggered";
  request_id: string;
  donor: {
    id: string;
    name: string;
    blood_group: string;
    city: string;
    phone?: string;
  };
  patient?: {
    name: string;
    blood_group: string;
    hospital?: string;
    units_needed?: number;
  };
  requested_at: string; // ISO
  source: "sanjeevanix-web";
};

export type ContactTriggerResponse = {
  status?: "triggered" | "calling" | "confirmed" | "scheduled" | "declined" | "error";
  message?: string;
  appointment?: {
    starts_at?: string; // ISO
    ends_at?: string;
    location?: string;
    calendar_event_id?: string;
    calendar_link?: string; // Google Calendar event URL
    meet_link?: string;
  };
  donor_confirmation?: {
    confirmed: boolean;
    confirmed_at?: string;
    notes?: string;
  };
  raw?: unknown;
};

export async function triggerDonorContact(
  payload: ContactTriggerPayload,
): Promise<ContactTriggerResponse> {
  const url = n8nWebhookUrl();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`n8n webhook failed: ${res.status} ${res.statusText}`);
  }
  // n8n may return JSON, text, or nothing depending on workflow config.
  const text = await res.text();
  if (!text) return { status: "triggered", message: "Workflow accepted." };
  try {
    const data = JSON.parse(text) as ContactTriggerResponse;
    return { status: data.status ?? "triggered", ...data };
  } catch {
    return { status: "triggered", message: text };
  }
}

export function newRequestId(prefix = "REQ"): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}
