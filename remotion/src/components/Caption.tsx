import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";
import { body, display } from "../fonts";

export const Caption: React.FC<{
  kicker: string;
  title: string;
  sub?: string;
  delay?: number;
  align?: "left" | "center";
}> = ({ kicker, title, sub, delay = 0, align = "left" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  const s2 = spring({ frame: frame - delay - 8, fps, config: { damping: 200 } });

  return (
    <div style={{ textAlign: align, maxWidth: 900 }}>
      <div
        style={{
          ...body,
          fontSize: 26,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: C.gold,
          opacity: s,
          transform: `translateY(${interpolate(s, [0, 1], [22, 0])}px)`,
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          ...display,
          fontSize: 68,
          lineHeight: 1.06,
          color: C.cream,
          marginTop: 14,
          opacity: s2,
          transform: `translateY(${interpolate(s2, [0, 1], [34, 0])}px)`,
        }}
      >
        {title}
      </div>
      {sub ? (
        <div
          style={{
            ...body,
            fontSize: 30,
            lineHeight: 1.35,
            color: C.muted,
            marginTop: 16,
            opacity: interpolate(frame, [delay + 16, delay + 34], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};
