import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function BackHome({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground ${className}`}
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Back to home
    </Link>
  );
}
