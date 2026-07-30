import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import logoFull from "@/assets/onewaycabs-logo-clean.png";
import { CabGlyph } from "./CabGlyph";

const BRAND = "ONEWAYCABS";

function useIsMobileNow() {
  // null until mounted so SSR and first client render match exactly.
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    setIsMobile(window.matchMedia("(max-width: 640px)").matches);
  }, []);
  return isMobile;
}

/**
 * Mobile-first brand intro.
 * Phones get a short, GPU-cheap sequence: transform/opacity only — no blur,
 * no clip-path, no drop-shadow, no infinite loops. Desktop keeps the richer
 * cinematic assembly.
 */
export function BrandIntro() {
  const prefersReduced = useReducedMotion();
  const isMobile = useIsMobileNow();
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (prefersReduced) {
      setShow(false);
      return;
    }
    const mobile = window.matchMedia("(max-width: 640px)").matches;
    const t = setTimeout(() => setShow(false), mobile ? 3800 : 4200);
    return () => clearTimeout(t);
  }, [prefersReduced]);

  if (isMobile === null) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="brand-intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: isMobile ? 0.35 : 0.6, ease: "easeInOut" } }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black"
          aria-hidden="true"
        >
          <button
            onClick={() => setShow(false)}
            className="absolute right-4 top-4 z-20 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70 hover:text-white"
          >
            Skip
          </button>

          {isMobile ? <MobileIntro /> : <DesktopIntro />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------------- mobile --------------------------------- */

function MobileIntro() {
  return (
    <div className="relative flex w-full flex-col items-center px-6">
      {/* Road line — pure transform */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 top-1/2 h-px bg-[color:var(--gold,#f5c66b)]/60"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.6, times: [0, 0.25, 0.7, 1], ease: "easeInOut" }}
        style={{ transformOrigin: "center", willChange: "transform, opacity" }}
      />

      {/* Cab sweeps in */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-[color:var(--gold,#f5c66b)]"
        initial={{ x: "-60vw", opacity: 0 }}
        animate={{ x: ["-60vw", "0vw", "0vw", "10vw"], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.1, times: [0, 0.55, 0.8, 1], ease: [0.22, 0.7, 0.25, 1] }}
        style={{ willChange: "transform, opacity" }}
      >
        <CabGlyph className="w-28" />
      </motion.div>

      <div className="relative flex flex-col items-center">
        <div className="relative overflow-hidden">
          <motion.img
            src={logoFull}
            alt="Onewaycabs — Tours and travels"
            draggable={false}
            className="relative z-10 h-36 w-auto object-contain"
            initial={{ opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 1.5, ease: [0.2, 0.7, 0.2, 1] }}
            style={{ willChange: "transform, opacity" }}
          />
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/2 z-20 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent mix-blend-screen"
            initial={{ x: "0%", opacity: 0 }}
            animate={{ x: ["0%", "450%"], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.15, delay: 2.45, times: [0, 0.15, 0.78, 1], ease: "easeInOut" }}
            style={{ willChange: "transform, opacity" }}
          />
        </div>

        <div className="mt-5 flex font-display text-xl font-bold tracking-[0.24em] text-[color:var(--gold,#f5c66b)]">
          {BRAND.split("").map((ch, i) => (
            <motion.span
              key={`${ch}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 2.15 + i * 0.05, ease: [0.2, 0.7, 0.2, 1] }}
              style={{ willChange: "transform, opacity" }}
            >
              {ch === " " ? "\u00A0" : ch}
            </motion.span>
          ))}
        </div>

        <motion.span
          aria-hidden
          className="mt-2 block h-[2px] w-40 bg-[color:var(--gold,#f5c66b)]"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 2.75, ease: "easeInOut" }}
          style={{ transformOrigin: "left", willChange: "transform" }}
        />
      </div>

    </div>
  );
}

/* --------------------------------- desktop --------------------------------- */

function DesktopIntro() {
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 top-1/2 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(245,198,107,0.6) 20%, rgba(245,198,107,0.6) 80%, transparent 100%)",
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: [0, 1, 0.6, 0] }}
        transition={{ duration: 1.6, times: [0, 0.3, 0.7, 1], ease: "easeInOut" }}
      />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-[color:var(--gold,#f5c66b)]"
        initial={{ x: "-40vw", opacity: 0 }}
        animate={{ x: ["-40vw", "0vw", "0vw"], opacity: [0, 1, 0] }}
        transition={{ duration: 1.8, times: [0, 0.75, 1], ease: [0.2, 0.7, 0.2, 1] }}
        style={{ filter: "drop-shadow(0 0 18px rgba(245,198,107,0.7))" }}
      >
        <CabGlyph className="w-56" />
      </motion.div>

      <div className="relative flex flex-col items-center">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-40 rounded-full"
          style={{
            background: "radial-gradient(closest-side, rgba(245,198,107,0.45), transparent 70%)",
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 0.95, 0.75], scale: [0.5, 1.05, 1] }}
          transition={{ duration: 1.6, delay: 1.4, ease: "easeOut", times: [0, 0.6, 1] }}
        />

        <motion.div
          aria-hidden
          className="pointer-events-none absolute h-[26rem] w-[26rem] rounded-full border border-[color:rgba(245,198,107,0.35)]"
          initial={{ opacity: 0, scale: 0.7, rotate: -40 }}
          animate={{ opacity: [0, 0.9, 0.35], scale: [0.7, 1, 1.05], rotate: 20 }}
          transition={{ duration: 2.2, delay: 1.4, ease: [0.2, 0.7, 0.2, 1] }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.6, filter: "blur(18px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.1, delay: 1.4, ease: [0.2, 0.7, 0.2, 1] }}
          className="relative"
        >
          <motion.img
            src={logoFull}
            alt="Onewaycabs — Tours and travels"
            draggable={false}
            className="relative z-10 h-72 w-auto object-contain md:h-80"
            style={{ filter: "drop-shadow(0 12px 40px rgba(245,198,107,0.5))" }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 bg-black"
            initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
            animate={{ clipPath: "inset(0% 0% 100% 0%)" }}
            transition={{ duration: 1.5, delay: 1.5, ease: [0.65, 0, 0.35, 1] }}
          />

          <motion.span aria-hidden className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
            <motion.span
              className="absolute inset-y-0 -left-1/2 w-1/3"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,240,200,0.6) 50%, transparent 100%)",
                mixBlendMode: "screen",
              }}
              initial={{ x: "0%" }}
              animate={{ x: ["0%", "420%"] }}
              transition={{ duration: 1.5, delay: 3.0, ease: "easeInOut" }}
            />
          </motion.span>
        </motion.div>

        <div className="relative mt-6 flex items-end gap-[0.05em] font-display text-3xl font-bold tracking-[0.28em]">
          {BRAND.split("").map((ch, i) => (
            <motion.span
              key={i}
              initial={{ y: 22, opacity: 0, filter: "blur(8px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              transition={{ delay: 2.6 + i * 0.06, duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
              className="inline-block bg-gradient-to-b from-[#fff8e1] via-[#f5c66b] to-[#b8862b] bg-clip-text text-transparent"
            >
              {ch}
            </motion.span>
          ))}
          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 3.4, duration: 0.7, ease: "easeInOut" }}
            style={{ transformOrigin: "left" }}
            className="absolute -bottom-3 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[color:var(--gold,#f5c66b)] to-transparent"
          />
        </div>
      </div>
    </>
  );
}
