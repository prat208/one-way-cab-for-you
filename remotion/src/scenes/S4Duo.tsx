import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Phone } from "../components/Phone";
import { Caption } from "../components/Caption";

export const S4Duo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame: frame - 4, fps, config: { damping: 24, stiffness: 80 } });
  const b = spring({ frame: frame - 18, fps, config: { damping: 24, stiffness: 80 } });

  return (
    <AbsoluteFill style={{ padding: "120px 80px" }}>
      <Caption
        kicker="Book · Price · Confirm"
        title={"Transparent fares,\nzero surprises."}
        sub="Minimum-slab billing, coupon discounts and a live route map before you confirm."
      />

      <div
        style={{
          position: "absolute",
          left: 20,
          bottom: -60,
          opacity: a,
          transform: `translateY(${interpolate(a, [0, 1], [360, Math.sin(frame / 30) * 6])}px)`,
        }}
      >
        <Phone src="images/book.png" width={430} pan={[0, -300]} rotate={-6} duration={150} />
      </div>
      <div
        style={{
          position: "absolute",
          right: 20,
          bottom: -160,
          opacity: b,
          transform: `translateY(${interpolate(b, [0, 1], [420, Math.sin(frame / 24 + 1) * 7])}px)`,
        }}
      >
        <Phone src="images/rates.png" width={430} pan={[0, -360]} rotate={6} duration={150} />
      </div>

    </AbsoluteFill>
  );
};
