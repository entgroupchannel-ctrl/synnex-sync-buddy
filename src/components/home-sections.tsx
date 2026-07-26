import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Laptop, Monitor, Printer, Cpu, Smartphone, Wifi, HardDrive, Package,
  Cable, LayoutGrid, ShoppingCart, Truck, Award, FileText, Phone, ArrowRight,
  ChevronLeft, ChevronRight, Mail, Flame, ShieldCheck, Building2, Warehouse, MonitorCog, Sun,
  Home, Shield, Camera, Wrench, Server, Clock, Tag, DollarSign, Sparkles,
  Receipt, CreditCard, Headphones, Network as NetworkIcon, BatteryCharging,
  Volume2, Bluetooth,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import heroWarehouse from "@/assets/hero-warehouse.jpg";

function AppleLogoSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" className={className} fill="currentColor" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
    </svg>
  );
}
import heroEnterprise from "@/assets/hero-enterprise.jpg";
import heroDelivery from "@/assets/hero-delivery.jpg";
import { displayPrice, getSellingPrice, priceFmt, useCustomerTier } from "@/lib/cart";
import { triggerAuthPrompt, useSupabaseUser } from "@/lib/auth-sheet";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/i18n";
import { ProductImage } from "@/components/product-image";
import { SaleBadge, UrgencyIndicator } from "@/components/sale-badge";
import { getProductBadge } from "@/lib/product-badge";
import { BrandLogo } from "@/components/brand-logo";
import { getBrandLogoUrl } from "@/lib/brand-assets";
import { StockBadge } from "@/components/stock-badge";
import { WarrantyBadge } from "@/components/warranty-badge";
import { DiscountBadgeRow } from "@/components/discount-badge";
import { SpecTagsCompact } from "@/components/spec-tags";
import { hasSpecTags } from "@/lib/parse-spec";


/* ---------- Hero Carousel (compact, split layout) ---------- */

import promoClearance from "@/assets/promo-clearance.jpg";
import promoGaming from "@/assets/promo-gaming.jpg";
import promoBusiness from "@/assets/promo-business.jpg";

type Trust = { icon: typeof Flame; title: string; sub: string };

type Promo = {
  image: string;
  tag: string;
  title: string;
  subtitle: string;
  action: () => void;
  tint: string; // gradient overlay
};

