import { motion } from "framer-motion";
import heroImg from "@/assets/hero-city-car.jpg";

/**
 * Hero backdrop: cinematic dusk highway photo behind a deep-navy scrim so the
 * headline and booking card stay readable.
 */
export function HeroScene() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <img
        src={heroImg}
        alt=""
        width={1920}
        height={1088}
        className="absolute inset-0 h-full w-full object-cover object-right"
      />
      <div className="absolute inset-0 bg-[linear-gradient(100deg,#0B1533_10%,rgba(11,21,51,0.92)_40%,rgba(11,21,51,0.45)_65%,rgba(11,21,51,0.25)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}

/** Kept for API compatibility — the car now lives in the hero photograph. */
export function HeroCar() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="pointer-events-none absolute inset-0 z-10"
      aria-hidden
    />
  );
}
