import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CabGlyph } from "./CabGlyph";

const BRAND = "ONEWAYCAB";
const SESSION_KEY = "intro_played_v1";

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
    const t = setTimeout(() => setShow(false), 2200);
    return () => clearTimeout(t);
  }, [prefersReduced]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="brand-intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, transition: { duration: 0.5, ease: "easeInOut" } }}
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
            <div className="relative flex items-end gap-[0.05em] font-display text-5xl font-bold tracking-[0.08em] text-white sm:text-7xl">
              {BRAND.split("").map((ch, i) => (
                <motion.span
                  key={i}
                  initial={{ y: 40, opacity: 0, filter: "blur(10px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
                  className="inline-block bg-gradient-to-b from-white via-white to-[color:var(--gold,#f5c66b)] bg-clip-text text-transparent"
                >
                  {ch}
                </motion.span>
              ))}

              {/* underline */}
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.9, duration: 0.7, ease: "easeInOut" }}
                style={{ transformOrigin: "left" }}
                className="absolute -bottom-3 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[color:var(--gold,#f5c66b)] to-transparent"
              />

              {/* headlight sweep */}
              <motion.span
                initial={{ x: "-20%", opacity: 0 }}
                animate={{ x: "120%", opacity: [0, 1, 0] }}
                transition={{ delay: 0.95, duration: 0.9, ease: "easeInOut" }}
                className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent mix-blend-screen"
              />
            </div>

            {/* cab driving under wordmark */}
            <motion.div
              initial={{ x: "-60%", opacity: 0 }}
              animate={{ x: "60%", opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
              className="mt-4"
            >
              <CabGlyph className="h-6 w-auto text-[color:var(--gold,#f5c66b)] sm:h-8" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.5 }}
              className="mt-6 text-xs uppercase tracking-[0.4em] text-white/60 sm:text-sm"
            >
              Trips, done right.
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
