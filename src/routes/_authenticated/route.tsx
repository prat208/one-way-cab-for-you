import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthGate,
});

function AuthGate() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "authed">("checking");

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user) {
        navigate({ to: "/auth", replace: true });
      } else {
        setStatus("authed");
      }
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  if (status === "checking") {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-[color:var(--gold)]"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  return <Outlet />;
}
