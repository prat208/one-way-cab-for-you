import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Phone, LayoutDashboard, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthLink } from "@/components/AuthLink";

export function Nav() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();
  const links = [
    { href: "/#services", label: "Services" },
    { href: "/#fleet", label: "Fleet" },
    { href: "/#cities", label: "Cities" },
    { href: "/#routes", label: "Routes" },
    { href: "/#faq", label: "FAQ" },
    { href: "/driver/signup", label: "Drive with us" },
  ];
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="glass flex items-center justify-between rounded-2xl px-4 py-2.5 sm:px-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl btn-gold text-base font-bold">
              O
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-wide text-foreground">ONE WAY CAB</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Outstation · Premium
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <a
              href="tel:+919999999999"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Phone className="h-4 w-4 text-[color:var(--gold)]" /> 24×7
            </a>
            {!loading && (user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-full glass px-4 py-2 text-sm font-medium hover:bg-white/10"
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 rounded-full glass px-4 py-2 text-sm font-medium hover:bg-white/10"
              >
                <LogIn className="h-4 w-4" /> Sign in
              </Link>
            ))}
            <Link to="/book" className="rounded-full btn-gold px-5 py-2 text-sm font-semibold">
              Book now
            </Link>
          </div>

          <button
            className="md:hidden text-foreground p-2"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="glass mt-2 flex flex-col gap-1 rounded-2xl p-3 md:hidden">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <Link
              to="/book"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-lg btn-gold px-3 py-2 text-center text-sm font-semibold"
            >
              Book now
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
