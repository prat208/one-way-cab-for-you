export function CabGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M4 18h56M10 18v-4l4-8h28l6 8v4M14 14h34"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="18" cy="19" r="3" fill="currentColor" />
      <circle cx="46" cy="19" r="3" fill="currentColor" />
      <path d="M50 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
