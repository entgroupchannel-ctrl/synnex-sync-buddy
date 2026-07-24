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

/* ---------- Hero Carousel ---------- */

type Slide = {
  image: string;
  align: "left" | "right";
  eyebrowIcon: typeof Flame;
  eyebrow: string;
  title: string;
  titleAccent: string;
  sub: string;
  stats?: { value: string; label: string }[];
  cta: string;
  ctaAction: () => void;
};

export function HeroCarousel({ onBrowse, onReady }: { onBrowse: () => void; onReady: () => void }) {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  const slides: Slide[] = useMemo(() => [
    {
      image: heroWarehouse,
      align: "left",
      eyebrowIcon: Warehouse,
      eyebrow: "Authorized Dealer • Synnex Thailand & VST ECS",
      title: "สินค้าแท้ 100%",
      titleAccent: "จากผู้จัดจำหน่ายไทยโดยตรง",
      sub: "เราเปิดเผยที่มาชัดเจน — นำเข้าและจัดจำหน่ายผ่าน Synnex (Thailand) และ VST ECS ผู้จัดจำหน่ายไอทีรายใหญ่ที่สุดของไทย พร้อมสต๊อกในประเทศ ส่งไว รับประกันศูนย์ไทยเต็มรูปแบบ",
      stats: [
        { value: "10+", label: "ปีในวงการ IT" },
        { value: "100%", label: "สินค้าแท้ประกันศูนย์" },
        { value: "2 แบรนด์", label: "Distributor หลัก" },
      ],
      cta: "ดูสินค้าพร้อมส่ง / Shop In-Stock",
      ctaAction: onReady,
    },
    {
      image: heroEnterprise,
      align: "right",
      eyebrowIcon: Building2,
      eyebrow: "ENT Group — ผู้ให้บริการไอทีองค์กร",
      title: "8,000+ องค์กร",
      titleAccent: "ไว้วางใจเรา",
      sub: "ต่อยอดจาก ENTerprise.co.th เว็บไซต์หลักของเรา ที่ให้บริการลูกค้าองค์กรกว่า 8,000 รายทั่วประเทศ วันนี้เราเปิดร้านค้าออนไลน์นี้ให้ลูกค้า ทั่วไป / สมาชิก / องค์กร เข้าถึงราคา Dealer จริงได้โดยตรง",
      stats: [
        { value: "8,000+", label: "ลูกค้าองค์กร" },
        { value: "B2C · B2B", label: "ครบทุกกลุ่ม" },
        { value: "VAT", label: "ออกใบกำกับภาษีได้" },
      ],
      cta: "สมัครสมาชิก / Join Now",
      ctaAction: () => navigate({ to: "/auth" }),
    },
    {
      image: heroDelivery,
      align: "left",
      eyebrowIcon: ShieldCheck,
      eyebrow: "พร้อมส่งจากสต๊อกไทย • ประกันครบวงจร",
      title: "ส่งไว มั่นใจ",
      titleAccent: "ก่อน · ระหว่าง · หลังการขาย",
      sub: "สินค้าพร้อมส่งจากคลังในประเทศไทย — จัดส่งเร็ว ตรวจสอบสถานะได้ พร้อมทีมงานผู้เชี่ยวชาญให้คำปรึกษาก่อนซื้อ ดูแลระหว่างใช้งาน และบริการหลังการขายผ่านศูนย์บริการทั่วประเทศ",
      stats: [
        { value: "1-3 วัน", label: "จัดส่งทั่วไทย" },
        { value: "24/7", label: "ทีมซัพพอร์ต" },
        { value: "ศูนย์ไทย", label: "รับประกันเต็มรูปแบบ" },
      ],
      cta: "เริ่มช้อปเลย / Browse All",
      ctaAction: onBrowse,
    },
  ], [onBrowse, onReady, navigate]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  const s = slides[i];
  const EyebrowIcon = s.eyebrowIcon;
  const isRight = s.align === "right";

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative overflow-hidden bg-[color:var(--brand-navy)]"
    >
      {/* Background image + gradient scrim */}
      <div className="absolute inset-0">
        <img
          key={s.image}
          src={s.image}
          alt=""
          className="h-full w-full object-cover animate-fade-in"
          loading="eager"
          width={1920}
          height={1088}
        />
        <div
          className={`absolute inset-0 ${
            isRight
              ? "bg-gradient-to-l from-[color:var(--brand-navy)]/95 via-[color:var(--brand-navy)]/70 to-transparent"
              : "bg-gradient-to-r from-[color:var(--brand-navy)]/95 via-[color:var(--brand-navy)]/70 to-transparent"
          }`}
        />
        <div className="absolute inset-0 bg-[color:var(--brand-navy)]/30" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-14 md:py-24">
        <div className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
          <div className="max-w-xl animate-fade-in" key={i}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
              <EyebrowIcon className="h-3.5 w-3.5 text-[color:var(--brand-orange)]" />
              {s.eyebrow}
            </div>
            <h1 className="text-4xl font-black leading-[1.05] text-white md:text-6xl">
              {s.title}<br />
              <span className="text-[color:var(--brand-orange)]">{s.titleAccent}</span>
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/85 md:text-lg">{s.sub}</p>

            {s.stats && (
              <div className="mt-6 grid max-w-md grid-cols-3 gap-3">
                {s.stats.map((st) => (
                  <div key={st.label} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 backdrop-blur">
                    <div className="text-lg font-black text-[color:var(--brand-orange)] md:text-xl">{st.value}</div>
                    <div className="text-[10px] leading-tight text-white/70 md:text-[11px]">{st.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" className="bg-[color:var(--brand-orange)] font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-[color:var(--brand-orange-dark)]" onClick={s.ctaAction}>
                {s.cta}
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 bg-white/5 font-semibold text-white backdrop-blur hover:bg-white/15 hover:text-white" onClick={() => navigate({ to: "/contact" })}>
                ติดต่อเรา / Contact
              </Button>
            </div>
          </div>
        </div>

        {/* controls */}
        <div className={`mt-10 flex items-center gap-2 ${isRight ? "justify-end" : "justify-start"}`}>
          <button
            onClick={() => setI((v) => (v - 1 + slides.length) % slides.length)}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20"
            aria-label="Previous slide"
          ><ChevronLeft className="h-4 w-4" /></button>
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className={`h-2 rounded-full transition-all ${idx === i ? "w-10 bg-[color:var(--brand-orange)]" : "w-2 bg-white/40 hover:bg-white/70"}`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
          <button
            onClick={() => setI((v) => (v + 1) % slides.length)}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20"
            aria-label="Next slide"
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
