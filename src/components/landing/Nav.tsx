import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Phone, LayoutDashboard, LogIn, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthLink } from "@/components/AuthLink";
import { BrandLogo } from "@/components/BrandLogo";

export function Nav() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();
  const links = [
    { href: "/#services", label: "Services" },
    { href: "/#fleet", label: "Fleet" },
    
    { href: "/#cities", label: "Cities" },
    { href: "/rates", label: "Fares" },
    { href: "/#faq", label: "FAQ" },
    { href: "/driver/signup", label: "Drive with us" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <BrandLogo crop className="h-10 w-10 shrink-0" />
          <div className="leading-tight">
            <div className="text-[15px] font-extrabold tracking-tight text-foreground">
              ONEWAY<span className="text-[color:var(--gold)]">CABS</span>
            </div>
            <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              Tours &amp; Travels · Kolhapur
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <a href="tel:+918999740424" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--gold)]/15">
              <Phone className="h-4 w-4 text-[color:var(--gold)]" />
            </span>
            <span className="leading-tight">
              <span className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                24×7 Support
              </span>
              <span className="block text-sm font-bold text-foreground">89997 40424</span>
            </span>
          </a>

          {!loading &&
            (user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--border)] px-3.5 py-2 text-sm font-medium hover:bg-muted"
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--border)] px-3.5 py-2 text-sm font-medium hover:bg-muted"
              >
                <LogIn className="h-4 w-4" /> Sign in
              </Link>
            ))}
          <AuthLink
            to="/book"
            className="inline-flex items-center gap-1.5 rounded-lg btn-gold px-5 py-2.5 text-sm font-bold"
          >
            Book Now <ArrowRight className="h-4 w-4" />
          </AuthLink>
        </div>

        <button
          className="p-2 text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-1 border-t border-[color:var(--border)] bg-background p-3 md:hidden">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
            >
              {l.label}
            </a>
          ))}
          <a
            href="tel:+918999740424"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-foreground"
          >
            24×7 Support · 89997 40424
          </a>
          <AuthLink
            to="/book"
            onClick={() => setOpen(false)}
            className="mt-1 rounded-lg btn-gold px-3 py-2.5 text-center text-sm font-bold"
          >
            Book Now
          </AuthLink>
        </div>
      )}
    </header>
  );
}
