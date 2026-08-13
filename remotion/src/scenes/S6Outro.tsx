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
import { body, display } from "../fonts";

export const S6Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const shine = interpolate(frame, [24, 70], [-40, 140], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", overflow: "hidden", padding: 20 }}>
        <Img
          src={staticFile("images/onewaycabs-logo-clean.png")}
          style={{
            width: 620,
            mixBlendMode: "screen",
            opacity: s,
            transform: `scale(${interpolate(s, [0, 1], [0.86, 1])})`,
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${shine}%`,
            width: "26%",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
            transform: "skewX(-16deg)",
          }}
        />
      </div>

      <div
        style={{
          ...display,
          fontSize: 58,
          color: C.cream,
          marginTop: 20,
          textAlign: "center",
          opacity: interpolate(frame, [22, 44], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        Outstation cabs,
        <br />
        <span style={{ color: C.gold }}>reimagined premium.</span>
      </div>

      <div
        style={{
          ...body,
          marginTop: 34,
          padding: "18px 40px",
          borderRadius: 999,
          border: `1px solid ${C.gold}55`,
          background: "rgba(245,198,107,0.10)",
          color: C.gold,
          fontSize: 30,
          letterSpacing: 2,
          opacity: interpolate(frame, [40, 62], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        one-way-cab-for-you.lovable.app
      </div>

      <div
        style={{
          ...body,
          marginTop: 22,
          fontSize: 24,
          letterSpacing: 5,
          color: C.muted,
          opacity: interpolate(frame, [56, 78], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        +91 89997 40424 · +91 94030 01415
      </div>
    </AbsoluteFill>
  );
};
