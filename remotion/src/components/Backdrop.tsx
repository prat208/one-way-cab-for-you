import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, grad } from "../theme";

/** Persistent atmosphere: deep navy gradient, gold horizon glow, drifting sparks. */
export const Backdrop: React.FC<{ drift?: number }> = ({ drift = 1 }) => {
  const frame = useCurrentFrame();
  const glow = interpolate(frame % 240, [0, 120, 240], [0.35, 0.6, 0.35]);

  return (
    <AbsoluteFill style={{ background: grad }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(58% 34% at 50% 82%, rgba(245,198,107,${glow * 0.5}) 0%, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(44% 26% at 16% 12%, rgba(111,227,225,0.16) 0%, transparent 72%)`,
        }}
      />
      {new Array(16).fill(0).map((_, i) => {
        const seed = (i * 97) % 100;
        const x = (seed * 13) % 100;
        const speed = 0.35 + (i % 5) * 0.12;
        const y = (100 - ((frame * speed * drift + seed * 7) % 120)) as number;
        const size = 2 + (i % 3);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: 999,
              background: i % 3 === 0 ? C.cyan : C.gold,
              opacity: 0.35,
            }}
          />
        );
      })}
      {/* vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(75% 55% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
