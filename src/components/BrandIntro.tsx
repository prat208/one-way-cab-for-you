import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import logoFull from "@/assets/onewaycabs-logo-clean.png";

const SESSION_KEY = "intro_played_v3";

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
    const t = setTimeout(() => setShow(false), 3400);
    return () => clearTimeout(t);
  }, [prefersReduced]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="brand-intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, transition: { duration: 0.6, ease: "easeInOut" } }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
          aria-hidden="true"
        >
          <button
            onClick={() => setShow(false)}
            className="absolute right-4 top-4 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70 backdrop-blur hover:text-white"
          >
            Skip
          </button>

          <div className="relative flex flex-col items-center">
            {/* Gold aura */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -inset-40 rounded-full"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(245,198,107,0.45), transparent 70%)",
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0.85], scale: [0.5, 1.05, 1] }}
              transition={{ duration: 2.4, ease: "easeOut", times: [0, 0.6, 1] }}
            />

            {/* Golden ring sweep */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute h-[26rem] w-[26rem] rounded-full border border-[color:rgba(245,198,107,0.35)]"
              initial={{ opacity: 0, scale: 0.8, rotate: -30 }}
              animate={{ opacity: [0, 0.9, 0.4], scale: [0.8, 1, 1.05], rotate: 20 }}
              transition={{ duration: 2.4, ease: [0.2, 0.7, 0.2, 1] }}
            />

            {/* Logo cinematic reveal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.55, filter: "blur(16px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1] }}
              className="relative"
            >
              <motion.img
                src={logoFull}
                alt="Onewaycabs — Tours and travels"
                draggable={false}
                className="relative z-10 h-56 w-auto sm:h-72 md:h-80 object-contain"
                style={{ filter: "drop-shadow(0 12px 40px rgba(245,198,107,0.45))" }}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Shine sweep across logo */}
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden"
              >
                <motion.span
                  className="absolute inset-y-0 -left-1/2 w-1/3"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(255,240,200,0.55) 50%, transparent 100%)",
                    mixBlendMode: "screen",
                  }}
                  initial={{ x: "0%" }}
                  animate={{ x: ["0%", "420%"] }}
                  transition={{ duration: 1.8, delay: 1.1, ease: "easeInOut" }}
                />
              </motion.span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.5 }}
              className="mt-6 text-[10px] uppercase tracking-[0.42em] text-white/60 sm:text-xs"
            >
              Kolhapur · Since day one
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
