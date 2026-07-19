import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { UserRound, ShieldCheck } from "lucide-react";

/**
 * A discreet "owner" badge — tap/click the small person glyph and an
 * admin sign-in chip reveals, routing to /admin-signup for the passcode step.
 */
export function OwnerBadge() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-24 left-4 z-40 flex items-center gap-2 sm:bottom-6">
      <motion.button
        type="button"
        aria-label="Owner access"
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        className="relative grid h-11 w-11 place-items-center rounded-full border border-primary/40 bg-background/80 text-primary shadow-lg backdrop-blur transition hover:border-primary hover:bg-primary/10"
      >
        <UserRound className="h-5 w-5" />
        <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-primary/20 animate-ping" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: -8, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Link
              to="/admin-signup"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-full border border-primary/40 bg-background/90 px-4 py-2 text-sm font-medium text-primary shadow-lg backdrop-blur hover:bg-primary hover:text-primary-foreground"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin sign-in
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
