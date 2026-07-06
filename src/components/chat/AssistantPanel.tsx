import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Sparkles, Bot, User as UserIcon, IndianRupee, MapPin, CheckCircle2, XCircle } from "lucide-react";

const QUICK = [
  "Estimate fare Pune to Mumbai",
  "Which cab for 5 people with luggage?",
  "What are popular routes from Pune?",
  "Track booking OWC-",
];

export function AssistantPanel() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const busy = status === "submitted" || status === "streaming";

  function submit(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div className="glass flex h-[720px] flex-col overflow-hidden rounded-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[color:var(--gold)] to-[color:var(--cyan)] text-black">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            Aura <span className="rounded-full bg-[color:var(--gold)]/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[color:var(--gold)]">AI concierge</span>
          </div>
          <div className="text-[11px] text-muted-foreground">Ask for fares, best cab, or trip status</div>
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="mx-auto max-w-sm text-center py-8">
            <Sparkles className="mx-auto h-8 w-8 text-[color:var(--gold)]" />
            <h3 className="mt-3 text-lg font-semibold">How can I help plan your ride?</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              I can price your trip, pick the right cab, and check any booking status.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {status === "submitted" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Aura is thinking…
          </div>
        )}
      </div>

      {/* Quick chips */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-white/5 px-4 py-2">
          {QUICK.map((q) => (
            <button
              key={q}
              onClick={() => submit(q)}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-muted-foreground hover:border-[color:var(--gold)]/50 hover:text-foreground"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="border-t border-white/10 p-3"
      >
        <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 focus-within:border-[color:var(--gold)]/50">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            rows={1}
            placeholder="Message Aura…"
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 max-h-32"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="grid h-9 w-9 flex-none place-items-center rounded-full btn-gold disabled:opacity-40"
            aria-label="Send"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`grid h-7 w-7 flex-none place-items-center rounded-full ${isUser ? "bg-white/10" : "bg-gradient-to-br from-[color:var(--gold)] to-[color:var(--cyan)] text-black"}`}>
        {isUser ? <UserIcon className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div className={`min-w-0 max-w-[85%] space-y-2 ${isUser ? "text-right" : ""}`}>
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return (
              <div
                key={i}
                className={`inline-block whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${
                  isUser
                    ? "bg-[color:var(--gold)]/15 text-foreground"
                    : "bg-white/[0.04] text-foreground"
                }`}
              >
                {part.text}
              </div>
            );
          }
          if (part.type.startsWith("tool-")) {
            return <ToolCard key={i} part={part} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}

function ToolCard({ part }: { part: any }) {
  const name = part.type.replace("tool-", "");
  const state = part.state;
  const output = part.output;

  if (state !== "output-available") {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> {labelFor(name)}
      </div>
    );
  }

  if (name === "estimate_fare" && output?.estimates) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left">
        <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="uppercase tracking-wider">Fare estimate</span>
          <span>{output.distance_km} km · {Math.round(Number(output.duration_hours))}h</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {output.estimates.map((e: any) => (
            <div key={e.name} className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{e.category} · {e.seats} seats</div>
              <div className="text-sm font-semibold">{e.name}</div>
              <div className="mt-0.5 flex items-center text-sm font-bold text-[color:var(--gold)]">
                <IndianRupee className="h-3 w-3" />{e.fare.toLocaleString("en-IN")}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (name === "recommend_vehicle" && output?.recommended) {
    return (
      <div className="rounded-2xl border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/5 p-3 text-left">
        <div className="text-[10px] uppercase tracking-wider text-[color:var(--gold)]">Best pick</div>
        <div className="mt-1 text-base font-semibold">{output.recommended.name}</div>
        <div className="text-xs text-muted-foreground">{output.recommended.category} · {output.recommended.seats} seats · ₹{output.recommended.per_km_rate}/km</div>
        <div className="mt-1 text-xs text-foreground/80">{output.reason}</div>
      </div>
    );
  }

  if (name === "get_booking_status") {
    if (!output?.found) {
      return (
        <div className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs">
          <XCircle className="h-3.5 w-3.5 text-red-400" /> No booking found for {output?.booking_ref}
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left">
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--gold)]" />
          <span className="font-mono text-[color:var(--gold)]">{output.booking_ref}</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider">{output.status}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-sm">
          <MapPin className="h-3.5 w-3.5 text-[color:var(--gold)]" />
          {output.pickup_city} → {output.drop_city}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {output.pickup_date} {output.pickup_time ?? ""} · {output.vehicle_name ?? "vehicle TBD"} · {output.trip_type}
        </div>
      </div>
    );
  }

  if (name === "list_popular_routes" && output?.routes) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left">
        <div className="mb-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">Popular routes</div>
        <ul className="space-y-1 text-xs">
          {output.routes.slice(0, 8).map((r: any, i: number) => (
            <li key={i} className="flex items-center justify-between">
              <span>{r.from_city} → {r.to_city}</span>
              <span className="text-muted-foreground">{r.distance_km} km</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
}

function labelFor(name: string) {
  return (
    {
      estimate_fare: "Estimating fare…",
      recommend_vehicle: "Choosing best cab…",
      get_booking_status: "Looking up booking…",
      list_popular_routes: "Fetching routes…",
    } as Record<string, string>
  )[name] ?? "Working…";
}
