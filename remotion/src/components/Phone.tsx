import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C } from "../theme";

type Props = {
  src: string;
  /** scroll travel in px across the clip */
  pan?: [number, number];
  width?: number;
  rotate?: number;
  style?: React.CSSProperties;
  duration?: number;
};

/** Device frame with an inner screenshot that slowly pans, like a scroll-through. */
export const Phone: React.FC<Props> = ({
  src,
  pan = [0, -420],
  width = 470,
  rotate = 0,
  style,
  duration = 140,
}) => {
  const frame = useCurrentFrame();
  const height = width * 2.02;
  const y = interpolate(frame, [0, duration], pan, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width,
        height,
        borderRadius: width * 0.11,
        padding: 10,
        background: "linear-gradient(150deg, #22304C, #0B1220)",
        boxShadow: `0 40px 90px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,198,107,0.25)`,
        transform: `rotate(${rotate}deg)`,
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: width * 0.09,
          overflow: "hidden",
          background: C.ink,
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transform: `translateY(${y}px)`,
          }}
        />
        {/* screen sheen */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(115deg, rgba(255,255,255,0.10) 0%, transparent 38%, transparent 70%, rgba(255,255,255,0.05) 100%)",
          }}
        />
      </div>
    </div>
  );
};
