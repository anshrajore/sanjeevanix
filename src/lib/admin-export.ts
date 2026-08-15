type ExportDetail = {
  request: Record<string, unknown>;
  notifications: Array<Record<string, unknown>>;
  events?: Array<Record<string, unknown>>;
  screening?: Record<string, unknown> | null;
};

function csvCell(value: unknown): string {
  const text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function download(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportRequestCsv(detail: ExportDetail) {
  const rows: unknown[][] = [
    ["CONFIDENTIAL ADMIN RECORD"],
    ["Exported at", new Date().toISOString()],
    [],
    ["REQUEST"],
    ...Object.entries(detail.request),
    [],
    ["TIMELINE"],
    ["timestamp", "event", "title", "detail", "status", "eta_minutes"],
    ...(detail.events ?? []).map((event) => [event.created_at, event.event_type, event.title, event.detail, event.status, event.eta_minutes]),
    [],
    ["NOTIFICATIONS AND DONOR REPLIES"],
    ["timestamp", "donor", "kind", "channel", "delivery", "reply", "error", "distance_km", "eta_minutes", "match_score"],
    ...detail.notifications.map((note) => [note.created_at, note.donor_name, note.recipient_kind, note.channel, note.status, note.response, note.error, note.distance_km, note.eta_minutes, note.match_score]),
    [],
    ["QUESTIONNAIRE AUDIT"],
    ...Object.entries(detail.screening ?? {}),
  ];
  download(`sanjeevani-request-${String(detail.request.id)}.csv`, rows.map((row) => row.map(csvCell).join(",")).join("\n"), "text/csv;charset=utf-8");
}

export function exportRequestPdf(detail: ExportDetail) {
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) throw new Error("Allow pop-ups to export PDF.");
  const safe = (value: unknown) => String(value ?? "—").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char] ?? char);
  const rows = (detail.events ?? []).map((event) => `<tr><td>${safe(event.created_at)}</td><td>${safe(event.title)}</td><td>${safe(event.detail)}</td><td>${safe(event.status)}</td></tr>`).join("");
  const notes = detail.notifications.map((note) => `<tr><td>${safe(note.created_at)}</td><td>${safe(note.donor_name)}</td><td>${safe(note.channel)}</td><td>${safe(note.status)}</td><td>${safe(note.response)}</td><td>${safe(note.error)}</td></tr>`).join("");
  win.document.write(`<!doctype html><html><head><title>Request ${safe(detail.request.id)}</title><style>body{font-family:Arial,sans-serif;color:#111;padding:32px}h1{font-size:22px}h2{font-size:15px;margin-top:28px}table{width:100%;border-collapse:collapse;font-size:10px}td,th{border:1px solid #bbb;padding:6px;text-align:left}.conf{color:#a00;font-weight:700}.meta{display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px}</style></head><body><div class="conf">CONFIDENTIAL ADMIN RECORD</div><h1>Sanjeevani X Emergency Request</h1><div class="meta">${Object.entries(detail.request).map(([key,value])=>`<div><b>${safe(key)}</b>: ${safe(typeof value === "object" ? JSON.stringify(value) : value)}</div>`).join("")}</div><h2>Lifecycle timeline</h2><table><tr><th>Time</th><th>Event</th><th>Detail</th><th>Status</th></tr>${rows}</table><h2>Matching, delivery and donor replies</h2><table><tr><th>Time</th><th>Recipient</th><th>Channel</th><th>Delivery</th><th>Reply</th><th>Error</th></tr>${notes}</table><h2>Questionnaire audit</h2><pre>${safe(JSON.stringify(detail.screening ?? {}, null, 2))}</pre><script>window.onload=()=>window.print()<\/script></body></html>`);
  win.document.close();
}