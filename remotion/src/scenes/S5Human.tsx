import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Phone } from "../components/Phone";
import { Caption } from "../components/Caption";
import { C } from "../theme";
import { body, display } from "../fonts";

const STATS = [
  ["24×7", "Human support"],
  ["<20s", "Pickup on call"],
  ["100%", "Fare transparency"],
];

export const S5Human: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - 6, fps, config: { damping: 26, stiffness: 70 } });

  return (
    <AbsoluteFill style={{ padding: "150px 80px" }}>
      <Caption
        kicker="The USP"
        title={"Every ride begins\nwith a real human."}
      />

      <div
        style={{
          display: "flex",
          gap: 20,
          marginTop: 54,
        }}
      >
        {STATS.map(([v, l], i) => {
          const s = spring({ frame: frame - 24 - i * 8, fps, config: { damping: 18, stiffness: 160 } });
          return (
            <div
              key={l}
              style={{
                flex: 1,
                padding: "26px 20px",
                borderRadius: 24,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(111,227,225,0.22)",
                opacity: s,
                transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
              }}
            >
              <div style={{ ...display, fontSize: 52, color: C.gold }}>{v}</div>
              <div style={{ ...body, fontSize: 22, color: C.muted, marginTop: 6 }}>{l}</div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: -220,
          opacity: p,
          transform: `translateX(-50%) translateY(${interpolate(p, [0, 1], [400, Math.sin(frame / 28) * 6])}px)`,
        }}
      >
        <Phone src="images/home3.png" width={500} pan={[-40, -420]} duration={140} rotate={2} />
      </div>
    </AbsoluteFill>
  );
};
