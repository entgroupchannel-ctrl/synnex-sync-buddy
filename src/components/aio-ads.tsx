import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { getBrandLogoUrl } from "@/lib/brand-assets";

import adAsus from "@/assets/aio-ads/ad-asus-v440va.jpg";
import adAcer from "@/assets/aio-ads/ad-acer-c24a.jpg";
import adLenovoG5 from "@/assets/aio-ads/ad-lenovo-g5.jpg";
import adLenovoG6 from "@/assets/aio-ads/ad-lenovo-g6.jpg";
import adHp from "@/assets/aio-ads/ad-hp-24cy.jpg";

type Ad = {
  slug: string;
  brand: string;
  image: string;
  badge: string;
  title: string;
  headline: string;
  bullets: string[];
  price: number;
  tone: string;
};

const ADS: Ad[] = [
  {
    slug: "c5b0c8d4-4771-4252-9018-bf7567866a0b",
    brand: "ASUS",
    image: adAsus,
    badge: "เริ่มต้นถูกสุด",
    title: "AIO Asus V440VA-WPC002WA",
    headline: "ได้ Office แท้ ในงบประหยัด",
    bullets: ["แถม Office 2024", "MS365 Basic ครบ", "ราคาเริ่มต้นถูกสุดในไลน์"],
    price: 23620,
    tone: "from-emerald-600/85",
  },
  {
    slug: "672c97b5-9a3d-4273-a84d-9d39b2befdf3",
    brand: "ACER",
    image: adAcer,
    badge: "คุ้มที่สุด",
    title: "AIO Acer Aspire C24A-C512016GT23Mi/T005",
    headline: "RAM 16GB + Office 2024 ไม่ถึง 3 หมื่น",
    bullets: ["RAM 16GB ลื่นทุกงาน", "Office 2024 ในเครื่อง", "สเปคชนะคู่แข่งช่วงราคาเดียวกัน"],
    price: 28160,
    tone: "from-sky-700/85",
  },
  {
    slug: "aio-lenovo-thinkcentre-neo-50a-24-g5-12sd0050th-3bbad7d6",
    brand: "LENOVO",
    image: adLenovoG5,
    badge: "ยอดนิยมออฟฟิศ",
    title: "AIO Lenovo ThinkCentre Neo 50a 24 G5",
    headline: "สเปคออฟฟิศมาตรฐาน ที่องค์กรเลือกมากที่สุด",
    bullets: ["Core i5-13420H", "RAM 16GB / SSD 512GB", "ทนทานระดับ ThinkCentre"],
    price: 28990,
    tone: "from-slate-900/85",
  },
  {
    slug: "4d2e3a11-90e3-4c15-bbe1-e9f1ea9a1ff0",
    brand: "LENOVO",
    image: adLenovoG6,
    badge: "AI PC ธุรกิจ",
    title: "AIO Lenovo ThinkCentre Neo 50a 24 G6 LNL",
    headline: "AI PC สำหรับธุรกิจยุคใหม่",
    bullets: ["Intel Core Ultra 5 226V", "LPDDR5X เร็วแรงประหยัดไฟ", "Windows 11 Pro พร้อมใช้"],
    price: 34730,
    tone: "from-indigo-900/85",
  },
  {
    slug: "7d517bc0-dd84-4563-a965-b3c04c9f3a83",
    brand: "HP",
    image: adHp,
    badge: "AI PC + Office",
    title: "AIO HP 24-cy0015d",
    headline: "AI PC พร้อม Office ในตัว",
    bullets: ["Intel Core Ultra 5 325", "Office 2024 + MS365", "จอสวย งานบ้าน–งานออฟฟิศจบในเครื่อง"],
    price: 36460,
    tone: "from-amber-700/85",
  },
];

function BrandChip({ brand, size = "md" }: { brand: string; size?: "md" | "sm" }) {
  const logo = getBrandLogoUrl(brand);
  const h = size === "md" ? 22 : 16;
  return (
    <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-lg bg-white/95 px-2.5 py-1.5 shadow-md ring-1 ring-black/5 backdrop-blur">
      {logo ? (
        <img src={logo} alt={brand} style={{ height: h, maxWidth: 74, objectFit: "contain" }} />
      ) : (
        <span className="text-xs font-bold text-slate-700">{brand}</span>
      )}
      <span className="hidden items-center gap-1 border-l border-slate-200 pl-2 text-[10px] font-semibold text-emerald-700 sm:inline-flex">
        <ShieldCheck className="h-3 w-3" /> ประกันศูนย์ไทย
      </span>
    </div>
  );
}

const baht = (n: number) => `฿${n.toLocaleString("th-TH")}`;

export function AioAdsShowcase() {
  const [hero, ...rest] = ADS;

  return (
    <section className="border-b bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-4 flex items-end gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <Trophy className="h-5 w-5 text-[color:var(--brand-orange)]" />
              5 รุ่น All-in-One แนะนำ
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              คัดมาแล้วทุกช่วงราคา — คลิกเพื่อดูรายละเอียดและหยิบใส่ตะกร้า
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Link
            to="/product/$slug"
            params={{ slug: hero.slug }}
            className="group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg"
          >
            <BrandChip brand={hero.brand} />
            <img
              src={hero.image}
              alt={hero.title}
              width={1024}
              height={1024}
              loading="lazy"
              className="h-64 w-full object-cover transition duration-500 group-hover:scale-[1.03] lg:h-full lg:min-h-[420px]"
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${hero.tone} via-black/30 to-transparent`} />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> {hero.badge}
              </span>
              <h3 className="mt-2 text-2xl font-bold leading-tight">{hero.headline}</h3>
              <p className="mt-1 text-sm text-white/85">{hero.title}</p>
              <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/90">
                {hero.bullets.map((b) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-2xl font-extrabold">{baht(hero.price)}</span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-slate-900">
                  หยิบใส่ตะกร้า <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>

          <div className="grid gap-4 sm:grid-cols-2">
            {rest.map((ad) => (
              <Link
                key={ad.slug}
                to="/product/$slug"
                params={{ slug: ad.slug }}
                className="group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg"
              >
                <BrandChip brand={ad.brand} size="sm" />
                <img
                  src={ad.image}
                  alt={ad.title}
                  width={1024}
                  height={1024}
                  loading="lazy"
                  className="h-44 w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${ad.tone} via-black/25 to-transparent`} />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <span className="inline-flex rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold backdrop-blur">
                    {ad.badge}
                  </span>
                  <h3 className="mt-1.5 text-base font-bold leading-snug">{ad.headline}</h3>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-white/80">{ad.title}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg font-extrabold">{baht(ad.price)}</span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-900">
                      สั่งซื้อ <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
