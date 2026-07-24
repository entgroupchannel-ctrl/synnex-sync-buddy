import { Link } from "@tanstack/react-router";
import { useState, useRef } from "react";

type Item = { icon: string; title: string; sub: string; q: string };

const ITEMS: Item[] = [
  { icon: "📱", title: "iPhone",       sub: "iPhone 17 Series",  q: "iPhone" },
  { icon: "💻", title: "MacBook Air",  sub: "M5 Chip",           q: "MacBook Air" },
  { icon: "📱", title: "iPad",         sub: "iPad Pro, Air",     q: "iPad" },
  { icon: "💻", title: "MacBook Pro",  sub: "M5 Pro Chip",       q: "MacBook Pro" },
  { icon: "🖥", title: "iMac",         sub: '24" M5',            q: "iMac" },
  { icon: "🖥", title: "Mac Mini",     sub: "M5 Chip",           q: "Mac Mini" },
  { icon: "⌚", title: "Apple Watch",  sub: "Series 10",         q: "Watch" },
  { icon: "🎧", title: "AirPods",      sub: "Pro, Max",          q: "AirPods" },
];

export function AppleMegaMenu() {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <Link
        to="/"
        search={{ brands: "APPLE" } as never}
        className="flex items-center gap-1 whitespace-nowrap px-3 py-2.5 text-sm font-medium text-white/90 transition hover:text-white"
        style={{ color: open ? "#fff" : undefined }}
      >
        🍎 <span>Apple</span>
      </Link>
      {open && (
        <div
          className="absolute left-0 top-full z-50 w-[560px] rounded-xl bg-white p-5 text-slate-900 shadow-2xl ring-1 ring-slate-200"
          style={{ borderTop: "3px solid #1d1d1f" }}
        >
          <div className="mb-3 text-sm font-bold text-[#1d1d1f]">🍎 Apple Products</div>
          <div className="grid grid-cols-2 gap-2">
            {ITEMS.map((it) => (
              <Link
                key={it.title}
                to="/"
                search={{ q: it.q, brands: "APPLE" } as never}
                onClick={() => setOpen(false)}
                className="group flex items-start gap-3 rounded-lg p-2 transition hover:bg-[#f5f5f7]"
              >
                <span className="text-xl leading-none">{it.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-[#1d1d1f] group-hover:text-[#1d4ed8]">{it.title}</div>
                  <div className="text-xs text-slate-500">{it.sub}</div>
                </div>
              </Link>
            ))}
          </div>
          <Link
            to="/"
            search={{ brands: "APPLE" } as never}
            onClick={() => setOpen(false)}
            className="mt-4 block rounded-lg bg-[#1d1d1f] px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-black"
          >
            ดู Apple ทั้งหมด →
          </Link>
        </div>
      )}
    </div>
  );
}
