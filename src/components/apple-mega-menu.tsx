import { Link } from "@tanstack/react-router";
import { useState, useRef } from "react";

function AppleLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" className={className} fill="currentColor" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
    </svg>
  );
}

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
        <AppleLogo className="h-4 w-4 text-white" /> <span>Apple</span>
      </Link>
      {open && (
        <div
          className="absolute left-0 top-full z-50 w-[560px] rounded-xl bg-white p-5 text-slate-900 shadow-2xl ring-1 ring-slate-200"
          style={{ borderTop: "3px solid #1d1d1f" }}
        >
          <AppleLogo className="mb-3 h-4 w-4 text-[#1d1d1f]" />
          <div className="mb-3 -mt-5 pl-6 text-sm font-bold text-[#1d1d1f]">Apple Products</div>
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
