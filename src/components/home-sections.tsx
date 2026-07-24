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
} from "lucide-react";
import heroWarehouse from "@/assets/hero-warehouse.jpg";
import heroEnterprise from "@/assets/hero-enterprise.jpg";
import heroDelivery from "@/assets/hero-delivery.jpg";
import { displayPrice, getSellingPrice, priceFmt, useCustomerTier } from "@/lib/cart";
import { triggerAuthPrompt, useSupabaseUser } from "@/lib/auth-sheet";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/i18n";
import { ProductImage } from "@/components/product-image";
import { BrandLogo } from "@/components/brand-logo";


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
    { icon: ShieldCheck, title: "สินค้าแท้ 100%", sub: "Synnex & VST ECS" },
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
            Authorized Dealer • Synnex Thailand & VST ECS
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

const QUICK_CATS = [
  { icon: Laptop,     label: "Notebook",     sub: "Notebook",       cat: "Notebook" },
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
  { icon: LayoutGrid, label: "ดูทั้งหมด",     sub: "View All",       cat: "all" },
];

export function QuickCategoryGrid() {
  return (
    <section className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:gap-4 lg:grid-cols-10">
          {QUICK_CATS.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.label}
                to="/"
                search={{ category: c.cat } as never}
                className="group flex flex-col items-center gap-2 rounded-lg border bg-white p-3 text-center transition hover:-translate-y-0.5 hover:border-[color:var(--brand-green)] hover:shadow-md"
              >
                <div className="grid h-11 w-11 place-items-center rounded-full bg-slate-50 text-[color:var(--brand-navy)] transition group-hover:bg-[color:var(--brand-green)]/10 group-hover:text-[color:var(--brand-green)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-[12px] font-semibold leading-tight text-slate-800">{c.label}</div>
                <div className="text-[10px] text-slate-400">{c.sub}</div>
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
        .order("created_at", { ascending: false })
        .limit(5);
      return (data ?? []) as ProductRow[];
    },
    staleTime: 5 * 60_000,
  });

  if ((q.data?.length ?? 0) === 0) return null;

  return (
    <section className="border-b bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SectionHeader title="ดีลวันนี้" en="Today's Best Deals" />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          {q.data!.map((p) => {
            const ready = p.stock_status === "พร้อมจัดส่ง";
            const slug = p.slug || p.id;
            const selling = getSellingPrice(p, tier) ?? 0;
            const freeShip = selling > 5000;
            const lowStock = ready && (p.stock_qty ?? 999) < 10;
            return (
              <div key={p.id} className="group flex overflow-hidden rounded-lg border bg-white transition hover:shadow-lg lg:flex-col">
                <Link to="/product/$slug" params={{ slug }} className="grid h-32 w-36 shrink-0 place-items-center bg-white p-2 lg:h-40 lg:w-full">
                  <ProductImage src={p.image_url} alt={p.name ?? p.sku} className="h-full w-full object-contain transition group-hover:scale-105" iconClassName="h-12 w-12 text-slate-300" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-1 border-l p-3 lg:border-l-0 lg:border-t">
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-500">
                    {p.brand && <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold">{p.brand}</span>}
                    <span className="truncate">{p.sku}</span>
                  </div>
                  <Link to="/product/$slug" params={{ slug }} className="line-clamp-2 text-sm font-semibold hover:text-[color:var(--brand-navy)]">{p.name ?? p.sku}</Link>
                  <div className="flex flex-wrap items-center gap-1">
                    {freeShip && <Badge className="bg-green-100 text-[10px] text-green-700 hover:bg-green-100">🚚 ฟรีจัดส่ง</Badge>}
                    {lowStock && <Badge className="bg-red-100 text-[10px] text-red-700 hover:bg-red-100">เหลือน้อย</Badge>}
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
        .order("selling_price", { ascending: false })
        .limit(8);
      return (data ?? []) as ProductRow[];
    },
    staleTime: 5 * 60_000,
  });

  if ((q.data?.length ?? 0) === 0) return null;

  return (
    <section className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SectionHeader
          title="Notebook ยอดนิยม"
          en="Popular Notebooks"
          sub="เลือกจาก Notebook หลากหลายแบรนด์"
          link={{ to: "/", search: { category: "Notebook" }, label: "ดูทั้งหมด" }}
        />
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {q.data!.map((p) => {
            const ready = p.stock_status === "พร้อมจัดส่ง";
            const slug = p.slug || p.id;
            return (
              <div key={p.id} className="group relative flex flex-col overflow-hidden rounded-lg border bg-white transition hover:shadow-lg">
                <BrandLogo brand={p.brand} />
                <Link to="/product/$slug" params={{ slug }} className="grid aspect-square place-items-center bg-white p-3">
                  <ProductImage src={p.image_url} alt={p.name ?? p.sku} className="h-full w-full object-contain transition group-hover:scale-105" iconClassName="h-16 w-16 text-slate-300" />
                </Link>
                <div className="flex flex-1 flex-col gap-1 border-t p-3">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">{p.sku}</div>
                  <Link to="/product/$slug" params={{ slug }} className="line-clamp-2 min-h-10 text-sm font-medium hover:text-[color:var(--brand-navy)]">{p.name ?? p.sku}</Link>
                  <div className="mt-auto text-lg font-black text-[color:var(--brand-orange)]">{displayPrice(p, tier)}</div>
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
        .eq("price_approved", true).gt("selling_price", 0)
        .order("selling_price", { ascending: false });
      return (data ?? []) as (ProductRow & { description: string | null })[];
    },
    staleTime: 5 * 60_000,
  });

  if ((q.data?.length ?? 0) === 0) return null;

  return (
    <section className="border-b bg-gradient-to-br from-slate-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SectionHeader
          title="🖥 Computer Set / ชุดคอมพิวเตอร์"
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
                      className="h-full w-full object-contain transition group-hover:scale-105"
                      iconClassName="h-20 w-20 text-slate-300"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col gap-1.5 border-t p-3">
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">{p.sku}</div>
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
                      <div className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        🚚 ส่งฟรี กทม./ปริมณฑล
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
  const [failed, setFailed] = useState(false);
  const domain = BRAND_DOMAINS[brand];
  if (!domain) {
    return (
      <div className="mb-2 flex h-10 items-center justify-center">
        <span className="text-base font-black text-[color:var(--brand-navy)]">{brand}</span>
      </div>
    );
  }
  return (
    <div className="mb-2 flex h-10 items-center justify-center">
      <img
        src={`https://logo.clearbit.com/${domain}`}
        alt={brand}
        className={`max-h-8 max-w-20 object-contain transition group-hover:grayscale-0 ${failed ? "hidden" : "grayscale-[20%]"}`}
        onError={() => setFailed(true)}
      />
      {failed && (
        <span className="text-base font-black text-[color:var(--brand-navy)]">{brand}</span>
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
  const currentSearch = useSearch({ strict: false }) as { brands?: string };
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
    { icon: Award,    title: "Authorized Dealer",    sub: "ตัวแทนจำหน่ายอย่างเป็นทางการ" },
    { icon: Truck,    title: "ส่งตรงจาก Distributor", sub: "Synnex & VST ECS" },
    { icon: FileText, title: "ใบกำกับภาษีได้",         sub: "รองรับนิติบุคคล VAT 7%" },
    { icon: Phone,    title: "ทีมงานพร้อมช่วยเหลือ",     sub: "โทร 02-045-6104" },
  ];
  return (
    <section className="border-y bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
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
        <SectionHeader title="สินค้าที่คุณเพิ่งดู" en="Recently Viewed" />
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
  title: string; en: string; sub?: string;
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

function msMeta(name: string | null | undefined) {
  const n = name ?? "";
  for (const m of MS_DESCRIPTIONS) if (m.match.test(n)) return { short: m.short, desc: m.desc };
  return { short: n.length > 40 ? n.slice(0, 40) + "…" : n, desc: "ผลิตภัณฑ์ลิขสิทธิ์แท้จาก Microsoft" };
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
          title="💿 Software & Licenses / ซอฟต์แวร์ลิขสิทธิ์"
          en="Software & Licenses — Genuine"
          sub="Microsoft 365, Office 2024, Windows 11, Kaspersky, ESET, McAfee — Authorized Dealer"
          link={{ to: "/", search: { category: "Software" }, label: "ดู Software ทั้งหมด" }}
        />

        <div className="flex gap-4 overflow-x-auto pb-3 no-scrollbar snap-x">
          {q.data!.map((p) => {
            const meta = msMeta(p.name);
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
                {/* Microsoft logo top-left */}
                <div className="absolute left-2 top-2 z-10 rounded-md border border-slate-200 bg-white p-1 shadow-sm">
                  <img
                    src="https://img.icons8.com/color/48/microsoft.png"
                    alt="Microsoft"
                    className="h-5 w-5 object-contain"
                  />
                </div>
                {/* Genuine license pill */}
                <div className="absolute right-2 top-2 z-10 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  ลิขสิทธิ์แท้ ✓
                </div>

                <Link to="/product/$slug" params={{ slug }} className="grid place-items-center bg-white p-4 pt-10">
                  <ProductImage
                    src={p.image_url}
                    alt={p.name ?? p.sku}
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
            <span className="text-emerald-600">✓</span> Authorized by Synnex Thailand
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 shadow-sm">
            <span className="text-emerald-600">✓</span> รับประกันโดย Microsoft Thailand
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
  const lowStock = ready && (p.stock_qty ?? 999) < 5;
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border bg-white transition hover:shadow-lg">
      <BrandLogo brand={p.brand} />
      {byOrder ? (
        <div className="absolute right-2 top-2 z-10 rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
          📋 By Order
        </div>
      ) : lowStock ? (
        <div className="absolute right-2 top-2 z-10 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
          เหลือน้อย
        </div>
      ) : null}
      <Link to="/product/$slug" params={{ slug }} className="grid aspect-square place-items-center bg-white p-3">
        <ProductImage
          src={p.image_url}
          alt={p.name ?? p.sku}
          className="h-full w-full object-contain transition group-hover:scale-105"
          iconClassName="h-14 w-14 text-slate-300"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-1 border-t p-3">
        <div className="text-[10px] uppercase tracking-wide text-slate-500">{p.sku}</div>
        <Link
          to="/product/$slug"
          params={{ slug }}
          className="line-clamp-2 min-h-10 text-sm font-medium hover:text-[color:var(--brand-navy)]"
        >
          {p.name ?? p.sku}
        </Link>
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
        .order("selling_price", { ascending: false })
        .limit(8);
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
          sub="Cisco, Hikvision, Dahua, D-Link — Authorized Dealer"
          link={{ to: "/", search: { category: "Network" }, label: "ดู Network ทั้งหมด" }}
        />
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
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
        .order("selling_price", { ascending: true })
        .limit(8);
      return (data ?? []) as ProductRow[];
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
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
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
        .eq("category", "Components")
        .eq("price_approved", true)
        .gt("selling_price", 0)
        .order("selling_price", { ascending: false })
        .limit(8);
      return (data ?? []) as ProductRow[];
    },
    staleTime: 5 * 60_000,
  });

  if ((q.data?.length ?? 0) === 0) return null;

  return (
    <section className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SectionHeader
          title="⚙️ CPU & Components / ชิ้นส่วนคอมพิวเตอร์"
          en="Components — CPU & Memory"
          sub="AMD Ryzen, Intel Core Ultra, Mainboard, RAM DDR4/DDR5"
          link={{ to: "/", search: { category: "Components" }, label: "ดู Components ทั้งหมด" }}
        />
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
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
        .order("selling_price", { ascending: false })
        .limit(8);
      return (data ?? []) as ProductRow[];
    },
    staleTime: 5 * 60_000,
  });

  if ((q.data?.length ?? 0) === 0) return null;

  return (
    <section className="border-b bg-gradient-to-br from-slate-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SectionHeader
          title="🍎 Apple Products / ผลิตภัณฑ์ Apple"
          en="Apple Products"
          sub="iPhone 17, MacBook Air M5, iPad · Authorized Reseller"
          link={{ to: "/", search: { q: "Apple" }, label: "ดู Apple ทั้งหมด" }}
        />
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {q.data!.map((p) => <CategoryGridCard key={p.id} p={p} />)}
        </div>
      </div>
    </section>
  );
}