export function HeroCarousel({ onBrowse, onReady }: { onBrowse: () => void; onReady: () => void }) {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  const promos: Promo[] = useMemo(() => [
    {
      image: promoClearance,
      tag: "CLEARANCE",
      title: "ล้างสต๊อก ราคาพิเศษ",
      subtitle: "ลดสูงสุด 50% เฉพาะสินค้าคงเหลือ",
      action: onReady,
      tint: "from-red-900/70 via-red-800/30 to-transparent",
    },
    {
      image: promoGaming,
      tag: "GAMING",
      title: "Gaming Notebook",
      subtitle: "แรง เย็น คุ้ม พร้อมส่งจากไทย",
      action: () => navigate({ to: "/", search: { category: "Notebook" } as never }),
      tint: "from-purple-900/70 via-fuchsia-900/30 to-transparent",
    },
    {
      image: promoBusiness,
      tag: "BUSINESS",
      title: "Office Essentials",
      subtitle: "ราคาองค์กร + ใบกำกับภาษี",
      action: onBrowse,
      tint: "from-emerald-900/70 via-emerald-800/30 to-transparent",
    },
  ], [onBrowse, onReady, navigate]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((v) => (v + 1) % promos.length), 4500);
    return () => clearInterval(t);
  }, [paused, promos.length]);

  const trust: Trust[] = [
    { icon: ShieldCheck, title: "สินค้าแท้ 100%", sub: "ENT Group IT Shop" },
    { icon: Building2,   title: "8,000+ องค์กร", sub: "ไว้วางใจ ENT Group" },
    { icon: Truck,       title: "พร้อมส่งจากไทย", sub: "1-3 วันทั่วประเทศ" },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[color:var(--brand-navy)] via-[color:var(--brand-navy-2)] to-[color:var(--brand-navy)]">
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, #f97316 0, transparent 40%), radial-gradient(circle at 85% 80%, #10b981 0, transparent 40%)",
        }}
      />
      <div className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-2 md:gap-8 md:py-10">
        {/* LEFT — compact message + trust chips */}
        <div className="flex flex-col justify-center">
          <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
            <Flame className="h-3.5 w-3.5 text-[color:var(--brand-orange)]" />
            สินค้าแท้ 100% • ENT Group IT Shop
          </div>
          <h1 className="text-2xl font-black leading-tight text-white md:text-4xl">
            ราคา Dealer จริง <span className="text-[color:var(--brand-orange)]">พร้อมส่งจากสต๊อกไทย</span>
          </h1>
          <p className="mt-2 max-w-md text-sm text-white/80 md:text-base">
            IT ครบครัน สำหรับลูกค้าทั่วไป · สมาชิก · องค์กร — ประกันศูนย์ไทยเต็มรูปแบบ
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" className="bg-[color:var(--brand-orange)] font-bold text-white hover:bg-[color:var(--brand-orange-dark)]" onClick={onBrowse}>
              เริ่มช้อป / Shop Now
            </Button>
            <Button size="sm" variant="outline" className="border-white/30 bg-white/5 font-semibold text-white backdrop-blur hover:bg-white/15 hover:text-white" onClick={onReady}>
              สินค้าแนะนำ
            </Button>
          </div>

          {/* trust chips */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            {trust.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.title} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 backdrop-blur">
                  <Icon className="h-4 w-4 shrink-0 text-[color:var(--brand-orange)]" />
                  <div className="min-w-0">
                    <div className="truncate text-[11px] font-bold text-white md:text-xs">{t.title}</div>
                    <div className="truncate text-[10px] text-white/60">{t.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — animated promo slider */}
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-2xl md:aspect-[4/3]"
        >
          {promos.map((p, idx) => (
            <button
              key={p.tag}
              onClick={p.action}
              className={`absolute inset-0 block h-full w-full text-left transition-opacity duration-700 ease-out ${
                idx === i ? "z-10 opacity-100" : "z-0 opacity-0"
              }`}
              aria-hidden={idx !== i}
              tabIndex={idx === i ? 0 : -1}
            >
              <img
                src={p.image}
                alt={p.title}
                className={`h-full w-full object-cover transition-transform duration-[6000ms] ease-out ${
                  idx === i ? "scale-110" : "scale-100"
                }`}
                loading={idx === 0 ? "eager" : "lazy"}
                width={800}
                height={1000}
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${p.tint}`} />
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                <span className="mb-2 inline-block rounded-md bg-[color:var(--brand-orange)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow">
                  {p.tag}
                </span>
                <div className="text-lg font-black leading-tight text-white drop-shadow-lg md:text-2xl">{p.title}</div>
                <div className="mt-0.5 text-xs text-white/90 drop-shadow md:text-sm">{p.subtitle}</div>
                <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--brand-orange)] md:text-sm">
                  ดูเลย <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </button>
          ))}

          {/* dots */}
          <div className="absolute right-3 top-3 z-20 flex gap-1.5">
            {promos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
                aria-label={`Promo ${idx + 1}`}
              />
            ))}
          </div>

          {/* arrows */}
          <button
            onClick={() => setI((v) => (v - 1 + promos.length) % promos.length)}
            className="absolute left-2 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
            aria-label="Previous promo"
          ><ChevronLeft className="h-4 w-4" /></button>
          <button
            onClick={() => setI((v) => (v + 1) % promos.length)}
            className="absolute right-2 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
            aria-label="Next promo"
          ><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </section>
  );
}

/* ---------- Quick category icon grid ---------- */

type QuickCat =
  | { icon: LucideIcon; label: string; sub: string; cat: string; brand?: undefined; bg?: undefined; emoji?: undefined }
  | { emoji: string; label: string; sub: string; brand: string; bg: string; cat?: undefined; icon?: undefined };

const QUICK_CATS: QuickCat[] = [
  { icon: Laptop,     label: "Notebook",     sub: "Notebook",       cat: "Notebook" },
  { emoji: "",       label: "Apple",         sub: "Apple Products", brand: "APPLE", bg: "#f5f5f7" },
  { icon: Monitor,    label: "Monitor",      sub: "Monitor",        cat: "Monitor" },
  { icon: Printer,    label: "Printer",      sub: "Printer",        cat: "Printer" },
  { icon: Cpu,        label: "PC / Desktop", sub: "PC & Desktop",   cat: "PC" },
  { icon: MonitorCog, label: "คอมพิวเตอร์ชุด", sub: "Computer Set",   cat: "Computer Set" },
  { icon: Cpu,        label: "ชิ้นส่วน/CPU",  sub: "Components",     cat: "Components" },
  { icon: Package,    label: "Software",     sub: "Software",       cat: "Software" },
  { icon: Cable,      label: "อุปกรณ์เสริม",   sub: "Accessories",    cat: "Accessories" },
  { icon: Wifi,       label: "Network",      sub: "Network",        cat: "Network" },
  { icon: HardDrive,  label: "Storage",      sub: "Storage",        cat: "Storage" },
  { icon: Smartphone, label: "สมาร์ตโฟน",     sub: "Smart Phone",    cat: "Smart Phone & Tablet" },
  { icon: Sun,        label: "โซลาร์และพลังงาน", sub: "Solar & Energy", cat: "Solar & Energy" },
  { icon: Home,       label: "Smart Life",   sub: "IoT & Security", cat: "Smart Life" },
  { icon: Volume2,    label: "Speaker & Audio", sub: "JBL · Harman", cat: "Speaker & Audio" },
];

export function QuickCategoryGrid() {
  const navigate = useNavigate();
  return (
    <section className="border-b bg-white lg:hidden">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 sm:gap-2 lg:grid-cols-10 lg:gap-2">
          {QUICK_CATS.map((c) => {
            const isBrand = "brand" in c && c.brand;
            const search = isBrand ? { brands: c.brand } : { category: c.cat };
            return (
              <Link
                key={c.label}
                to="/"
                search={search as never}
                onClick={(e) => {
                  e.preventDefault();
                  navigate({ to: "/", search: search as never });
                  setTimeout(() => {
                    document.getElementById("product-grid")?.scrollIntoView({ behavior: "smooth" });
                  }, 300);
                }}
                className="group block"
              >
                <div className="flex flex-col items-center justify-center aspect-square rounded-xl border border-slate-200 bg-white p-3 transition-all duration-200 hover:border-green-500 hover:shadow-sm cursor-pointer">
                  <div className="mb-1.5 text-slate-500 transition group-hover:text-[color:var(--brand-green)]">
                    {c.icon ? (
                      <c.icon className="h-6 w-6" />
                    ) : "brand" in c && c.brand === "APPLE" ? (
                      <svg viewBox="0 0 814 1000" className="h-6 w-6 text-slate-800" fill="currentColor" aria-hidden>
                        <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.2 0 663 0 541.8c0-207.1 134.7-316.6 266.8-316.6 70.5 0 129.2 46.5 173.8 46.5 42.8 0 109.7-49.2 187.5-49.2zM649.3 97.2c31.2-38.5 53.3-91.6 53.3-144.7 0-8.3-.6-16.6-2-24.3-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 85.5-55.1 139.3 0 9 1.3 18 2 20.9 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.3-68.3z"/>
                      </svg>
                    ) : (
                      <span className="text-xl leading-none">{c.emoji}</span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-700 text-center leading-tight line-clamp-2">
                    {c.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}


/* ---------- Today's Best Deals ---------- */

type ProductRow = Record<string, unknown> & {
  id: string; sku: string; slug: string | null; name: string | null;
  image_url: string | null; brand: string | null; category: string | null;
  price: number | null; selling_price: number | null; price_approved: boolean | null;
  stock_status: string | null; stock_qty: number | null; distributor: string | null;
};

function useAddToCart() {
  const tier = useCustomerTier();
  const { add } = useCart();
  const { user } = useSupabaseUser();
  return (p: ProductRow) => {
    const name = p.name ?? p.sku;
    if (Number(p.selling_price ?? 0) > 70000) {
      toast.error("สินค้านี้ราคาเกิน ฿70,000 กรุณาขอใบเสนอราคาที่หน้ารายละเอียดสินค้า");
      return;
    }
    add({
      id: p.id, sku: p.sku, slug: p.slug, name,
      price: getSellingPrice(p, tier) ?? 0,
      image_url: p.image_url, distributor: p.distributor,
      category: (p as { category?: string | null }).category ?? null,
    });
    if (!user) triggerAuthPrompt({ name, sku: p.sku, image_url: p.image_url });
    else toast.success(`เพิ่ม ${p.sku} ลงตะกร้าแล้ว`);
  };
}

export function TodaysBestDeals() {
  const tier = useCustomerTier();
  const addToCart = useAddToCart();
  const q = useQuery({
    queryKey: ["todays-best"],
    queryFn: async () => {
      const { data } = await supabase.from("synnex_products")
        .select("*")
        .eq("price_approved", true).gt("selling_price", 0)
        .gt("selling_price", 0)
        .not("image_url", "is", null)
        .order("selling_price", { ascending: true })
        .limit(10);
      return (data ?? []) as ProductRow[];
    },
    staleTime: 5 * 60_000,
  });

  if ((q.data?.length ?? 0) === 0) return null;

  return (
    <section className="border-b bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SectionHeader title={<span className="inline-flex items-center gap-2"><Flame className="h-5 w-5 text-red-500 animate-pulse" />ดีลวันนี้</span>} en={<span className="inline-flex items-center gap-2"><Flame className="h-5 w-5 text-red-500 animate-pulse" />Today's Best Deals</span>} />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          {q.data!.map((p, idx) => {
            const ready = p.stock_status === "พร้อมจัดส่ง";
            const slug = p.slug || p.id;
            const selling = getSellingPrice(p, tier) ?? 0;
            const freeShip = selling > 5000;
            const badge = getProductBadge(p, idx);
            return (
              <div key={p.id} className="group relative flex overflow-hidden rounded-lg border bg-white transition hover:shadow-lg lg:flex-col">
                {badge && (
                  <div className="absolute left-2 top-2 z-10">
                    <SaleBadge type={badge} />
                  </div>
                )}
                <Link to="/product/$slug" params={{ slug }} className="grid h-32 w-36 shrink-0 place-items-center bg-white p-2 lg:h-40 lg:w-full">
                  <ProductImage src={p.image_url} alt={p.name ?? p.sku}
                      category={p.category as string | null}
                      productName={p.name as string | null} className="h-full w-full object-contain transition group-hover:scale-105" iconClassName="h-12 w-12 text-slate-300" />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col gap-1 border-l p-3 lg:border-l-0 lg:border-t">
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-500">
                    {p.brand && <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold">{p.brand}</span>}
                    
                  </div>
                  <Link to="/product/$slug" params={{ slug }} className="line-clamp-2 text-sm font-semibold hover:text-[color:var(--brand-navy)]">{p.name ?? p.sku}</Link>
                  <WarrantyBadge category={p.category as string | null | undefined} name={p.name as string | null | undefined} />
                  {hasSpecTags(p.category as string | null | undefined) && (
                    <SpecTagsCompact description={(p as { description?: string | null }).description} />
                  )}
                  <div className="flex flex-wrap items-center gap-1">
                    {freeShip && <Badge className="inline-flex items-center gap-1 bg-green-100 text-[10px] text-green-700 hover:bg-green-100"><Truck className="h-3 w-3" /> ฟรีจัดส่ง</Badge>}
                    <StockBadge stockQty={p.stock_qty as number | null | undefined} fulfillmentType={p.fulfillment_type as string | null | undefined} stockStatus={p.stock_status as string | null | undefined} distributor={(p as { distributor?: string | null }).distributor} />
                  </div>
                  <div className="mt-1 text-xl font-black text-[color:var(--brand-orange)]">{displayPrice(p, tier)}</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                    <span className={`inline-block h-2 w-2 rounded-full ${ready ? "bg-green-500" : "bg-red-500"}`} />
                    {p.stock_status ?? "—"}
                  </div>
                  <Button
                    disabled={!ready}
                    onClick={() => addToCart(p)}
                    size="sm"
                    className="mt-2 w-full bg-[color:var(--brand-navy)] hover:bg-[color:var(--brand-navy-2)]"
                  >
                    <ShoppingCart className="mr-1.5 h-4 w-4" /> ใส่ตะกร้า
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Popular Notebooks ---------- */

export function PopularNotebooks() {
  const tier = useCustomerTier();
  const addToCart = useAddToCart();
  const q = useQuery({
    queryKey: ["popular-notebooks"],
    queryFn: async () => {
      const { data } = await supabase.from("synnex_products")
        .select("*")
        .eq("category", "Notebook")
        .eq("price_approved", true).gt("selling_price", 0)
        .gt("selling_price", 0)
        .not("image_url", "is", null)
        .order("selling_price", { ascending: true })
        .limit(10);
      return (data ?? []) as ProductRow[];
    },
    staleTime: 5 * 60_000,
  });

  if ((q.data?.length ?? 0) === 0) return null;

  return (
    <section className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SectionHeader
          title={<span className="inline-flex items-center gap-2"><Laptop className="h-5 w-5 text-blue-600" />Notebook ยอดนิยม</span>}
          en="Popular Notebooks"
          sub="เลือกจาก Notebook หลากหลายแบรนด์"
          link={{ to: "/", search: { category: "Notebook" }, label: "ดูทั้งหมด" }}
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 lg:gap-3">
          {q.data!.map((p, idx) => {
            const ready = p.stock_status === "พร้อมจัดส่ง";
            const slug = p.slug || p.id;
            const badge = getProductBadge(p, idx);
            return (
              <div key={p.id} className="group relative flex flex-col overflow-hidden rounded-lg border bg-white transition hover:shadow-lg">
                <BrandLogo brand={p.brand} />
                {badge && (
                  <div className="absolute left-2 top-2 z-10">
                    <SaleBadge type={badge} />
                  </div>
                )}
                <Link to="/product/$slug" params={{ slug }} className="grid aspect-square place-items-center bg-white p-3">
                  <ProductImage src={p.image_url} alt={p.name ?? p.sku}
                      category={p.category as string | null}
                      productName={p.name as string | null} className="h-full w-full object-contain transition group-hover:scale-105" iconClassName="h-16 w-16 text-slate-300" />
                </Link>
                <div className="flex flex-1 flex-col gap-1 border-t p-3">
                  {p.brand && <div className="text-[10px] uppercase tracking-wide text-slate-500">{p.brand}</div>}
                  <Link to="/product/$slug" params={{ slug }} className="line-clamp-2 min-h-10 text-sm font-medium hover:text-[color:var(--brand-navy)]">{p.name ?? p.sku}</Link>
                  {hasSpecTags(p.category as string | null | undefined) && (
                    <SpecTagsCompact description={(p as { description?: string | null }).description} />
                  )}
                  <div className="mt-auto text-lg font-black text-[color:var(--brand-orange)]">{displayPrice(p, tier)}</div>
                  <UrgencyIndicator index={idx} />

                  <Button
                    disabled={!ready}
                    onClick={() => addToCart(p)}
                    size="sm"
                    className="mt-2 w-full bg-[color:var(--brand-navy)] font-semibold hover:bg-[color:var(--brand-navy-2)]"
                  >
                    <ShoppingCart className="mr-1.5 h-4 w-4" /> ใส่ตะกร้า
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Computer Sets ---------- */

export function extractComputerSetSpec(name: string): {
  gpu: string | null;
  cpu: string | null;
  ram: string | null;
} {
  const src = name || "";
  const gpuMatch = src.match(/RTX\s*\d{3,4}\w*/i) ?? src.match(/GTX\s*\d{3,4}/i) ?? src.match(/RX\s*\d{3,4}\w*/i);
  const gpu = gpuMatch ? gpuMatch[0].toUpperCase().replace(/\s+/g, " ") : null;

  let cpu: string | null = null;
  const ultra = src.match(/(?:Intel\s*Core\s*)?ULTRA\s*(\d)\w*/i);
  const iSeries = src.match(/\b[iI]([3579])[-\s]?\d{3,5}\w*/);
  const ryzen = src.match(/Ryzen\s*[3579]\s*\d{3,4}\w*/i);
  if (ultra) cpu = `Intel ULTRA ${ultra[1]}`;
  else if (iSeries) cpu = `Intel i${iSeries[1]}`;
  else if (ryzen) cpu = ryzen[0].replace(/\s+/g, " ").toUpperCase();

  const ramMatch = src.match(/(\d{1,3})\s*GB\s*(?:DDR\d)?/i);
  const ram = ramMatch ? `${ramMatch[1]}GB` : null;

  return { gpu, cpu, ram };
}

export function ComputerSets() {
  const tier = useCustomerTier();
  const addToCart = useAddToCart();
  const q = useQuery({
    queryKey: ["computer-sets"],
    queryFn: async () => {
      const { data } = await supabase.from("synnex_products")
        .select("*")
        .eq("category", "Computer Set")
        .eq("price_approved", true)
        .gt("selling_price", 0)
        .order("selling_price", { ascending: true })
        .limit(10);
      return (data ?? []) as (ProductRow & { description: string | null })[];
    },
    staleTime: 5 * 60_000,
  });

  if ((q.data?.length ?? 0) === 0) return null;

  return (
    <section className="border-b bg-gradient-to-br from-slate-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SectionHeader
          title={<span className="inline-flex items-center gap-2"><Server className="h-5 w-5 text-slate-600" />Computer Set / ชุดคอมพิวเตอร์</span>}
          en="Computer Sets"
          sub="Gaming PC และ Workstation พร้อมใช้งาน · RTX 5090 / RTX 5070 / RTX 5060 · ส่งฟรีใน กทม เมื่อซื้อครบ ฿5,000"
          link={{ to: "/", search: { category: "Computer Set" }, label: "ดูทั้งหมด" }}
        />
        <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
          <div className="flex snap-x gap-4">
            {q.data!.map((p) => {
              const ready = p.stock_status === "พร้อมจัดส่ง";
              const slug = p.slug || p.id;
              const { gpu, cpu, ram } = extractComputerSetSpec(p.name ?? p.sku);
              const priceNum = getSellingPrice(p, tier) ?? 0;
              const memberNum = Number(p.member_price ?? 0);
              const freeShip = priceNum >= 5000;
              return (
                <div
                  key={p.id}
                  className="group relative flex w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border-2 border-slate-200 bg-white transition hover:border-[color:var(--brand-orange)] hover:shadow-xl"
                >
                  {gpu && (
                    <span className="absolute right-2 top-2 z-10 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-500 px-2 py-1 text-[11px] font-black text-white shadow">
                      🎮 {gpu}
                    </span>
                  )}
                  <Link
                    to="/product/$slug"
                    params={{ slug }}
                    className="grid aspect-[4/3] place-items-center bg-slate-50 p-4"
                  >
                    <ProductImage
                      src={p.image_url}
                      alt={p.name ?? p.sku}
                      category={p.category as string | null}
                      productName={p.name as string | null}
                      className="h-full w-full object-contain transition group-hover:scale-105"
                      iconClassName="h-20 w-20 text-slate-300"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col gap-1.5 border-t p-3">
                    {p.brand && <div className="text-[10px] uppercase tracking-wide text-slate-500">{p.brand}</div>}
                    <Link
                      to="/product/$slug"
                      params={{ slug }}
                      className="line-clamp-2 min-h-10 text-sm font-semibold text-slate-900 hover:text-[color:var(--brand-navy)]"
                    >
                      {p.name ?? p.sku}
                    </Link>
                    <div className="flex flex-wrap gap-1">
                      {cpu && (
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 ring-1 ring-blue-200">
                          {cpu}
                        </span>
                      )}
                      {ram && (
                        <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 ring-1 ring-purple-200">
                          {ram} RAM
                        </span>
                      )}
                    </div>
                    {freeShip && (
                      <div className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        <Truck className="h-3 w-3" /> ส่งฟรี กทม./ปริมณฑล
                      </div>
                    )}
                    <div className="mt-auto pt-1">
                      <div className="text-2xl font-black text-[color:var(--brand-orange)]">
                        {priceNum > 0 ? priceFmt.format(priceNum) : "ติดต่อสอบถาม"}
                      </div>
                      {memberNum > 0 && memberNum < priceNum && (
                        <div className="text-xs font-semibold text-emerald-700">
                          สมาชิก {priceFmt.format(memberNum)}
                        </div>
                      )}
                    </div>
                    <Button
                      disabled={!ready}
                      onClick={() => addToCart(p)}
                      size="sm"
                      className="mt-1 w-full bg-[color:var(--brand-navy)] font-semibold hover:bg-[color:var(--brand-navy-2)]"
                    >
                      <ShoppingCart className="mr-1.5 h-4 w-4" /> ใส่ตะกร้า
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}


/* ---------- Shop by Brand ---------- */

const BRAND_DOMAINS: Record<string, string> = {
  CISCO: "cisco.com",
  HIKVISION: "hikvision.com",
  SANDISK: "sandisk.com",
  ASUS: "asus.com",
  DAHUA: "dahuasecurity.com",
  CORSAIR: "corsair.com",
  HUAWEI: "huawei.com",
  VIEWSONIC: "viewsonic.com",
  SAMSUNG: "samsung.com",
  SEAGATE: "seagate.com",
  KINGSTON: "kingston.com",
  ACER: "acer.com",
  TPLINK: "tp-link.com",
  AOC: "aoc.com",
  DLINK: "dlink.com",
  LG: "lg.com",
  MICROSOFT: "microsoft.com",
  DELL: "dell.com",
  HP: "hp.com",
  LENOVO: "lenovo.com",
  MSI: "msi.com",
  CANON: "canon.com",
  APC: "apc.com",
  NETGEAR: "netgear.com",
  ZYXEL: "zyxel.com",
};

function BrandCardLogo({ brand }: { brand: string }) {
  const [idx, setIdx] = useState(0);
  const local = getBrandLogoUrl(brand);
  const domain = BRAND_DOMAINS[brand];
  const sources = local
    ? [local]
    : domain
      ? [`https://unavatar.io/${domain}?fallback=false`]
      : [];
  const failed = idx >= sources.length;
  return (
    <div className="mb-2 flex h-10 items-center justify-center">
      {!failed ? (
        <img
          src={sources[idx]}
          alt={brand}
          loading="lazy"
          className="max-h-8 max-w-[96px] object-contain transition group-hover:scale-105"
          onError={() => setIdx((i) => i + 1)}
        />
      ) : (
        <span className="text-sm font-black tracking-tight text-[color:var(--brand-navy)]">
          {brand}
        </span>
      )}
    </div>
  );
}

export function ShopByBrand() {
  const q = useQuery({
    queryKey: ["all-brands"],
    queryFn: async () => {
      const { data } = await supabase.from("synnex_products")
        .select("brand")
        .not("brand", "is", null)
        .limit(1000);
      const map = new Map<string, number>();
      for (const r of data ?? []) {
        const b = (r as { brand: string | null }).brand;
        if (!b) continue;
        map.set(b, (map.get(b) ?? 0) + 1);
      }
      return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([b, n]) => ({ brand: b, count: n }));
    },
    staleTime: 10 * 60_000,
  });

  const navigate = useNavigate();
  const currentSearch = (useSearch({ strict: false, shouldThrow: false }) ?? {}) as { brands?: string };
  const selected = (currentSearch.brands ?? "").split(",").filter(Boolean);
  const hasSelection = selected.length > 0;

  if ((q.data?.length ?? 0) === 0) return null;


  const scrollToGrid = () => {
    if (typeof window === "undefined") return;
    const el = document.getElementById("product-grid");
    if (!el) return;
    const headerHeight = 60;
    const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const onPick = (brand: string) => {
    const set = new Set(selected);
    if (set.has(brand)) set.delete(brand);
    else set.add(brand);
    navigate({
      to: "/",
      // Selecting/deselecting a brand auto-clears the category to prevent
      // 0-result conflicts between category × brand filters.
      search: (prev: Record<string, unknown>) => ({ ...prev, brands: [...set].join(","), category: "all", page: 1 }),
      replace: true,
    });
    // wait for DOM update after navigation
    requestAnimationFrame(() => setTimeout(scrollToGrid, 50));
  };

  const clearBrands = () => {
    navigate({
      to: "/",
      search: (prev: Record<string, unknown>) => ({ ...prev, brands: "", page: 1 }),
      replace: true,
    });
    requestAnimationFrame(() => setTimeout(scrollToGrid, 50));
  };

  return (
    <section className="border-b bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <SectionHeader title="แบรนด์ที่มีจำหน่าย" en="Shop by Brand" />
          {hasSelection && (
            <button
              type="button"
              onClick={clearBrands}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-[color:var(--brand-green)] hover:text-[color:var(--brand-green)]"
            >
              × ล้างตัวกรอง
            </button>
          )}
        </div>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
          {q.data!.map(({ brand, count }) => {
            const active = selected.includes(brand);
            return (
              <button
                key={brand}
                type="button"
                onClick={() => onPick(brand)}
                aria-pressed={active}
                className={`group flex h-[100px] min-w-[140px] shrink-0 flex-col items-center justify-center rounded-lg border-2 px-5 py-3 transition hover:shadow-md ${
                  active
                    ? "border-[color:var(--brand-green)] bg-[color:var(--brand-green)]/5 ring-2 ring-[color:var(--brand-green)]/20"
                    : "border-slate-200 bg-white hover:border-[color:var(--brand-green)]"
                }`}
              >
                <BrandCardLogo brand={brand} />
                <div className="text-[10px] text-slate-400">{count} รายการ</div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}



/* ---------- Trust badges ---------- */

export function TrustBadges() {
  const items = [
    { icon: Award,    title: "สินค้าแท้ 100%",    sub: "รับประกันศูนย์ไทย" },
    { icon: Truck,    title: "จัดส่งทั่วประเทศ", sub: "Kerry / Flash / ไปรษณีย์" },
    { icon: FileText, title: "ใบกำกับภาษีได้",         sub: "รองรับนิติบุคคล VAT 7%" },
    { icon: Phone,    title: "ทีมงานพร้อมช่วยเหลือ",     sub: "โทร 02-045-6104" },
  ];
  return (
    <section className="border-y bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 lg:gap-3">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.title} className="flex items-center gap-3 rounded-lg border bg-slate-50 p-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[color:var(--brand-green)]/10 text-[color:var(--brand-green)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-[color:var(--brand-navy)]">{it.title}</div>
                  <div className="truncate text-[11px] text-slate-500">{it.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Trust badges + B2B CTA bar (desktop top) ---------- */

export function TrustAndB2BBar() {
  const items = [
    { icon: Award,    title: "สินค้าแท้ 100%",       sub: "รับประกันศูนย์ไทย" },
    { icon: Truck,    title: "จัดส่งทั่วประเทศ",     sub: "Kerry / Flash / ไปรษณีย์" },
    { icon: FileText, title: "ใบกำกับภาษีได้",       sub: "รองรับนิติบุคคล VAT 7%" },
    { icon: Phone,    title: "ทีมงานพร้อมช่วยเหลือ", sub: "โทร 02-045-6104" },
  ];
  return (
    <section className="hidden border-b bg-white lg:block">
      <div className="mx-auto max-w-7xl px-4 py-5">
        <div className="grid grid-cols-5 gap-3">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.title} className="flex items-center gap-3 rounded-lg border bg-slate-50 p-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[color:var(--brand-green)]/10 text-[color:var(--brand-green)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-[color:var(--brand-navy)]">{it.title}</div>
                  <div className="truncate text-[11px] text-slate-500">{it.sub}</div>
                </div>
              </div>
            );
          })}
          <Link
            to="/corporate"
            className="flex items-center gap-3 rounded-lg bg-[color:var(--brand-navy)] p-4 transition hover:bg-[color:var(--brand-navy-2)]"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-white">ลูกค้าองค์กร / B2B</div>
              <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-white/75">
                <Link to="/credit-application" className="inline-flex items-center gap-1 hover:text-white hover:underline">
                  <CreditCard className="h-3 w-3" /> วงเงินเครดิต B2B
                </Link>
                <Link to="/pc-builder" className="inline-flex items-center gap-1 hover:text-white hover:underline">
                  <Wrench className="h-3 w-3" /> Config PC
                </Link>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------- Recently viewed ---------- */

type RecentItem = { sku: string; slug: string | null; name: string; image: string | null; price?: number | null };

export function RecentlyViewed() {
  const [items, setItems] = useState<RecentItem[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ent_recently_viewed");
      const arr = raw ? (JSON.parse(raw) as RecentItem[]) : [];
      setItems(arr.slice(0, 6));
    } catch { /* ignore */ }
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SectionHeader title={<span className="inline-flex items-center gap-2"><Clock className="h-5 w-5 text-slate-400" />สินค้าที่คุณเพิ่งดู</span>} en={<span className="inline-flex items-center gap-2"><Clock className="h-5 w-5 text-slate-400" />Recently Viewed</span>} />
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
          {items.map((r) => (
            <Link
              key={r.sku}
              to="/product/$slug"
              params={{ slug: r.slug || r.sku }}
              className="group flex w-44 shrink-0 flex-col overflow-hidden rounded-lg border bg-white transition hover:shadow-md"
            >
              <div className="grid aspect-square place-items-center bg-slate-50 p-2">
                {r.image ? <img src={r.image} alt={r.name} className="h-full w-full object-contain" loading="lazy" /> : <Package className="h-10 w-10 text-slate-300" />}
              </div>
              <div className="border-t p-2">
                <div className="line-clamp-2 min-h-8 text-xs font-medium text-slate-800 group-hover:text-[color:var(--brand-navy)]">{r.name}</div>
                {typeof r.price === "number" && r.price > 0 && (
                  <div className="mt-1 text-sm font-bold text-[color:var(--brand-orange)]">฿{r.price.toLocaleString()}</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Newsletter signup ---------- */

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.trim().toLowerCase(), source: "homepage" });
    setLoading(false);
    if (error && !/duplicate|unique/i.test(error.message)) {
      toast.error("ไม่สามารถบันทึกอีเมลได้ กรุณาลองใหม่");
      return;
    }
    setDone(true);
    toast.success("สมัครรับข่าวสารเรียบร้อย!");
  };

  return (
    <section style={{ backgroundColor: "#0a1628" }}>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div className="text-white">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur">
              <Mail className="h-3.5 w-3.5" /> Newsletter
            </div>
            <h2 className="text-2xl font-black md:text-3xl">รับข่าวสารและโปรโมชั่นก่อนใคร</h2>
            <p className="mt-1 text-sm text-white/70 md:text-base">Get exclusive deals & IT news</p>
          </div>
          {done ? (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-center text-emerald-300">
              ✓ ขอบคุณสำหรับการสมัคร! เราจะส่งข่าวสารให้คุณเร็ว ๆ นี้
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 flex-1 border-white/20 bg-white/10 text-white placeholder:text-white/50 focus-visible:ring-[color:var(--brand-orange)]"
                required
              />
              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="h-11 bg-[color:var(--brand-orange)] font-bold hover:bg-[color:var(--brand-orange-dark)]"
              >
                {loading ? "กำลังบันทึก..." : "สมัครรับข่าวสาร"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- Section header ---------- */

function SectionHeader({
  title, en, sub, link,
}: {
  title: React.ReactNode; en: React.ReactNode; sub?: string;
  link?: { to: string; search?: Record<string, unknown>; label: string };
}) {
  const { lang } = useLanguage();
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-xl font-black text-[color:var(--brand-navy)] md:text-2xl">
          {lang === "en" ? en : title}
          <span className="ml-2 text-sm font-medium text-slate-400">/ {lang === "en" ? title : en}</span>
        </h2>
        {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
      </div>
      {link && (
        <Link
          to={link.to as never}
          search={link.search as never}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[color:var(--brand-green)] hover:underline"
        >
          {link.label} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

// Prevent unused-import warning in strict mode
export const _ = useRef;

/* ---------- Microsoft Software (featured) ---------- */

const MS_DESCRIPTIONS: { match: RegExp; short: string; desc: string }[] = [
  { match: /m365\s*family|365\s*family/i, short: "M365 Family", desc: "Microsoft 365 สำหรับครอบครัว สูงสุด 6 คน" },
  { match: /home\s*(and|&)\s*business.*2024/i, short: "Office Home and Business 2024", desc: "Word, Excel, PowerPoint, Outlook สำหรับธุรกิจ" },
  { match: /office\s*home.*2024/i, short: "Office Home 2024", desc: "Word, Excel, PowerPoint สำหรับบ้าน" },
  { match: /windows\s*11\s*pro.*usb/i, short: "Windows 11 Pro USB", desc: "Windows 11 Pro แบบ USB" },
  { match: /windows\s*11\s*pro/i, short: "Windows 11 Pro", desc: "ระบบปฏิบัติการ Windows 11 Pro" },
  { match: /windows\s*11\s*home/i, short: "Windows 11 Home", desc: "ระบบปฏิบัติการ Windows 11 Home" },
  { match: /windows\s*server\s*2022/i, short: "Windows Server 2022", desc: "Windows Server 2022 สำหรับองค์กร" },
  { match: /m365|365\s*personal/i, short: "M365 Personal", desc: "Microsoft 365 สำหรับผู้ใช้ 1 คน" },
];

function getSoftwareDescription(brand: string | null | undefined, name: string | null | undefined): string {
  const b = (brand ?? "").toUpperCase();
  const n = (name ?? "").toUpperCase();
  if (b.includes("KASPERSKY")) return "โปรแกรมป้องกันไวรัส ลิขสิทธิ์แท้จาก Kaspersky Lab";
  if (b.includes("ESET")) return "โปรแกรมป้องกันไวรัส ลิขสิทธิ์แท้จาก ESET";
  if (b.includes("MCAFEE")) return "โปรแกรมความปลอดภัย ลิขสิทธิ์แท้จาก McAfee";
  if (b.includes("MICROSOFT")) {
    if (n.includes("WINDOWS")) return "ระบบปฏิบัติการ Windows ลิขสิทธิ์แท้จาก Microsoft";
    if (n.includes("365") || n.includes("M365")) return "Microsoft 365 สำหรับผู้ใช้ 1 คน หรือครอบครัว";
    if (n.includes("OFFICE")) return "Microsoft Office ลิขสิทธิ์แท้ ใช้งานได้ตลอดชีพ";
    return "ซอฟต์แวร์ลิขสิทธิ์แท้จาก Microsoft";
  }
  return "ซอฟต์แวร์ลิขสิทธิ์แท้ 100%";
}

function getSoftwareBrandIcon(brand: string | null | undefined): string {
  const b = (brand ?? "").toUpperCase();
  if (b.includes("KASPERSKY")) return "🛡️";
  if (b.includes("ESET")) return "🔒";
  if (b.includes("MCAFEE")) return "🔐";
  if (b.includes("MICROSOFT")) return "🪟";
  return "💿";
}

function msMeta(name: string | null | undefined, brand?: string | null) {
  const n = name ?? "";
  for (const m of MS_DESCRIPTIONS) if (m.match.test(n)) return { short: m.short, desc: m.desc };
  return { short: n.length > 40 ? n.slice(0, 40) + "…" : n, desc: getSoftwareDescription(brand, n) };
}

export function MicrosoftFeatured() {
  const tier = useCustomerTier();
  const addToCart = useAddToCart();
  const q = useQuery({
    queryKey: ["software-licenses"],
    queryFn: async () => {
      const { data } = await supabase.from("synnex_products")
        .select("*")
        .eq("category", "Software")
        .eq("price_approved", true)
        .gt("selling_price", 0)
        .order("selling_price", { ascending: true });
      return (data ?? []) as ProductRow[];
    },
    staleTime: 5 * 60_000,
  });

  if ((q.data?.length ?? 0) === 0) return null;

  return (
    <section
      className="border-b"
      style={{
        background: "linear-gradient(135deg, #f0f7ff 0%, #e8f0fe 100%)",
        borderTop: "3px solid #0078d4",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SectionHeader
          title={<span className="inline-flex items-center gap-2"><Package className="h-5 w-5 text-purple-500" />Software & Licenses / ซอฟต์แวร์ลิขสิทธิ์</span>}
          en="Software & Licenses — Genuine"
          sub="Microsoft 365, Office 2024, Windows 11, Kaspersky, ESET, McAfee — สินค้าแท้ 100%"
          link={{ to: "/", search: { category: "Software" }, label: "ดู Software ทั้งหมด" }}
        />

        <div className="flex gap-4 overflow-x-auto pb-3 no-scrollbar snap-x">
          {q.data!.map((p) => {
            const meta = msMeta(p.name, p.brand);
            const slug = p.slug || p.id;
            const selling = getSellingPrice(p, tier) ?? 0;
            const regular = p.selling_price ?? 0;
            const savings = regular > selling && selling > 0 ? regular - selling : 0;

            return (
              <div
                key={p.id}
                className="group relative flex w-64 shrink-0 snap-start flex-col overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-lg"
                style={{ border: "1px solid #bfdbfe" }}
              >
                {/* Brand icon + name top-left */}
                <div className="absolute left-2 top-2 z-10 flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-1.5 py-1 shadow-sm">
                  <span className="text-base leading-none">{getSoftwareBrandIcon(p.brand)}</span>
                  {p.brand && (
                    <span className="text-xs font-semibold uppercase text-slate-500">{p.brand}</span>
                  )}
                </div>
                {/* Genuine license pill */}
                <div className="absolute right-2 top-2 z-10 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  ลิขสิทธิ์แท้ ✓
                </div>

                <Link to="/product/$slug" params={{ slug }} className="grid place-items-center bg-white p-4 pt-10">
                  <ProductImage
                    src={p.image_url}
                    alt={p.name ?? p.sku}
                      category={p.category as string | null}
                      productName={p.name as string | null}
                    className="h-[120px] w-[120px] object-contain transition group-hover:scale-105"
                    iconClassName="h-16 w-16 text-blue-200"
                  />
                </Link>

                <div className="flex flex-1 flex-col gap-1 border-t border-blue-100 bg-white/70 p-3">
                  <Link
                    to="/product/$slug"
                    params={{ slug }}
                    className="text-sm font-bold text-slate-900 hover:text-[color:var(--brand-navy)]"
                  >
                    {meta.short}
                  </Link>
                  <p className="line-clamp-2 min-h-8 text-[11px] text-slate-600">{meta.desc}</p>

                  <div className="mt-2 text-lg font-black text-blue-800">฿{selling.toLocaleString()}</div>
                  {savings > 0 && (
                    <div className="text-[11px] text-emerald-700">
                      สมาชิก ฿{selling.toLocaleString()} <span className="text-slate-500">(ประหยัด ฿{savings.toLocaleString()})</span>
                    </div>
                  )}

                  <Button
                    onClick={() => addToCart(p)}
                    size="sm"
                    className="mt-2 w-full bg-blue-700 font-semibold hover:bg-blue-800"
                  >
                    <ShoppingCart className="mr-1.5 h-4 w-4" />
                    ใส่ตะกร้า
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-700 md:gap-6 md:text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 shadow-sm">
            <span className="text-emerald-600">✓</span> ลิขสิทธิ์แท้ 100%
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 shadow-sm">
            <span className="text-emerald-600">✓</span> รับประกันศูนย์ไทย
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 shadow-sm">
            <span className="text-emerald-600">✓</span> รับประกันจากผู้ผลิตโดยตรง
          </span>
        </div>
      </div>
    </section>
  );
}


/* ---------- Reusable product grid card (Network / Storage) ---------- */

function CategoryGridCard({ p }: { p: ProductRow }) {
  const tier = useCustomerTier();
  const addToCart = useAddToCart();
  const ready = p.stock_status === "พร้อมจัดส่ง";
  const byOrder = (p as { fulfillment_type?: string | null }).fulfillment_type === "by_order";
  const available = ready || byOrder;
  const slug = p.slug || p.id;
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border bg-white transition hover:shadow-lg">
      <BrandLogo brand={p.brand} />
      <div className="absolute right-2 top-2 z-10">
        <StockBadge
          stockQty={(p as { stock_qty?: number | null }).stock_qty}
          fulfillmentType={(p as { fulfillment_type?: string | null }).fulfillment_type}
          stockStatus={(p as { stock_status?: string | null }).stock_status}
          distributor={(p as { distributor?: string | null }).distributor}
        />
      </div>
      <Link to="/product/$slug" params={{ slug }} className="grid aspect-square place-items-center bg-white p-3">
        <ProductImage
          src={p.image_url}
          alt={p.name ?? p.sku}
                      category={p.category as string | null}
                      productName={p.name as string | null}
          className="h-full w-full object-contain transition group-hover:scale-105"
          iconClassName="h-14 w-14 text-slate-300"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-1 border-t p-3">
        {p.brand && <div className="text-[10px] uppercase tracking-wide text-slate-500">{p.brand}</div>}
        <Link
          to="/product/$slug"
          params={{ slug }}
          className="line-clamp-2 min-h-10 text-sm font-medium hover:text-[color:var(--brand-navy)]"
        >
          {p.name ?? p.sku}
        </Link>
        <WarrantyBadge category={p.category as string | null | undefined} name={p.name as string | null | undefined} />
        {hasSpecTags(p.category as string | null | undefined) && (
          <SpecTagsCompact description={(p as { description?: string | null }).description} />
        )}
        <div className="mt-auto text-lg font-black text-[color:var(--brand-orange)]">
          {displayPrice(p, tier)}
        </div>
        <Button
          disabled={!available}
          onClick={() => addToCart(p)}
          size="sm"
          className="mt-2 w-full bg-[color:var(--brand-navy)] font-semibold hover:bg-[color:var(--brand-navy-2)]"
        >
          <ShoppingCart className="mr-1.5 h-4 w-4" />
          {byOrder ? "สั่งจอง" : available ? "ใส่ตะกร้า" : "สินค้าหมด"}
        </Button>
      </div>
    </div>
  );
}

/* ---------- Network & Security ---------- */

export function NetworkSecurity() {
  const q = useQuery({
    queryKey: ["network-security"],
    queryFn: async () => {
      const { data } = await supabase.from("synnex_products")
        .select("*")
        .eq("category", "Network")
        .eq("price_approved", true)
        .eq("stock_status", "พร้อมจัดส่ง")
        .gt("selling_price", 0)
        .order("selling_price", { ascending: true })
        .limit(10);
      return (data ?? []) as ProductRow[];
    },
    staleTime: 5 * 60_000,
  });

  if ((q.data?.length ?? 0) === 0) return null;

  return (
    <section className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SectionHeader
          title="Network & Security / เครือข่ายและระบบรักษาความปลอดภัย"
          en="Network & Security Solutions"
          sub="Cisco, Hikvision, Dahua, D-Link — สินค้าแท้ 100%"
          link={{ to: "/", search: { category: "Network" }, label: "ดู Network ทั้งหมด" }}
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 lg:gap-3">
          {q.data!.map((p) => <CategoryGridCard key={p.id} p={p} />)}
        </div>
      </div>
    </section>
  );
}

/* ---------- Storage Deals ---------- */

export function StorageDeals() {
  const q = useQuery({
    queryKey: ["storage-deals"],
    queryFn: async () => {
      const { data } = await supabase.from("synnex_products")
        .select("*")
        .eq("category", "Storage")
        .eq("price_approved", true)
        .eq("stock_status", "พร้อมจัดส่ง")
        .gt("selling_price", 0)
        .limit(60);

      const rows = (data ?? []) as ProductRow[];
      const byBrand: Record<string, ProductRow[]> = {};
      for (const p of rows) {
        const key = (p.brand ?? "อื่นๆ").toUpperCase();
        (byBrand[key] ??= []).push(p);
      }
      Object.values(byBrand).forEach((arr) => arr.sort(() => Math.random() - 0.5));

      const picked: ProductRow[] = [];
      const brands = Object.keys(byBrand);
      let i = 0;
      while (picked.length < 10 && brands.some((b) => byBrand[b].length > 0)) {
        const b = brands[i % brands.length];
        const item = byBrand[b].shift();
        if (item) picked.push(item);
        i++;
      }
      return picked.sort(() => Math.random() - 0.5);
    },
    staleTime: 5 * 60_000,
  });

  if ((q.data?.length ?? 0) === 0) return null;

  return (
    <section className="border-b bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SectionHeader
          title="Storage Deals / อุปกรณ์จัดเก็บข้อมูล"
          en="Storage Deals"
          sub="SanDisk, Kingston, Seagate, WD"
          link={{ to: "/", search: { category: "Storage" }, label: "ดู Storage ทั้งหมด" }}
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 lg:gap-3">
          {q.data!.map((p) => <CategoryGridCard key={p.id} p={p} />)}
        </div>
      </div>
    </section>
  );
}

/* ---------- Components (CPU & RAM) ---------- */

export function ComponentsShowcase() {
  const q = useQuery({
    queryKey: ["components-showcase"],
    queryFn: async () => {
      const { data } = await supabase.from("synnex_products")
        .select("*")
        .in("category", ["Components", "RAM"])
        .eq("price_approved", true)
        .gt("selling_price", 0)
        .limit(80);

      const rows = (data ?? []) as ProductRow[];

      // จัดกลุ่มตามประเภทสินค้าคร่าวๆ จากชื่อ กันไม่ให้ของถูกประเภทเดียวยึดพื้นที่ทั้งหมด
      const buckets: Record<string, ProductRow[]> = { cpu: [], ram: [], mainboard: [], other: [] };
      for (const p of rows) {
        const n = (p.name ?? "").toLowerCase();
        if (/ryzen|core i\d|core ultra|threadripper/.test(n)) buckets.cpu.push(p);
        else if (/ddr\d|\bram\b/.test(n)) buckets.ram.push(p);
        else if (/mainboard|mobo/.test(n)) buckets.mainboard.push(p);
        else buckets.other.push(p);
      }
      // สุ่มลำดับในแต่ละกลุ่มก่อน กันได้ของราคาถูกสุดซ้ำหน้าเดิมทุกครั้ง
      Object.values(buckets).forEach((arr) => arr.sort(() => Math.random() - 0.5));

      // หยิบวนทีละกลุ่มจนครบ 10 ชิ้น ให้กระจายทุกประเภทเท่าที่มีของ
      const picked: ProductRow[] = [];
      const keys = Object.keys(buckets);
      let i = 0;
      while (picked.length < 10 && keys.some((k) => buckets[k].length > 0)) {
        const k = keys[i % keys.length];
        const item = buckets[k].shift();
        if (item) picked.push(item);
        i++;
      }
      // สลับลำดับการแสดงผลสุดท้ายอีกที ไม่ให้เรียงเป็นกลุ่มๆ ติดกัน
      return picked.sort(() => Math.random() - 0.5);
    },
    staleTime: 5 * 60_000,
  });

  if ((q.data?.length ?? 0) === 0) return null;

  return (
    <section className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SectionHeader
          title={<span className="inline-flex items-center gap-2"><Cpu className="h-5 w-5 text-slate-700" />CPU & Components / ชิ้นส่วนคอมพิวเตอร์</span>}
          en="Components — CPU & Memory"
          sub="AMD Ryzen, Intel Core Ultra, Mainboard, RAM DDR4/DDR5"
          link={{ to: "/", search: { category: "Components" }, label: "ดู Components ทั้งหมด" }}
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 lg:gap-3">
          {q.data!.map((p) => <CategoryGridCard key={p.id} p={p} />)}
        </div>
      </div>
    </section>
  );
}

/* ---------- Apple Products (ADVICE) ---------- */

export function MacBookShowcase() {
  const q = useQuery({
    queryKey: ["apple-products"],
    queryFn: async () => {
      const { data } = await supabase.from("synnex_products")
        .select("*")
        .eq("distributor", "ADVICE")
        .in("category", ["Smart Phone & Tablet", "Notebook"])
        .eq("price_approved", true)
        .gt("selling_price", 0)
        .or("name.ilike.%Apple%,name.ilike.%iPhone%,name.ilike.%iPad%,name.ilike.%MacBook%,name.ilike.%AirPods%,name.ilike.%Apple Watch%")
        .limit(60);

      const rows = (data ?? []) as ProductRow[];
      const buckets: Record<string, ProductRow[]> = { iphone: [], macbook: [], ipad: [], mac: [], other: [] };
      for (const p of rows) {
        const n = (p.name ?? "").toLowerCase();
        if (/iphone/.test(n)) buckets.iphone.push(p);
        else if (/macbook/.test(n)) buckets.macbook.push(p);
        else if (/ipad/.test(n)) buckets.ipad.push(p);
        else if (/\bmac\b|mac mini|mac studio|imac/.test(n)) buckets.mac.push(p);
        else buckets.other.push(p);
      }
      Object.values(buckets).forEach((arr) => arr.sort(() => Math.random() - 0.5));

      const picked: ProductRow[] = [];
      const keys = Object.keys(buckets);
      let i = 0;
      while (picked.length < 10 && keys.some((k) => buckets[k].length > 0)) {
        const k = keys[i % keys.length];
        const item = buckets[k].shift();
        if (item) picked.push(item);
        i++;
      }
      return picked.sort(() => Math.random() - 0.5);
    },
    staleTime: 5 * 60_000,
  });

  if ((q.data?.length ?? 0) === 0) return null;

  return (
    <section className="border-b bg-gradient-to-br from-slate-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SectionHeader
          title={<span className="inline-flex items-center gap-2"><AppleLogoSvg className="h-5 w-5 md:h-6 md:w-6" />Apple Products / ผลิตภัณฑ์ Apple</span>}
          en={<span className="inline-flex items-center gap-2"><AppleLogoSvg className="h-5 w-5 md:h-6 md:w-6" />Apple Products</span>}
          sub="iPhone 17, MacBook Air M5, iPad · สินค้าของแท้ รับประกันศูนย์ไทย 1 ปี"
          link={{ to: "/", search: { q: "Apple" }, label: "ดู Apple ทั้งหมด" }}
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 lg:gap-3">
          {q.data!.map((p) => <CategoryGridCard key={p.id} p={p} />)}
        </div>
      </div>
    </section>
  );
}



/* ---------- Solar & Energy ---------- */

export function SolarEnergy() {
  const q = useQuery({
    queryKey: ["solar-energy"],
    queryFn: async () => {
      const { data } = await supabase.from("synnex_products")
        .select("*")
        .eq("category", "Solar & Energy")
        .eq("price_approved", true)
        .gt("selling_price", 0)
        .order("selling_price", { ascending: true })
        .limit(10);
      return (data ?? []) as ProductRow[];
    },
    staleTime: 5 * 60_000,
  });

  if ((q.data?.length ?? 0) === 0) return null;

  return (
    <section className="border-b bg-gradient-to-br from-amber-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SectionHeader
          title={<span className="inline-flex items-center gap-2"><Sun className="h-5 w-5 text-yellow-500" />Solar & Energy / โซลาร์และพลังงาน</span>}
          en="Solar & Energy"
          sub="แผงโซลาร์เซลล์ Inverter และอุปกรณ์พลังงาน เหมาะสำหรับบ้านและองค์กร"
          link={{ to: "/", search: { category: "Solar & Energy" }, label: "ดูทั้งหมด" }}
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 lg:gap-3">
          {q.data!.map((p) => <CategoryGridCard key={p.id} p={p} />)}
        </div>
      </div>
    </section>
  );
}

/* ---------- Smart Life (CCTV / Smart Home / IoT) ---------- */

type SmartTab = "all" | "cctv" | "smartwatch" | "xiaomi" | "gadget";

const SMART_TABS: { key: SmartTab; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "cctv", label: "📹 CCTV" },
  { key: "smartwatch", label: "⌚ Smartwatch" },
  { key: "xiaomi", label: "🏠 Xiaomi" },
  { key: "gadget", label: "🌀 Gadget" },
];

export function SmartLife() {
  const [tab, setTab] = useState<SmartTab>("all");

  const q = useQuery({
    queryKey: ["smart-life", tab],
    queryFn: async () => {
      let qi = supabase
        .from("synnex_products")
        .select("*")
        .eq("category", "Smart Life")
        .eq("price_approved", true)
        .gt("selling_price", 0)
        .order("selling_price", { ascending: true })
        .limit(10);

      if (tab === "cctv") qi = qi.in("brand", ["DAHUA", "HIKVISION"]);
      else if (tab === "smartwatch") qi = qi.in("brand", ["SAMSUNG", "GARMIN", "HUAWEI"]);
      else if (tab === "xiaomi") qi = qi.eq("brand", "XIAOMI");
      else if (tab === "gadget") qi = qi.in("brand", ["SOTHING", "HONEYWELL"]);

      const { data } = await qi;
      return (data ?? []) as ProductRow[];
    },
    staleTime: 5 * 60_000,
  });

  if ((q.data?.length ?? 0) === 0) return null;

  return (
    <section className="border-b bg-white py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="inline-flex items-center gap-2 text-xl font-black text-slate-900 md:text-2xl">
              <Home className="h-5 w-5 text-green-600" />
              Smart Life / สมาร์ทไลฟ์
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              กล้องวงจรปิด · Smart Home · Smartwatch · IoT
            </p>
            <p className="mt-1 text-sm text-slate-500">
              CCTV, Dahua, Hikvision, Samsung, Garmin, Xiaomi
            </p>
          </div>
          <Link
            to="/"
            search={{ category: "Smart Life" } as never}
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-semibold text-[color:var(--brand-green)] hover:underline"
          >
            ดู Smart Life ทั้งหมด <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {SMART_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                tab === t.key
                  ? "border-[color:var(--brand-green)] bg-[color:var(--brand-green)] text-white"
                  : "hover:border-[color:var(--brand-green)] hover:text-[color:var(--brand-green)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 lg:gap-3">
          {q.data!.map((p) => <CategoryGridCard key={p.id} p={p} />)}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs font-semibold text-amber-800 sm:text-sm">
          <span className="inline-flex items-center gap-1"><Tag className="h-4 w-4" /> ส่วนลดพิเศษเมื่อซื้อจำนวนมาก</span>
          <span className="text-amber-400">|</span>
          <span className="inline-flex items-center gap-1"><Building2 className="h-4 w-4" /> ราคาพิเศษสำหรับองค์กร ติดต่อ 02-045-6104</span>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-[color:var(--brand-green)]" /> ระบบรักษาความปลอดภัย</span>
          <span className="inline-flex items-center gap-1.5"><Camera className="h-3.5 w-3.5 text-[color:var(--brand-green)]" /> กล้อง HD/4K/8MP</span>
          <span className="inline-flex items-center gap-1.5"><Home className="h-3.5 w-3.5 text-[color:var(--brand-green)]" /> Smart Home ครบวงจร</span>
          <span className="inline-flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5 text-[color:var(--brand-green)]" /> ติดตั้งโดยช่างผู้เชี่ยวชาญ</span>
        </div>

      </div>
    </section>
  );
}

/* ---------- Speaker & Audio ---------- */

type SpeakerTab = "all" | "jbl" | "harman" | "bluetooth" | "hifi";

const SPEAKER_TABS: { key: SpeakerTab; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "jbl", label: "JBL" },
  { key: "harman", label: "Harman" },
  { key: "bluetooth", label: "Bluetooth" },
  { key: "hifi", label: "Hi-Fi" },
];

export function SpeakerAudio() {
  const [tab, setTab] = useState<SpeakerTab>("all");

  const q = useQuery({
    queryKey: ["speaker-audio", tab],
    queryFn: async () => {
      // แท็บเฉพาะ (JBL/Harman/Bluetooth/Hi-Fi) — กรองตรงตามเดิม ไม่ต้องสุ่ม เพราะลูกค้าเลือกเองแล้ว
      if (tab !== "all") {
        let qi = supabase
          .from("synnex_products")
          .select("*")
          .eq("category", "Speaker & Audio")
          .eq("price_approved", true)
          .gt("selling_price", 0)
          .order("selling_price", { ascending: true })
          .limit(10);

        if (tab === "jbl") qi = qi.eq("brand", "JBL");
        else if (tab === "harman") qi = qi.eq("brand", "HARMAN");
        else if (tab === "bluetooth") qi = qi.ilike("name", "%bluetooth%");
        else if (tab === "hifi") qi = qi.or("name.ilike.%hi-end%,name.ilike.%hi-fi%");

        const { data } = await qi;
        return (data ?? []) as ProductRow[];
      }

      // แท็บ "ทั้งหมด" — ดึงมาเยอะกว่าเดิม แล้วสุ่มกระจายให้ครบทุกยี่ห้อ ไม่ให้ยี่ห้อถูกสุดยึดที่หมด
      const { data } = await supabase
        .from("synnex_products")
        .select("*")
        .eq("category", "Speaker & Audio")
        .eq("price_approved", true)
        .gt("selling_price", 0)
        .limit(60);

      const rows = (data ?? []) as ProductRow[];
      const byBrand: Record<string, ProductRow[]> = {};
      for (const p of rows) {
        const key = (p.brand ?? "อื่นๆ").toUpperCase();
        (byBrand[key] ??= []).push(p);
      }
      Object.values(byBrand).forEach((arr) => arr.sort(() => Math.random() - 0.5));

      const picked: ProductRow[] = [];
      const brands = Object.keys(byBrand);
      let i = 0;
      while (picked.length < 10 && brands.some((b) => byBrand[b].length > 0)) {
        const b = brands[i % brands.length];
        const item = byBrand[b].shift();
        if (item) picked.push(item);
        i++;
      }
      return picked.sort(() => Math.random() - 0.5);
    },
    staleTime: 5 * 60_000,
  });

  if ((q.data?.length ?? 0) === 0) return null;

  return (
    <section className="border-b bg-white py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="inline-flex items-center gap-2 text-xl font-black text-slate-900 md:text-2xl">
              <Volume2 className="h-5 w-5 text-green-600" />
              Speaker &amp; Audio
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              ลำโพง · Bluetooth · Hi-Fi
            </p>
            <p className="mt-1 text-sm text-slate-500">
              JBL, Harman Kardon — ลำโพงบลูทูธและระบบเสียงคุณภาพสูง
            </p>
          </div>
          <Link
            to="/"
            search={{ category: "Speaker & Audio" } as never}
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-semibold text-[color:var(--brand-green)] hover:underline"
          >
            ดู Speaker ทั้งหมด <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {SPEAKER_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                tab === t.key
                  ? "border-[color:var(--brand-green)] bg-[color:var(--brand-green)] text-white"
                  : "hover:border-[color:var(--brand-green)] hover:text-[color:var(--brand-green)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 lg:gap-3">
          {q.data!.map((p) => <CategoryGridCard key={p.id} p={p} />)}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5"><Volume2 className="h-3.5 w-3.5 text-[color:var(--brand-green)]" /> เสียงคุณภาพสูง</span>
          <span className="inline-flex items-center gap-1.5"><Bluetooth className="h-3.5 w-3.5 text-[color:var(--brand-green)]" /> รองรับ Bluetooth 5.0+</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[color:var(--brand-green)]" /> รับประกันศูนย์ไทย</span>
          <span className="inline-flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-[color:var(--brand-green)]" /> จัดส่งฟรีเมื่อซื้อครบ ฿5,000</span>
        </div>
      </div>
    </section>
  );
}

/* ---------- Corporate IT Solutions ---------- */

type CorpTab = "all" | "network" | "storage" | "security" | "printer" | "ups";

const CORP_TABS: { key: CorpTab; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "ทั้งหมด", icon: <LayoutGrid className="h-4 w-4" /> },
  { key: "network", label: "Network", icon: <NetworkIcon className="h-4 w-4" /> },
  { key: "storage", label: "Storage & NAS", icon: <HardDrive className="h-4 w-4" /> },
  { key: "security", label: "Security", icon: <Shield className="h-4 w-4" /> },
  { key: "printer", label: "Printer", icon: <Printer className="h-4 w-4" /> },
  { key: "ups", label: "UPS", icon: <BatteryCharging className="h-4 w-4" /> },
];

const CORP_TRUST_BADGES = [
  { icon: <FileText className="h-3.5 w-3.5" />, text: "ใบเสนอราคาทันที" },
  { icon: <Receipt className="h-3.5 w-3.5" />, text: "ใบกำกับภาษี VAT 7%" },
  { icon: <CreditCard className="h-3.5 w-3.5" />, text: "วงเงินเครดิต B2B" },
  { icon: <Headphones className="h-3.5 w-3.5" />, text: "After Sale Support" },
];

export function CorporateITSolutions() {
  const [tab, setTab] = useState<CorpTab>("all");

  const q = useQuery({
    queryKey: ["corporate-it", tab],
    queryFn: async () => {
      let qi = supabase
        .from("synnex_products")
        .select("*")
        .eq("price_approved", true)
        .gt("selling_price", 1000)
        .order("selling_price", { ascending: true })
        .limit(10);

      if (tab === "all") {
        qi = qi.or(
          [
            "and(category.eq.Network,brand.in.(CISCO,DLINK,TPLINK,UBIQUITI,FORTINET))",
            "and(category.eq.Storage,brand.in.(QNAP,SYNOLOGY))",
            "and(category.eq.Printer,brand.in.(BROTHER,HP,RICOH,PANTUM,FUJIFILM,OKI,EPSON,CANON,XEROX))",
            "and(category.eq.PC,brand.in.(APC,SYNDOME,SUN,ETECH,VERTIV,CKT,ADVICE-UPS))",
          ].join(","),
        );
      } else if (tab === "network") {
        qi = qi.eq("category", "Network").in("brand", ["CISCO", "DLINK", "TPLINK", "UBIQUITI"]);
      } else if (tab === "storage") {
        qi = qi.eq("category", "Storage").in("brand", ["QNAP", "SYNOLOGY"]);
      } else if (tab === "security") {
        qi = qi.eq("category", "Smart Life").in("brand", ["DAHUA", "HIKVISION", "EZVIZ"]);
      } else if (tab === "printer") {
        qi = qi.eq("category", "Printer").in("brand", ["BROTHER", "HP", "RICOH", "PANTUM", "FUJIFILM", "OKI"]);
      } else if (tab === "ups") {
        qi = qi.eq("category", "PC").in("brand", ["APC", "SYNDOME", "SUN", "ETECH", "VERTIV", "CKT"]);
      }

      const { data } = await qi;
      return (data ?? []) as (ProductRow & { b2b_price?: number | null })[];
    },

    staleTime: 5 * 60_000,
  });

  const products = q.data ?? [];

  return (
    <section
      className="py-16"
      style={{ background: "linear-gradient(180deg, #f8fafc 0%, #f0f4ff 100%)" }}
    >
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
            <Building2 className="h-4 w-4" />
            FOR BUSINESS & ENTERPRISE
          </div>
          <h2 className="mb-3 text-3xl font-black text-slate-900 md:text-4xl">
            Corporate IT Solutions
          </h2>
          <p className="mx-auto mb-6 max-w-xl text-base text-slate-500 md:text-lg">
            Network · Security · Storage · Server
            <br />
            <span className="text-sm text-slate-400 md:text-base">
              สำหรับองค์กร หน่วยงาน และธุรกิจทุกขนาด
            </span>
          </p>
          <div className="mb-2 flex flex-wrap justify-center gap-3">
            {CORP_TRUST_BADGES.map((b) => (
              <div
                key={b.text}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm"
              >
                <span className="text-blue-500">{b.icon}</span>
                {b.text}
              </div>
            ))}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {CORP_TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-[color:var(--brand-navy)] text-white shadow-md"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Products */}
        {products.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            {q.isLoading ? "กำลังโหลด..." : "ยังไม่มีสินค้าในหมวดนี้ กรุณาติดต่อทีมขาย 02-045-6104"}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            {products.map((p) => {
              const slug = (p.slug as string | null) || (p.id as string);
              const b2b = p.b2b_price ?? null;
              return (
                <Link
                  key={p.id as string}
                  to="/product/$slug"
                  params={{ slug }}
                  className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-blue-300 hover:shadow-lg"
                >
                  <div className="mb-3 aspect-square overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100">
                    <ProductImage
                      src={p.image_url as string | null}
                      alt={(p.name as string | null) ?? ""}
                      productName={p.name as string | null}
                      category={p.category as string | null}
                      className="h-full w-full scale-125 object-cover transition-transform duration-300 group-hover:scale-135"
                    />
                  </div>
                  <div className="mb-1.5 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      {(p.brand as string | null) ?? ""}
                    </span>
                  </div>
                  <div className="mb-2 line-clamp-2 min-h-[32px] text-xs font-medium leading-tight text-slate-700">
                    {(p.name as string | null) ?? ""}
                  </div>
                  <DiscountBadgeRow
                    sellingPrice={p.selling_price as number}
                    b2bPrice={b2b}
                    memberPrice={(p as { member_price?: number | null }).member_price}
                    className="mb-1.5"
                  />
                  <div className="flex items-end justify-between">
                    <div className="text-base font-black text-slate-900">
                      ฿{Number(p.selling_price).toLocaleString("th-TH")}
                    </div>
                    <div className="cursor-pointer rounded-lg bg-slate-900 p-2 transition-colors group-hover:bg-blue-600">
                      <ShoppingCart className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-10 flex flex-col items-center justify-between gap-6 rounded-2xl bg-slate-900 p-8 lg:flex-row">
          <div className="text-center lg:text-left">
            <h3 className="mb-1 text-xl font-bold text-white">
              ต้องการราคาพิเศษสำหรับองค์กร?
            </h3>
            <p className="text-sm text-slate-400">
              ทีมผู้เชี่ยวชาญพร้อมให้คำปรึกษา พร้อมออกใบเสนอราคาและวางระบบให้ครบ
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-center gap-3">
            <Link
              to="/"
              search={{ category: "Network" } as never}
              className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-100"
            >
              ดูสินค้าทั้งหมด →
            </Link>
            <Link
              to="/credit-application"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500"
            >
              <CreditCard className="h-4 w-4" />
              สมัครวงเงินเครดิต
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
