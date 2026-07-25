import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Wifi, Printer, BatteryCharging, HardDrive, ShoppingCart, CreditCard, Laptop, Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductImage } from "@/components/product-image";
import { DiscountBadgeRow } from "@/components/discount-badge";

export const Route = createFileRoute("/corporate")({
  head: () => ({
    meta: [
      { title: "Corporate IT Solutions — ENT Group IT Shop" },
      {
        name: "description",
        content:
          "โซลูชันไอทีสำหรับองค์กร Network, Printer, UPS และ NAS Storage พร้อมใบเสนอราคา ใบกำกับภาษี และวงเงินเครดิต B2B",
      },
      { property: "og:title", content: "Corporate IT Solutions — ENT Group" },
      {
        property: "og:description",
        content: "ครบทุกความต้องการไอทีขององค์กร Network · Printer · UPS · NAS Storage",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CorporatePage,
});

type Row = Record<string, unknown> & {
  id: string;
  name: string | null;
  slug: string | null;
  brand: string | null;
  image_url: string | null;
  category: string | null;
  selling_price: number;
  b2b_price?: number | null;
};

function useCorpQuery(
  key: string,
  category: string,
  brands: string[],
  opts: { minPrice?: number; distributor?: string } = {},
) {
  return useQuery({
    queryKey: ["corporate-page", key],
    queryFn: async () => {
      let q = supabase
        .from("synnex_products")
        .select("*")
        .eq("category", category)
        .in("brand", brands)
        .eq("price_approved", true)
        .order("selling_price", { ascending: true })
        .limit(5);
      if (opts.distributor) q = q.eq("distributor", opts.distributor);
      if (opts.minPrice && opts.minPrice > 0) q = q.gt("selling_price", opts.minPrice);
      const { data } = await q;
      return (data ?? []) as Row[];
    },
    staleTime: 5 * 60_000,
  });
}

function ProductCard({ p }: { p: Row }) {
  const slug = p.slug || p.id;
  
  return (
    <Link
      to="/product/$slug"
      params={{ slug }}
      className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-3 transition-all duration-200 hover:border-blue-200 hover:shadow-md"
    >
      <div
        className="relative mb-3 w-full overflow-hidden rounded-xl border border-slate-100 bg-white"
        style={{ paddingBottom: "75%" }}
      >
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <ProductImage
            src={p.image_url}
            alt={p.name ?? ""}
            productName={p.name}
            category={p.category}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            iconClassName="h-16 w-16 text-slate-300"
          />
        </div>
      </div>
      <div className="mb-1 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
          {p.brand ?? ""}
        </span>
      </div>
      <div className="mb-1.5 line-clamp-2 min-h-[28px] text-xs font-medium leading-tight text-slate-700">
        {p.name ?? ""}
      </div>
      <DiscountBadgeRow
        sellingPrice={p.selling_price}
        b2bPrice={p.b2b_price}
        memberPrice={(p as { member_price?: number | null }).member_price}
        className="mb-1.5"
      />
      <div className="flex items-end justify-between">
        <div className="text-sm font-black text-slate-900">
          ฿{Number(p.selling_price).toLocaleString("th-TH")}
        </div>
        <div className="cursor-pointer rounded-lg bg-slate-900 p-2 transition-colors group-hover:bg-blue-600">
          <ShoppingCart className="h-3.5 w-3.5 text-white" />
        </div>
      </div>
    </Link>
  );
}

type SectionProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  products: Row[];
  loading: boolean;
  viewAllCategory?: string;
};

function Section({ icon, title, subtitle, products, loading, viewAllCategory }: SectionProps) {
  return (
    <section className="bg-white">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {icon}
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <span className="text-sm text-slate-400">{subtitle}</span>
        </div>
        {viewAllCategory ? (
          <Link
            to="/"
            search={{ category: viewAllCategory } as never}
            className="shrink-0 text-sm text-blue-600 hover:underline"
          >
            ดูทั้งหมด →
          </Link>
        ) : null}
      </div>
      {products.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          {loading ? "กำลังโหลด..." : "ยังไม่มีสินค้าในหมวดนี้ กรุณาติดต่อทีมขาย 02-045-6104"}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </section>
  );
}

function CorporatePage() {
  const notebook = useCorpQuery(
    "notebook",
    "Notebook",
    ["LENOVO", "HP", "DELL", "ACER", "ASUS", "MSI", "MICROSOFT"],
    { distributor: "ADVICE" },
  );
  const desktop = useCorpQuery(
    "desktop",
    "PC",
    ["LENOVO", "HP", "ACER", "MSI", "SVOA", "MINIX"],
    { distributor: "ADVICE", minPrice: 15000 },
  );
  const network = useCorpQuery("network", "Network", ["CISCO", "DLINK", "TPLINK", "UBIQUITI"], { minPrice: 1000 });
  const printer = useCorpQuery("printer", "Printer", ["BROTHER", "HP", "RICOH", "PANTUM", "FUJIFILM"], { minPrice: 1000 });
  const ups = useCorpQuery("ups", "PC", ["APC", "SYNDOME", "SUN", "ETECH", "VERTIV", "CKT"]);
  const nas = useCorpQuery("nas", "Storage", ["QNAP", "SYNOLOGY"]);

  const badges = [
    "ใบเสนอราคาทันที",
    "ใบกำกับภาษี VAT 7%",
    "วงเงินเครดิต B2B",
    "After Sale Support",
  ];

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <div className="bg-slate-900 py-14 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/20 px-4 py-1.5 text-sm text-blue-300">
            <Building2 className="h-4 w-4" />
            FOR BUSINESS & ENTERPRISE
          </div>
          <h1 className="mb-3 text-4xl font-black">Corporate IT Solutions</h1>
          <p className="mx-auto mb-6 max-w-2xl text-lg text-slate-400">
            ครบทุกความต้องการไอทีขององค์กร
            <br />
            Network · Printer · UPS · NAS Storage
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {badges.map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm"
              >
                ✅ {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12">
        <Section
          icon={<Laptop className="h-6 w-6 text-slate-600" />}
          title="Notebook สำหรับองค์กร"
          subtitle="Lenovo · HP · Dell · Acer · ASUS"
          products={notebook.data ?? []}
          loading={notebook.isLoading}
          viewAllCategory="Notebook"
        />
        <Section
          icon={<Monitor className="h-6 w-6 text-slate-600" />}
          title="Desktop PC / AIO"
          subtitle="Lenovo ThinkCentre · HP · Acer · MSI"
          products={desktop.data ?? []}
          loading={desktop.isLoading}
          viewAllCategory="PC"
        />
        <Section
          icon={<Wifi className="h-6 w-6 text-blue-600" />}
          title="Network Equipment"
          subtitle="Switch · Router · Access Point · Firewall"
          products={network.data ?? []}
          loading={network.isLoading}
          viewAllCategory="Network"
        />
        <Section
          icon={<Printer className="h-6 w-6 text-green-600" />}
          title="Printer & Scanner"
          subtitle="Laser · Inkjet · Scanner"
          products={printer.data ?? []}
          loading={printer.isLoading}
          viewAllCategory="Printer"
        />
        <Section
          icon={<BatteryCharging className="h-6 w-6 text-yellow-600" />}
          title="UPS เครื่องสำรองไฟ"
          subtitle="APC · SYNDOME · SUN · ETECH"
          products={ups.data ?? []}
          loading={ups.isLoading}
        />
        <Section
          icon={<HardDrive className="h-6 w-6 text-purple-600" />}
          title="NAS Storage"
          subtitle="QNAP · Synology"
          products={nas.data ?? []}
          loading={nas.isLoading}
        />

        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-slate-900 p-8 lg:flex-row">
          <div className="text-center lg:text-left">
            <h3 className="mb-1 text-xl font-bold text-white">
              ต้องการราคาพิเศษและวงเงินเครดิต?
            </h3>
            <p className="text-sm text-slate-400">
              ทีมผู้เชี่ยวชาญพร้อมออกใบเสนอราคา และวางระบบ IT ให้ครบวงจร
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <a
              href="tel:020456104"
              className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-900 hover:bg-slate-100"
            >
              📞 02-045-6104
            </a>
            <Link
              to="/credit-application"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500"
            >
              <CreditCard className="h-4 w-4" />
              สมัครวงเงินเครดิต
            </Link>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
