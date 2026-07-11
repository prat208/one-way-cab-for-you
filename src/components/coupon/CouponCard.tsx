import { useRef } from "react";
import { Download, MessageCircle } from "lucide-react";

type Props = {
  code: string;
  customerName: string;
  discountPct: number;
  validUntil: string;
};

export function CouponCard({ code, customerName, discountPct, validUntil }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  async function downloadPng() {
    const svg = svgRef.current;
    if (!svg) return;
    const s = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([s], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej();
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const png = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = png;
    a.download = `${code}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function shareWhatsApp() {
    const text = `🎟 My ONE WAY CAB coupon: ${code} — ${discountPct}% off. Valid until ${validUntil}.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        ref={svgRef}
        viewBox="0 0 1200 630"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-2xl rounded-2xl shadow-2xl"
      >
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2b2620" />
            <stop offset="1" stopColor="#1a1612" />
          </linearGradient>
          <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FFC83D" />
            <stop offset="1" stopColor="#e0a520" />
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#bg)" />
        <text x="60" y="90" fontFamily="Outfit, sans-serif" fontSize="28" fill="#c9b99a" letterSpacing="4">
          ONE WAY CAB
        </text>
        <text x="60" y="180" fontFamily="Outfit, sans-serif" fontSize="64" fontWeight="700" fill="#faf8f5">
          {discountPct}% off your ride
        </text>
        <text x="60" y="230" fontFamily="Figtree, sans-serif" fontSize="24" fill="#c9b99a">
          Reserved for {customerName}
        </text>
        <rect x="60" y="290" width="1080" height="140" rx="16" fill="url(#gold)" />
        <text x="90" y="340" fontFamily="Figtree, sans-serif" fontSize="20" fill="#2b2620">
          COUPON CODE
        </text>
        <text
          x="90"
          y="405"
          fontFamily="monospace"
          fontSize="64"
          fontWeight="700"
          fill="#2b2620"
          letterSpacing="8"
        >
          {code}
        </text>
        <text x="60" y="490" fontFamily="Figtree, sans-serif" fontSize="22" fill="#c9b99a">
          Valid until {validUntil}
        </text>
        <text x="60" y="540" fontFamily="Figtree, sans-serif" fontSize="18" fill="#8b7355">
          Show this coupon to our sales team when booking. One coupon per customer.
        </text>
        <text x="60" y="590" fontFamily="Figtree, sans-serif" fontSize="14" fill="#8b7355">
          onewaycab · {new Date().toLocaleDateString()}
        </text>
      </svg>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={downloadPng}
          className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--gold)] px-4 py-2.5 text-sm font-semibold text-[#2b2620] hover:opacity-90"
        >
          <Download className="h-4 w-4" /> Download PNG
        </button>
        <button
          onClick={shareWhatsApp}
          className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--gold)]/40 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-[color:var(--gold)]/10"
        >
          <MessageCircle className="h-4 w-4" /> Share on WhatsApp
        </button>
      </div>
    </div>
  );
}
