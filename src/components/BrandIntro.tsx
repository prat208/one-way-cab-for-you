import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BrandLogo } from "./BrandLogo";

const BRAND = "ONEWAYCABS";
const SESSION_KEY = "intro_played_v2";

export function BrandIntro() {
  const prefersReduced = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (prefersReduced) return;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}
    setShow(true);
    const t = setTimeout(() => setShow(false), 3200);
    return () => clearTimeout(t);
  }, [prefersReduced]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="brand-intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, transition: { duration: 0.6, ease: "easeInOut" } }}
          className="fixed inset-0 z-[100] flex items-center justify-center brand-intro-mask"
          aria-hidden="true"
        >
          <button
            onClick={() => setShow(false)}
            className="absolute right-4 top-4 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70 backdrop-blur hover:text-white"
          >
            Skip
          </button>

          <div className="relative flex flex-col items-center">
            {/* Gold sweep behind logo */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -inset-24 rounded-full"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(245,198,107,0.35), transparent 70%)",
              }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />

            {/* The logo, revealed as a golden emblem */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7, filter: "blur(14px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.0, ease: [0.2, 0.7, 0.2, 1] }}
              className="relative h-40 w-40 sm:h-52 sm:w-52"
            >
              <BrandLogo alive className="h-full w-full" />
            </motion.div>

            {/* Wordmark under logo */}
            <div className="relative mt-6 flex items-end gap-[0.05em] font-display text-2xl font-bold tracking-[0.28em] sm:text-3xl">
              {BRAND.split("").map((ch, i) => (
                <motion.span
                  key={i}
                  initial={{ y: 20, opacity: 0, filter: "blur(8px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  transition={{ delay: 0.9 + i * 0.05, duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
                  className="inline-block bg-gradient-to-b from-[#fff8e1] via-[#f5c66b] to-[#b8862b] bg-clip-text text-transparent"
                >
                  {ch}
                </motion.span>
              ))}

              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.5, duration: 0.7, ease: "easeInOut" }}
                style={{ transformOrigin: "left" }}
                className="absolute -bottom-3 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[color:var(--gold,#f5c66b)] to-transparent"
              />
            </div>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.5 }}
              className="mt-8 text-[10px] uppercase tracking-[0.42em] text-white/60 sm:text-xs"
            >
              Tours & Travels · Kolhapur
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
