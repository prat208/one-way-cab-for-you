import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { suggestPlaces } from "@/lib/booking.functions";

export function PlaceInput({
  value,
  onChange,
  placeholder,
  fallback = [],
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  fallback?: string[];
  className?: string;
}) {
  const runSuggest = useServerFn(suggestPlaces);
  const [items, setItems] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef(false);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (skipRef.current) {
      skipRef.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 2) {
      setItems(fallback.slice(0, 8));
      return;
    }
    const t = setTimeout(() => {
      runSuggest({ data: { q } })
        .then((r) => {
          const list = r.suggestions.length
            ? r.suggestions
            : fallback.filter((c) => c.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
          setItems(list);
        })
        .catch(() =>
          setItems(fallback.filter((c) => c.toLowerCase().includes(q.toLowerCase())).slice(0, 8)),
        );
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, runSuggest]);

  function pick(v: string) {
    skipRef.current = true;
    onChange(v);
    setOpen(false);
    setActive(-1);
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || items.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => (a + 1) % items.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => (a - 1 + items.length) % items.length);
          } else if (e.key === "Enter" && active >= 0) {
            e.preventDefault();
            pick(items[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        className={
          className ??
          "w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
        }
      />
      {open && items.length > 0 && (
        <ul className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-64 overflow-auto rounded-xl border border-white/10 bg-[#0a0f24] p-1 shadow-2xl">
          {items.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-xs leading-snug transition-colors ${
                  i === active
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:bg-white/5"
                }`}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
