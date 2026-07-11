import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  listLeads,
  updateLead,
  addLeadNote,
  listLeadNotes,
  exportLeadsCsv,
} from "@/lib/leads.functions";
import { Download, Loader2, Phone, Search, Shield, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/leads")({
  head: () => ({
    meta: [{ title: "Leads — Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: LeadsAdmin,
});

type Coupon = { code: string; discount_pct: number; valid_until: string };
type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  origin_city: string;
  state: string | null;
  status: string;
  assigned_to: string | null;
  follow_up_at: string | null;
  last_contacted_at: string | null;
  notes: string | null;
  created_at: string;
  coupons?: Coupon | Coupon[] | null;
};
function couponOf(l: Lead): Coupon | undefined {
  const c = l.coupons;
  if (!c) return undefined;
  return Array.isArray(c) ? c[0] : c;
}

const STATUSES = ["new", "contacted", "negotiation", "follow_up", "converted", "lost"] as const;
const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-300",
  contacted: "bg-amber-500/20 text-amber-300",
  negotiation: "bg-purple-500/20 text-purple-300",
  follow_up: "bg-cyan-500/20 text-cyan-300",
  converted: "bg-emerald-500/20 text-emerald-300",
  lost: "bg-red-500/20 text-red-300",
};

function LeadsAdmin() {
  const { isAdmin, loading } = useAuth();
  const list = useServerFn(listLeads);
  const exportCsv = useServerFn(exportLeadsCsv);
  const [rows, setRows] = useState<Lead[]>([]);
  const [count, setCount] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const r = await list({ data: { q: q || undefined, status: status || undefined, page: 0, pageSize: 100 } });
      setRows(r.rows as Lead[]);
      setCount(r.count);
    } finally {
      setBusy(false);
    }
  }, [list, q, status]);

  useEffect(() => {
    if (!isAdmin) return;
    refresh();
    const ch = supabase
      .channel("leads-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [isAdmin, refresh]);

  async function download() {
    const { csv } = await exportCsv();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-[color:var(--gold)]" /></div>;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background px-4 py-20 text-center text-foreground">
        <Shield className="mx-auto h-8 w-8 text-[color:var(--gold)]" />
        <h1 className="mt-3 text-xl font-semibold">Admin only</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Leads</h1>
            <p className="text-sm text-muted-foreground">{count} total · live feed</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin" className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/[0.03]">
              ← Back to admin
            </Link>
            <button onClick={download} className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--gold)] px-3 py-2 text-sm font-semibold text-[#2b2620] hover:opacity-90">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <label className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name / phone / email / city…"
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[color:var(--gold)]/60"
            />
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm outline-none"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={refresh} disabled={busy} className="rounded-lg border border-white/10 px-3 py-2.5 text-sm hover:bg-white/[0.03] disabled:opacity-60">
            {busy ? "Loading…" : "Refresh"}
          </button>
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5">When</th>
                <th className="px-3 py-2.5">Customer</th>
                <th className="px-3 py-2.5">Location</th>
                <th className="px-3 py-2.5">Coupon</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.phone} · {r.email}</div>
                  </td>
                  <td className="px-3 py-2.5 text-xs">{r.origin_city}{r.state ? `, ${r.state}` : ""}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{r.coupons?.[0]?.code ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button onClick={() => setSelected(r)} className="text-xs text-[color:var(--gold)] hover:underline">
                      Open →
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !busy && (
                <tr><td colSpan={6} className="px-3 py-10 text-center text-sm text-muted-foreground">No leads yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <LeadDrawer lead={selected} onClose={() => setSelected(null)} onChange={refresh} />}
    </div>
  );
}

function LeadDrawer({ lead, onClose, onChange }: { lead: Lead; onClose: () => void; onChange: () => void }) {
  const update = useServerFn(updateLead);
  const addNote = useServerFn(addLeadNote);
  const listNotes = useServerFn(listLeadNotes);
  const [notes, setNotes] = useState<{ id: string; kind: string; body: string; created_at: string }[]>([]);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState(lead.status);
  const [followUp, setFollowUp] = useState(lead.follow_up_at?.slice(0, 16) ?? "");

  useEffect(() => {
    listNotes({ data: { leadId: lead.id } }).then((r) => setNotes(r.notes));
  }, [lead.id, listNotes]);

  async function saveStatus(s: string) {
    setStatus(s);
    await update({ data: { id: lead.id, status: s as Lead["status"] } });
    onChange();
  }
  async function saveFollowUp() {
    await update({ data: { id: lead.id, follow_up_at: followUp || null } });
    onChange();
  }
  async function submitNote(kind: "note" | "call") {
    if (!note.trim()) return;
    await addNote({ data: { leadId: lead.id, kind, body: note.trim() } });
    setNote("");
    const r = await listNotes({ data: { leadId: lead.id } });
    setNotes(r.notes);
    onChange();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <div
        className="h-full w-full max-w-xl overflow-y-auto bg-background p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{lead.name}</h2>
            <p className="text-xs text-muted-foreground">
              {new Date(lead.created_at).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/[0.05]"><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <Info label="Phone" value={<a href={`tel:${lead.phone}`} className="text-[color:var(--gold)] hover:underline">{lead.phone}</a>} />
          <Info label="Email" value={<a href={`mailto:${lead.email}`} className="text-[color:var(--gold)] hover:underline break-all">{lead.email}</a>} />
          <Info label="City" value={lead.origin_city} />
          <Info label="State" value={lead.state ?? "—"} />
          <Info label="Coupon" value={<span className="font-mono">{lead.coupons?.[0]?.code ?? "—"}</span>} />
          <Info label="Discount" value={`${lead.coupons?.[0]?.discount_pct ?? 0}%`} />
        </div>
        {lead.notes && (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm">
            <div className="text-xs uppercase text-muted-foreground mb-1">Customer note</div>
            {lead.notes}
          </div>
        )}

        <div className="mt-6 grid gap-3">
          <div>
            <label className="text-xs uppercase text-muted-foreground">Status</label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => saveStatus(s)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    status === s ? STATUS_COLORS[s] + " ring-1 ring-white/20" : "text-muted-foreground hover:bg-white/[0.05]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs uppercase text-muted-foreground">Follow up on</label>
            <div className="mt-1.5 flex gap-2">
              <input
                type="datetime-local"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none"
              />
              <button onClick={saveFollowUp} className="rounded-lg bg-[color:var(--gold)] px-3 py-2 text-xs font-semibold text-[#2b2620] hover:opacity-90">Save</button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-xs uppercase text-muted-foreground">Add note / log call</div>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What happened on the call, offer given, next step…"
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-[color:var(--gold)]/60"
          />
          <div className="mt-2 flex gap-2">
            <button onClick={() => submitNote("note")} className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/[0.05]">Add note</button>
            <button onClick={() => submitNote("call")} className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--gold)] px-3 py-2 text-xs font-semibold text-[#2b2620] hover:opacity-90">
              <Phone className="h-3 w-3" /> Log call
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-xs uppercase text-muted-foreground mb-2">Activity</div>
          <div className="space-y-2">
            {notes.map((n) => (
              <div key={n.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-sm">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-white/[0.05] px-1.5 py-0.5">{n.kind}</span>
                  <span>{new Date(n.created_at).toLocaleString()}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap">{n.body}</p>
              </div>
            ))}
            {notes.length === 0 && <p className="text-xs text-muted-foreground">No activity yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-0.5">{value}</div>
    </div>
  );
}
