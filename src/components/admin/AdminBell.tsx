import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { markNotificationsRead } from "@/lib/leads.functions";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";

type Notif = { id: string; title: string; body: string; created_at: string; read_at: string | null; lead_id: string | null };

export function AdminBell() {
  const { user, isAdmin } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const markRead = useServerFn(markNotificationsRead);

  useEffect(() => {
    if (!user || !isAdmin) return;
    supabase
      .from("admin_notifications")
      .select("*")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setItems((data ?? []) as Notif[]));
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications", filter: `recipient_id=eq.${user.id}` },
        (payload) => setItems((prev) => [payload.new as Notif, ...prev].slice(0, 20)),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, isAdmin]);

  if (!isAdmin || !user) return null;
  const unread = items.filter((n) => !n.read_at).length;

  return (
    <div className="relative">
      <button
        onClick={async () => {
          const next = !open;
          setOpen(next);
          if (next && unread > 0) {
            await markRead();
            setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
          }
        }}
        className="relative rounded-lg border border-white/10 p-2 text-foreground hover:bg-white/[0.05]"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--gold)] px-1 text-[10px] font-semibold text-[#2b2620]">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-white/10 bg-background shadow-2xl">
          <div className="border-b border-white/5 px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
            Notifications
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && <p className="px-3 py-6 text-center text-xs text-muted-foreground">You're all caught up.</p>}
            {items.map((n) => (
              <Link
                key={n.id}
                to="/admin/leads"
                onClick={() => setOpen(false)}
                className="block border-b border-white/5 px-3 py-2.5 hover:bg-white/[0.03]"
              >
                <div className="text-sm font-medium text-foreground">{n.title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{n.body}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
