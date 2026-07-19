import { motion, useReducedMotion } from "framer-motion";
import logoFull from "@/assets/onewaycabs-logo-clean.png";
import logoEmblem from "@/assets/onewaycabs-emblem.png";

type Props = {
  className?: string;
  /** Enables the ambient glow + gentle float. Default true. */
  alive?: boolean;
  /** Tighter crop that hides the wordmark/phone block — good for tiny mounts (nav/footer). */
  crop?: boolean;
  alt?: string;
};

/**
 * Brand mark — the golden Onewaycabs emblem.
 * The image is imported from the CDN pointer so it lives outside the repo.
 * Wrapped in a motion layer that breathes softly and glints on hover.
 */
export function BrandLogo({ className, alive = true, crop = false, alt = "Onewaycabs" }: Props) {
  const reduce = useReducedMotion();
  const shouldAnimate = alive && !reduce;

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center ${className ?? ""}`}
      initial={shouldAnimate ? { opacity: 0, scale: 0.92 } : false}
      animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
      whileHover={shouldAnimate ? { rotate: [0, -2, 2, 0], transition: { duration: 0.9 } } : undefined}
    >
      {/* Golden aura */}
      {shouldAnimate && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full blur-2xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(245,198,107,0.55), rgba(245,198,107,0.15) 55%, transparent 75%)",
          }}
          animate={{ opacity: [0.55, 0.9, 0.55], scale: [0.95, 1.06, 0.95] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <motion.img
        src={logoAsset.url}
        alt={alt}
        draggable={false}
        className={`relative z-10 h-full w-full select-none object-contain ${crop ? "scale-[1.55] translate-y-[-4%]" : ""}`}
        animate={shouldAnimate ? { y: [0, -3, 0] } : undefined}
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          filter: shouldAnimate
            ? "drop-shadow(0 6px 22px rgba(245,198,107,0.35))"
            : "drop-shadow(0 4px 14px rgba(245,198,107,0.25))",
        }}
      />

      {/* Headlight sweep on hover / loop */}
      {shouldAnimate && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
        >
          <motion.span
            className="absolute inset-y-0 -left-1/3 w-1/3"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)",
              mixBlendMode: "screen",
            }}
            animate={{ x: ["0%", "400%"] }}
            transition={{ duration: 5.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 2.4 }}
          />
        </motion.span>
      )}
    </motion.div>
  );
}
