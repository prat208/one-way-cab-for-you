import { motion } from "framer-motion";

export function HeroScene() {
  // Deterministic particle set so SSR matches CSR (no hydration diff).
  // Fewer particles on mobile for smoother scrolling & less GPU load.
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;
  const count = isMobile ? 8 : 22;
  const particles = Array.from({ length: count }, (_, i) => ({
    left: (i * 37) % 100,
    delay: (i * 0.7) % 12,
    duration: 10 + ((i * 3) % 14),
    size: 2 + (i % 4),
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Sky gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,212,255,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(255,200,61,0.18),transparent_50%)]" />

      {/* Stars */}
      <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_20%_20%,#ffffff33_1px,transparent_1.5px),radial-gradient(circle_at_70%_35%,#ffffff22_1px,transparent_1.5px),radial-gradient(circle_at_45%_15%,#ffffff33_1px,transparent_1.5px)] [background-size:220px_220px,320px_320px,180px_180px]" />

      {/* Clouds */}
      <div className="absolute top-[18%] left-0 h-24 w-full">
        <div className="cloud-drift-slow absolute top-0 h-24 w-56 rounded-full bg-white/[0.05] blur-2xl" />
      </div>
      <div className="absolute top-[28%] left-0 h-16 w-full">
        <div className="cloud-drift-fast absolute top-0 h-16 w-40 rounded-full bg-cyan-300/[0.06] blur-2xl" />
      </div>

      {/* Mountains — layered SVG parallax */}
      <svg
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
        className="absolute bottom-[26%] left-0 h-[38%] w-full opacity-70"
      >
        <defs>
          <linearGradient id="m1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f1738" />
            <stop offset="100%" stopColor="#050816" />
          </linearGradient>
        </defs>
        <path
          d="M0,320 L120,180 L240,260 L360,140 L520,240 L680,120 L820,220 L980,150 L1160,240 L1320,170 L1440,240 L1440,400 L0,400 Z"
          fill="url(#m1)"
        />
      </svg>
      <svg
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
        className="absolute bottom-[24%] left-0 h-[30%] w-full opacity-90"
      >
        <defs>
          <linearGradient id="m2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#131c40" />
            <stop offset="100%" stopColor="#050816" />
          </linearGradient>
        </defs>
        <path
          d="M0,340 L160,220 L300,300 L460,200 L620,290 L800,210 L960,290 L1140,220 L1300,300 L1440,240 L1440,400 L0,400 Z"
          fill="url(#m2)"
        />
      </svg>

      {/* Road ground */}
      <div className="absolute bottom-0 left-0 right-0 h-[26%] bg-gradient-to-b from-[#0a0f24] via-[#060a1c] to-black" />
      {/* Road markings */}
      <div className="absolute bottom-[9%] left-0 right-0 h-[3px] road-lines opacity-80" />
      <div className="absolute bottom-[6%] left-0 right-0 h-[2px] road-lines opacity-50" />

      {/* Rising particles */}
      {particles.map((p, i) => (
        <span
          key={i}
          className="particle absolute bottom-0 rounded-full bg-[color:var(--gold)]/60"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            filter: "blur(0.5px)",
          }}
        />
      ))}

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(5,8,22,0.85)_100%)]" />
    </div>
  );
}

import suvImg from "@/assets/hero-suv.png";

export function HeroCar() {
  return (
    <motion.div
      initial={{ x: "120%", opacity: 0 }}
      animate={{ x: "0%", opacity: 1 }}
      transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="pointer-events-none absolute bottom-[6%] left-0 right-0 z-10 mx-auto w-[92%] max-w-5xl"
      aria-hidden
    >
      <div className="relative float-slow">
        {/* Headlight glow */}
        <div className="headlight absolute -left-10 bottom-8 h-40 w-56 rounded-full bg-[radial-gradient(circle,rgba(255,220,120,0.55),transparent_70%)] blur-2xl" />
        {/* Underglow */}
        <div className="absolute bottom-1 left-[8%] right-[8%] h-6 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.6),transparent_65%)] blur-xl" />

        <img
          src={suvImg}
          alt="Premium SUV"
          width={1920}
          height={1024}
          className="relative w-full drop-shadow-[0_30px_40px_rgba(0,0,0,0.55)]"
        />

        {/* Spinning wheels overlay — positioned over the vehicle wheels */}
        <div className="wheel-spin absolute bottom-[6%] left-[17%] h-[9%] w-[9%] rounded-full border-2 border-white/20" />
        <div className="wheel-spin absolute bottom-[6%] right-[13%] h-[9%] w-[9%] rounded-full border-2 border-white/20" />
      </div>
    </motion.div>
  );
}
