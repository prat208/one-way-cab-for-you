import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C } from "../theme";
import { display, body } from "../fonts";

const WORD = "ONE WAY CAB";

export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const emblem = spring({ frame: frame - 4, fps, config: { damping: 14, stiffness: 90 } });
  const sweep = interpolate(frame, [6, 46], [-60, 130], { extrapolateRight: "clamp" });
  const lineW = interpolate(frame, [30, 62], [0, 420], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      {/* headlight sweep */}
      <div
        style={{
          position: "absolute",
          top: "42%",
          left: `${sweep}%`,
          width: "42%",
          height: 320,
          transform: "translate(-50%,-50%) skewX(-14deg)",
          background:
            "linear-gradient(90deg, transparent, rgba(245,198,107,0.30), transparent)",
          filter: "blur(6px)",
        }}
      />

      <Img
        src={staticFile("images/onewaycabs-emblem.png")}
        style={{
          width: 470,
          mixBlendMode: "screen",
          transform: `scale(${interpolate(emblem, [0, 1], [0.72, 1])}) translateY(${interpolate(
            emblem,
            [0, 1],
            [40, 0],
          )}px)`,
          opacity: emblem,
        }}
      />


      <div style={{ display: "flex", gap: 4, marginTop: 34 }}>
        {WORD.split("").map((ch, i) => {
          const s = spring({ frame: frame - 26 - i * 3, fps, config: { damping: 18 } });
          return (
            <span
              key={i}
              style={{
                ...display,
                fontSize: 78,
                letterSpacing: 2,
                color: C.cream,
                opacity: s,
                transform: `translateY(${interpolate(s, [0, 1], [46, 0])}px)`,
                display: "inline-block",
                minWidth: ch === " " ? 24 : undefined,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>

      <div
        style={{
          height: 2,
          width: lineW,
          marginTop: 26,
          background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
        }}
      />

      <div
        style={{
          ...body,
          marginTop: 26,
          fontSize: 30,
          letterSpacing: 8,
          color: C.muted,
          opacity: interpolate(frame, [52, 74], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        TOURS &amp; TRAVELS · KOLHAPUR
      </div>
    </AbsoluteFill>
  );
};
