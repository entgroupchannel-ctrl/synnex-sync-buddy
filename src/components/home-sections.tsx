import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Laptop, Monitor, Printer, Cpu, Smartphone, Wifi, HardDrive, Package,
  Cable, LayoutGrid, ShoppingCart, Truck, Award, FileText, Phone, ArrowRight,
  ChevronLeft, ChevronRight, Mail, Flame, ShieldCheck, Building2, Warehouse,
} from "lucide-react";
import heroWarehouse from "@/assets/hero-warehouse.jpg";
import heroEnterprise from "@/assets/hero-enterprise.jpg";
import heroDelivery from "@/assets/hero-delivery.jpg";
import { displayPrice, getSellingPrice, useCustomerTier } from "@/lib/cart";
import { triggerAuthPrompt, useSupabaseUser } from "@/lib/auth-sheet";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/i18n";

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
  { icon: Smartphone, label: "สมาร์ตโฟน",     sub: "Smart Phone",    cat: "Smartphone" },
  { icon: Wifi,       label: "Network",      sub: "Network",        cat: "Network" },
  { icon: HardDrive,  label: "Storage",      sub: "Storage",        cat: "Storage" },
  { icon: Package,    label: "Software",     sub: "Software",       cat: "Software" },
  { icon: Cable,      label: "อุปกรณ์เสริม",   sub: "Accessories",    cat: "Accessories" },
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
        .eq("price_approved", true)
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
                  {p.image_url ? <img src={p.image_url} alt={p.name ?? p.sku} className="h-full w-full object-contain transition group-hover:scale-105" loading="lazy" /> : <Package className="h-12 w-12 text-slate-300" />}
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
        .eq("price_approved", true)
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
              <div key={p.id} className="group flex flex-col overflow-hidden rounded-lg border bg-white transition hover:shadow-lg">
                {p.brand && (
                  <div className="absolute z-10 m-2 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 shadow-sm">{p.brand}</div>
                )}
                <Link to="/product/$slug" params={{ slug }} className="grid aspect-square place-items-center bg-white p-3">
                  {p.image_url ? <img src={p.image_url} alt={p.name ?? p.sku} className="h-full w-full object-contain transition group-hover:scale-105" loading="lazy" /> : <Package className="h-16 w-16 text-slate-300" />}
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

/* ---------- Shop by Brand ---------- */

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

  if ((q.data?.length ?? 0) === 0) return null;

  return (
    <section className="border-b bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SectionHeader title="แบรนด์ที่มีจำหน่าย" en="Shop by Brand" />
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
          {q.data!.map(({ brand, count }) => (
            <Link
              key={brand}
              to="/"
              search={{ brands: brand } as never}
              className="group flex min-w-[140px] shrink-0 flex-col items-center justify-center rounded-lg border-2 border-slate-200 bg-white px-5 py-4 transition hover:border-[color:var(--brand-green)] hover:shadow-md"
            >
              <div className="text-base font-black text-[color:var(--brand-navy)] group-hover:text-[color:var(--brand-green)]">{brand}</div>
              <div className="text-[10px] text-slate-400">{count} รายการ</div>
            </Link>
          ))}
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
