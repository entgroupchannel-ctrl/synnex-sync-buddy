import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ShoppingCart, Search, Menu, Home, Grid3x3, User, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { CATEGORIES } from "@/lib/cart";

const NAV_CATS = ["ทั้งหมด", ...CATEGORIES] as const;

export function SiteHeader() {
  const { count } = useCart();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/", search: { q, category: "all" } as never });
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[color:var(--brand-navy)] text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <button
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md hover:bg-white/10 lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="เมนู"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-[color:var(--brand-orange)] font-black">IT</div>
            <div className="hidden sm:block">
              <div className="text-lg font-bold leading-tight">IT Dealer</div>
              <div className="text-[10px] leading-tight text-white/60">ราคา Dealer จริง</div>
            </div>
          </Link>

          <form onSubmit={submit} className="flex flex-1 items-stretch overflow-hidden rounded-lg bg-white text-slate-900 shadow-sm">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาสินค้า, SKU, ยี่ห้อ..."
              className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-slate-400"
              maxLength={100}
            />
            <button
              type="submit"
              className="grid w-12 place-items-center bg-[color:var(--brand-orange)] text-white transition hover:bg-[color:var(--brand-orange-dark)]"
              aria-label="ค้นหา"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>

          <Link
            to="/cart"
            className="relative grid h-10 w-10 shrink-0 place-items-center rounded-md hover:bg-white/10"
            aria-label="ตะกร้า"
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[color:var(--brand-orange)] px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>

        <nav className="hidden border-t border-white/10 bg-[color:var(--brand-navy-2)] lg:block">
          <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 no-scrollbar">
            {NAV_CATS.map((c) => {
              const cat = c === "ทั้งหมด" ? "all" : c;
              const active = pathname === "/" && (typeof window !== "undefined") && new URLSearchParams(window.location.search).get("category") === cat;
              return (
                <Link
                  key={c}
                  to="/"
                  search={{ category: cat } as never}
                  className={`whitespace-nowrap px-3 py-2.5 text-sm transition hover:text-[color:var(--brand-orange)] ${
                    active ? "text-[color:var(--brand-orange)]" : "text-white/85"
                  }`}
                >
                  {c}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-y-0 left-0 w-72 bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div className="font-bold text-[color:var(--brand-navy)]">หมวดหมู่</div>
              <button onClick={() => setMenuOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-1">
              {NAV_CATS.map((c) => (
                <Link
                  key={c}
                  to="/"
                  search={{ category: c === "ทั้งหมด" ? "all" : c } as never}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm hover:bg-slate-100"
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-white text-xs shadow-lg lg:hidden">
        <Link to="/" className="flex flex-col items-center gap-0.5 py-2 text-slate-700">
          <Home className="h-5 w-5" /> หน้าแรก
        </Link>
        <button onClick={() => setMenuOpen(true)} className="flex flex-col items-center gap-0.5 py-2 text-slate-700">
          <Grid3x3 className="h-5 w-5" /> หมวดหมู่
        </button>
        <Link to="/cart" className="relative flex flex-col items-center gap-0.5 py-2 text-slate-700">
          <ShoppingCart className="h-5 w-5" />
          ตะกร้า
          {count > 0 && (
            <span className="absolute right-4 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[color:var(--brand-orange)] px-1 text-[9px] font-bold text-white">
              {count}
            </span>
          )}
        </Link>
        <Link to="/auth" className="flex flex-col items-center gap-0.5 py-2 text-slate-700">
          <User className="h-5 w-5" /> บัญชี
        </Link>
      </nav>
      <div className="h-14 lg:hidden" aria-hidden />
    </>
  );
}
