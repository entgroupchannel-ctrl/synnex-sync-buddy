import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ShoppingCart, Search, Menu, Home, Grid3x3, User, X, LogOut, Package, MapPin, Building2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { CATEGORIES } from "@/lib/cart";
import { useSupabaseUser } from "@/lib/auth-sheet";
import { AddToCartSheet } from "@/components/add-to-cart-sheet";
import { useLanguage } from "@/lib/i18n";
import entLogo from "@/assets/entgroup-logo.jpg.asset.json";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const NAV_CATS = ["ทั้งหมด", ...CATEGORIES] as const;

export function SiteHeader() {
  const { count } = useCart();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useSupabaseUser();
  const { lang, t, setLang } = useLanguage();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/", search: { q, category: "all" } as never });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success(lang === "th" ? "ออกจากระบบแล้ว" : "Signed out");
    navigate({ to: "/", replace: true });
  };

  const LangToggle = ({ className = "" }: { className?: string }) => (
    <div className={`inline-flex overflow-hidden rounded-full border border-white/20 bg-white/5 text-xs ${className}`}>
      <button
        onClick={() => setLang("th")}
        className={`px-2.5 py-1 transition ${lang === "th" ? "bg-white text-[color:var(--brand-navy)] font-semibold" : "text-white/80 hover:bg-white/10"}`}
        aria-label="ภาษาไทย"
      >🇹🇭 TH</button>
      <button
        onClick={() => setLang("en")}
        className={`px-2.5 py-1 transition ${lang === "en" ? "bg-white text-[color:var(--brand-navy)] font-semibold" : "text-white/80 hover:bg-white/10"}`}
        aria-label="English"
      >EN</button>
    </div>
  );

  return (
    <>
      <AddToCartSheet />
      <div className="bg-slate-900 text-white/80 text-xs">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5">
          <div>ส่วนหนึ่งของ <span className="font-semibold text-white">ENT Group Co., Ltd.</span> · โทร <a href="tel:020456104" className="hover:text-[color:var(--brand-green)]">02-045-6104</a></div>
          <a href="https://entgroup.co.th" target="_blank" rel="noopener noreferrer" className="hover:text-[color:var(--brand-green)]">🔗 entgroup.co.th</a>
        </div>
      </div>
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
            <div className="grid h-9 w-11 place-items-center rounded-md bg-[color:var(--brand-green)] font-black tracking-tight">ENT</div>
            <div className="hidden sm:block">
              <div className="text-lg font-bold leading-tight">Group IT Shop</div>
              <div className="text-[10px] leading-tight text-white/60">Authorized Dealer — Synnex & VST ECS</div>
            </div>
          </Link>

          <form onSubmit={submit} className="flex flex-1 items-stretch overflow-hidden rounded-lg bg-white text-slate-900 shadow-sm">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("nav.search")}
              className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-slate-400"
              maxLength={100}
            />
            <button
              type="submit"
              className="grid w-12 place-items-center bg-[color:var(--brand-orange)] text-white transition hover:bg-[color:var(--brand-orange-dark)]"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>

          <LangToggle className="hidden lg:inline-flex" />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden shrink-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-white/10 lg:inline-flex">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-[color:var(--brand-green)] text-xs font-bold">
                  {(user.email?.[0] ?? "U").toUpperCase()}
                </div>
                <span className="max-w-[10rem] truncate">{user.email}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/my-account/orders"><Package className="mr-2 h-4 w-4" /> {t("nav.orders")}</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/my-account/profile"><User className="mr-2 h-4 w-4" /> {t("nav.profile")}</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/my-account/addresses"><MapPin className="mr-2 h-4 w-4" /> {t("nav.addresses")}</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/admin/orders"><Building2 className="mr-2 h-4 w-4" /> Admin</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={signOut}><LogOut className="mr-2 h-4 w-4" /> {t("nav.signout")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden shrink-0 items-center gap-1 lg:flex">
              <Link to="/auth" search={{ tab: "signin" } as never} className="rounded-md px-3 py-1.5 text-sm hover:bg-white/10">{t("nav.login")}</Link>
              <Link to="/auth" search={{ tab: "b2c" } as never} className="rounded-md bg-[color:var(--brand-green)] px-3 py-1.5 text-sm font-semibold hover:opacity-90">{t("nav.register")}</Link>
            </div>
          )}

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
                  {c === "ทั้งหมด" ? t("nav.all") : c}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-y-0 left-0 w-72 bg-white p-4 shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div className="font-bold text-[color:var(--brand-navy)]">{t("nav.categories")}</div>
              <button onClick={() => setMenuOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="mb-3 flex justify-center">
              <div className="inline-flex overflow-hidden rounded-full border text-xs">
                <button onClick={() => setLang("th")} className={`px-3 py-1 ${lang === "th" ? "bg-[color:var(--brand-navy)] text-white" : "text-slate-600"}`}>🇹🇭 TH</button>
                <button onClick={() => setLang("en")} className={`px-3 py-1 ${lang === "en" ? "bg-[color:var(--brand-navy)] text-white" : "text-slate-600"}`}>EN</button>
              </div>
            </div>
            {user ? (
              <div className="mb-4 rounded-lg border p-3">
                <div className="truncate text-xs text-slate-500">{user.email}</div>
                <div className="mt-2 grid gap-1 text-sm">
                  <Link to="/my-account/orders" onClick={() => setMenuOpen(false)} className="rounded px-2 py-1 hover:bg-slate-100">{t("nav.orders")}</Link>
                  <Link to="/my-account/profile" onClick={() => setMenuOpen(false)} className="rounded px-2 py-1 hover:bg-slate-100">{t("nav.profile")}</Link>
                  <Link to="/my-account/addresses" onClick={() => setMenuOpen(false)} className="rounded px-2 py-1 hover:bg-slate-100">{t("nav.addresses")}</Link>
                  <button onClick={signOut} className="text-left rounded px-2 py-1 text-red-600 hover:bg-red-50">{t("nav.signout")}</button>
                </div>
              </div>
            ) : (
              <div className="mb-4 grid gap-2">
                <Link to="/auth" search={{ tab: "signin" } as never} onClick={() => setMenuOpen(false)} className="rounded-md border px-3 py-2 text-center text-sm">{t("nav.login")}</Link>
                <Link to="/auth" search={{ tab: "b2c" } as never} onClick={() => setMenuOpen(false)} className="rounded-md bg-[color:var(--brand-green)] px-3 py-2 text-center text-sm font-semibold text-white">{t("nav.register")}</Link>
              </div>
            )}
            <div className="mb-2 text-xs font-bold uppercase text-slate-400">{t("nav.categories")}</div>
            <div className="space-y-1">
              {NAV_CATS.map((c) => (
                <Link
                  key={c}
                  to="/"
                  search={{ category: c === "ทั้งหมด" ? "all" : c } as never}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm hover:bg-slate-100"
                >
                  {c === "ทั้งหมด" ? t("nav.all") : c}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-white text-xs shadow-lg lg:hidden">
        <Link to="/" className="flex flex-col items-center gap-0.5 py-2 text-slate-700">
          <Home className="h-5 w-5" /> {t("nav.home")}
        </Link>
        <button onClick={() => setMenuOpen(true)} className="flex flex-col items-center gap-0.5 py-2 text-slate-700">
          <Grid3x3 className="h-5 w-5" /> {t("nav.categories")}
        </button>
        <Link to="/cart" className="relative flex flex-col items-center gap-0.5 py-2 text-slate-700">
          <ShoppingCart className="h-5 w-5" />
          {t("nav.cart")}
          {count > 0 && (
            <span className="absolute right-4 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[color:var(--brand-orange)] px-1 text-[9px] font-bold text-white">
              {count}
            </span>
          )}
        </Link>
        <Link to={user ? "/my-account/orders" : "/auth"} search={user ? undefined : ({ tab: "signin" } as never)} className="flex flex-col items-center gap-0.5 py-2 text-slate-700">
          <User className="h-5 w-5" /> {user ? t("nav.account") : t("nav.login")}
        </Link>
      </nav>
      <div className="h-14 lg:hidden" aria-hidden />
    </>
  );
}
