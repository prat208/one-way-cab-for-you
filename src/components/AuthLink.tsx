import { forwardRef, type ReactNode, type MouseEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  to: string;
  className?: string;
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  ariaLabel?: string;
};

/**
 * Anchor that routes signed-in users to `to`, and everyone else to
 * `/auth?redirect=<to>`. Use for every conversion CTA on public pages.
 */
export const AuthLink = forwardRef<HTMLAnchorElement, Props>(function AuthLink(
  { to, className, children, onClick, ariaLabel },
  ref,
) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const target = user || loading ? to : `/auth?redirect=${encodeURIComponent(to)}`;

  return (
    <a
      ref={ref}
      href={target}
      aria-label={ariaLabel}
      className={className}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        if (!user) {
          navigate({ to: "/auth", search: { redirect: to } });
        } else {
          // Support both route paths and hash targets
          if (to.startsWith("#")) {
            window.location.hash = to;
          } else {
            navigate({ to });
          }
        }
      }}
    >
      {children}
    </a>
  );
});
