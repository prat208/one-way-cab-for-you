import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Phone } from "../components/Phone";
import { Caption } from "../components/Caption";

export const S2Showcase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame: frame - 6, fps, config: { damping: 22, stiffness: 70 } });
  const float = Math.sin(frame / 26) * 8;

  return (
    <AbsoluteFill style={{ padding: "120px 80px", justifyContent: "flex-start" }}>
      <Caption
        kicker="The landing"
        title={"A premium first\nimpression."}
        sub="Cinematic brand intro, live hero scene and instant fare widget — built mobile-first."
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: -90,
          transform: `translateX(-50%) translateY(${interpolate(rise, [0, 1], [420, float])}px) scale(${interpolate(
            rise,
            [0, 1],
            [0.9, 1],
          )})`,
          opacity: rise,
        }}
      >
        <Phone src="images/home.png" width={540} pan={[0, -520]} duration={140} rotate={-3} />
      </div>

    </AbsoluteFill>
  );
};
