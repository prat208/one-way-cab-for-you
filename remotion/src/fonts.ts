import { loadFont as loadSora } from "@remotion/google-fonts/Sora";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";

const sora = loadSora("normal", { weights: ["600", "700"], subsets: ["latin"] });
const manrope = loadManrope("normal", { weights: ["400", "600"], subsets: ["latin"] });

export const display: React.CSSProperties = {
  fontFamily: sora.fontFamily,
  fontWeight: 700,
};

export const body: React.CSSProperties = {
  fontFamily: manrope.fontFamily,
  fontWeight: 500,
};
