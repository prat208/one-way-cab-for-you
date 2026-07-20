import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import logoFull from "@/assets/onewaycabs-logo-clean.png";
import { CabGlyph } from "./CabGlyph";

const BRAND = "ONEWAYCABS";
const SESSION_KEY = "intro_played_v4";

export function BrandIntro() {
  const prefersReduced = useReducedMotion();
  const [show, setShow] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (prefersReduced) return;
    const mobile = window.matchMedia("(max-width: 640px)").matches;
    setIsMobile(mobile);
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}
    setShow(true);
    const t = setTimeout(() => setShow(false), mobile ? 2600 : 4200);
    return () => clearTimeout(t);
  }, [prefersReduced]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="brand-intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, transition: { duration: 0.6, ease: "easeInOut" } }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black overflow-hidden"
          aria-hidden="true"
        >
          <button
            onClick={() => setShow(false)}
            className="absolute right-4 top-4 z-20 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70 backdrop-blur hover:text-white"
          >
            Skip
          </button>

          {/* Road horizon line — cab drives across */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-1/2 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(245,198,107,0.6) 20%, rgba(245,198,107,0.6) 80%, transparent 100%)",
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: [0, 1, 0.6, 0] }}
            transition={{ duration: isMobile ? 1.0 : 1.6, times: [0, 0.3, 0.7, 1], ease: "easeInOut" }}
          />

          {/* Driving cab silhouette that sweeps in from left, settles into logo */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-[color:var(--gold,#f5c66b)]"
            initial={{ x: "-40vw", opacity: 0 }}
            animate={{ x: ["-40vw", "0vw", "0vw"], opacity: [0, 1, 0] }}
            transition={{ duration: isMobile ? 1.1 : 1.8, times: [0, 0.75, 1], ease: [0.2, 0.7, 0.2, 1] }}
            style={{ filter: "drop-shadow(0 0 18px rgba(245,198,107,0.7))" }}
          >
            <CabGlyph className="w-32 sm:w-56" />
          </motion.div>

          <div className="relative flex flex-col items-center">
            {/* Gold aura pulsing behind logo — arrives with the logo */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -inset-40 rounded-full"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(245,198,107,0.45), transparent 70%)",
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0.95, 0.75], scale: [0.5, 1.05, 1] }}
              transition={{ duration: isMobile ? 1.0 : 1.6, delay: isMobile ? 0.9 : 1.4, ease: "easeOut", times: [0, 0.6, 1] }}
            />

            {/* Golden ring sweeping around — desktop only (expensive layer) */}
            {!isMobile && (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute h-[26rem] w-[26rem] rounded-full border border-[color:rgba(245,198,107,0.35)]"
                initial={{ opacity: 0, scale: 0.7, rotate: -40 }}
                animate={{ opacity: [0, 0.9, 0.35], scale: [0.7, 1, 1.05], rotate: 20 }}
                transition={{ duration: 2.2, delay: 1.4, ease: [0.2, 0.7, 0.2, 1] }}
              />
            )}

            {/* The full logo assembles in — mountains/car/circle reveal via masked wipe */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6, filter: "blur(18px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: isMobile ? 0.7 : 1.1, delay: isMobile ? 0.9 : 1.4, ease: [0.2, 0.7, 0.2, 1] }}
              className="relative"
            >
              <motion.img
                src={logoFull}
                alt="Onewaycabs — Tours and travels"
                draggable={false}
                className="relative z-10 h-40 w-auto sm:h-72 md:h-80 object-contain"
                style={{ filter: "drop-shadow(0 12px 40px rgba(245,198,107,0.5))" }}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Rising vertical wipe — mountains appear first, then car, then wordmark */}
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0 z-20 bg-black"
                initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
                animate={{ clipPath: "inset(0% 0% 100% 0%)" }}
                transition={{ duration: isMobile ? 0.9 : 1.5, delay: isMobile ? 1.0 : 1.5, ease: [0.65, 0, 0.35, 1] }}
              />

              {/* Shine sweep across logo after reveal */}
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
              >
                <motion.span
                  className="absolute inset-y-0 -left-1/2 w-1/3"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(255,240,200,0.6) 50%, transparent 100%)",
                    mixBlendMode: "screen",
                  }}
                  initial={{ x: "0%" }}
                  animate={{ x: ["0%", "420%"] }}
                  transition={{ duration: isMobile ? 1.0 : 1.5, delay: isMobile ? 1.8 : 3.0, ease: "easeInOut" }}
                />
              </motion.span>
            </motion.div>

            {/* ONEWAYCABS wordmark — letters ladder in, in sync with logo settle */}
            <div className="relative mt-5 flex items-end gap-[0.05em] font-display text-xl font-bold tracking-[0.24em] sm:mt-6 sm:text-3xl sm:tracking-[0.28em]">
              {BRAND.split("").map((ch, i) => (
                <motion.span
                  key={i}
                  initial={{ y: 22, opacity: 0, filter: "blur(8px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  transition={{ delay: (isMobile ? 1.6 : 2.6) + i * (isMobile ? 0.035 : 0.06), duration: isMobile ? 0.35 : 0.5, ease: [0.2, 0.7, 0.2, 1] }}
                  className="inline-block bg-gradient-to-b from-[#fff8e1] via-[#f5c66b] to-[#b8862b] bg-clip-text text-transparent"
                >
                  {ch}
                </motion.span>
              ))}
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: isMobile ? 2.1 : 3.4, duration: isMobile ? 0.5 : 0.7, ease: "easeInOut" }}
                style={{ transformOrigin: "left" }}
                className="absolute -bottom-3 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[color:var(--gold,#f5c66b)] to-transparent"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
