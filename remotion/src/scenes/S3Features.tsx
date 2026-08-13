import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";
import { body, display } from "../fonts";
import { Caption } from "../components/Caption";

const FEATURES = [
  ["Live fare calculator", "Any Maharashtra route, per-km pricing"],
  ["5-step booking wizard", "Place autocomplete + route map"],
  ["AI concierge", "Plans the trip, picks the right cab"],
  ["Coupon engine", "Admin-generated codes, instant discount"],
  ["Admin CRM", "Leads, bookings, drivers, CSV export"],
  ["Instant alerts", "Every booking pushed to WhatsApp"],
];

export const S3Features: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: "180px 80px" }}>
      <Caption kicker="What's inside" title={"Everything the\nagency runs on."} />
      <div style={{ marginTop: 70, display: "flex", flexDirection: "column", gap: 22 }}>
        {FEATURES.map(([t, d], i) => {
          const s = spring({ frame: frame - 26 - i * 7, fps, config: { damping: 20, stiffness: 140 } });
          return (
            <div
              key={t}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 26,
                padding: "26px 30px",
                borderRadius: 26,
                background: "rgba(255,255,255,0.045)",
                border: "1px solid rgba(245,198,107,0.18)",
                opacity: s,
                transform: `translateX(${interpolate(s, [0, 1], [-70, 0])}px)`,
              }}
            >
              <div
                style={{
                  ...display,
                  width: 60,
                  height: 60,
                  flexShrink: 0,
                  borderRadius: 18,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 26,
                  color: C.ink,
                  background: `linear-gradient(140deg, ${C.gold}, ${C.goldDeep})`,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <div style={{ ...display, fontSize: 36, color: C.cream }}>{t}</div>
                <div style={{ ...body, fontSize: 25, color: C.muted, marginTop: 4 }}>{d}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
