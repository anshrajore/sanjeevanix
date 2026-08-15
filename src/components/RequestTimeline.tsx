import { CheckCircle2, Circle, Clock3, XCircle } from "lucide-react";

export function RequestTimeline({ events }: { events: Array<{ id: string; event_type: string; title: string; detail: string | null; status: string | null; eta_minutes: number | null; channel: string | null; created_at: string }> }) {
  return (
    <ol className="relative border-l border-white/10 ml-2 space-y-0">
      {events.map((event, index) => {
        const failed = /failed|cancelled|timeout/.test(event.event_type);
        const current = index === events.length - 1;
        const Icon = failed ? XCircle : current ? Clock3 : CheckCircle2;
        return (
          <li key={event.id} className="relative pl-7 pb-5 last:pb-0">
            <span className={`absolute -left-2 top-0 grid h-4 w-4 place-items-center rounded-full bg-background ${failed ? "text-destructive" : current ? "text-amber-300" : "text-emerald-400"}`}><Icon className="h-4 w-4" /></span>
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium">{event.title}</p><time className="text-[10px] text-muted-foreground">{new Date(event.created_at).toLocaleString("en-IN")}</time></div>
            {event.detail && <p className="mt-1 text-xs text-muted-foreground">{event.detail}</p>}
            <div className="mt-1 flex gap-2 text-[10px] text-muted-foreground">{event.status && <span>{event.status}</span>}{event.channel && <span>· {event.channel}</span>}{event.eta_minutes != null && <span>· ETA {event.eta_minutes}m</span>}</div>
          </li>
        );
      })}
      {events.length === 0 && <li className="pl-7 text-xs text-muted-foreground"><Circle className="absolute -left-2 h-4 w-4" />No lifecycle events recorded.</li>}
    </ol>
  );
}