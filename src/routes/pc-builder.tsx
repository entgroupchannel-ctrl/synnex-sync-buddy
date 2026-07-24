import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Cpu,
  CircuitBoard,
  MemoryStick,
  HardDrive,
  Monitor,
  Gamepad2,
  Plug,
  Search,
  ShoppingCart,
  FileText,
  MessageCircle,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart, priceFmt, getSellingPrice, useCustomerTier } from "@/lib/cart";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductImage } from "@/components/product-image";
import { LineQrDialog } from "@/components/line-qr-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/pc-builder")({
  head: () => ({
    meta: [
      { title: "Config คอมพิวเตอร์เอง (DIY PC Builder) — ENT Group IT Shop" },
      {
        name: "description",
        content:
          "จัดสเปคคอมพิวเตอร์ในแบบของคุณ เลือก CPU, Mainboard, RAM, SSD, GPU, OS พร้อมทีมงานตรวจสอบความเข้ากันได้ก่อนจัดส่ง",
      },
      { property: "og:title", content: "PC Builder — จัดสเปคคอมของคุณเอง" },
      {
        property: "og:description",
        content: "เลือกชิ้นส่วน PC จากสินค้าแท้ 100% แล้วสั่งซื้อหรือขอใบเสนอราคาได้ทันที",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PcBuilderPage,
});

type Product = {
  id: string;
  sku: string | null;
  slug: string | null;
  name: string;
  brand: string | null;
  category: string | null;
  selling_price: number | null;
  member_price: number | null;
  b2b_price: number | null;
  price_approved: boolean | null;
  image_url: string | null;
  distributor: string | null;
};

type StepKey = "cpu" | "mb" | "ram" | "ssd" | "os" | "gpu" | "psu";

type StepDef = {
  key: StepKey;
  emoji: string;
  icon: typeof Cpu;
  title: string;
  short: string;
  optional?: boolean;
  category: string;
  matches: string[]; // ILIKE patterns
};

const STEPS: StepDef[] = [
  {
    key: "cpu",
    emoji: "🔲",
    icon: Cpu,
    title: "CPU (Processor)",
    short: "CPU",
    category: "Components",
    matches: ["%CPU%", "%processor%", "%Ryzen%", "%Core i%", "%Core Ultra%"],
  },
  {
    key: "mb",
    emoji: "🟩",
    icon: CircuitBoard,
    title: "Motherboard",
    short: "MB",
    category: "Components",
    matches: ["%Motherboard%", "%mainboard%", "%B650%", "%B760%", "%Z790%", "%X670%", "%A620%"],
  },
  {
    key: "ram",
    emoji: "💾",
    icon: MemoryStick,
    title: "RAM (Memory)",
    short: "RAM",
    category: "Components",
    matches: ["%RAM%", "%DDR%", "%Memory%"],
  },
  {
    key: "ssd",
    emoji: "💿",
    icon: HardDrive,
    title: "Storage (SSD/HDD)",
    short: "SSD",
    category: "Storage",
    matches: ["%SSD%", "%NVMe%", "%M.2%", "%HDD%"],
  },
  {
    key: "os",
    emoji: "🖥️",
    icon: Monitor,
    title: "Operating System",
    short: "OS",
    category: "Software",
    matches: ["%Windows%", "%Office%"],
  },
  {
    key: "gpu",
    emoji: "🎮",
    icon: Gamepad2,
    title: "GPU (Graphics Card)",
    short: "GPU",
    optional: true,
    category: "Components",
    matches: ["%RTX%", "%RX %", "%GPU%", "%VGA%", "%GeForce%", "%Radeon%"],
  },
  {
    key: "psu",
    emoji: "🔌",
    icon: Plug,
    title: "PSU / Case",
    short: "PSU/Case",
    optional: true,
    category: "Components",
    matches: ["%PSU%", "%Power Supply%", "%Case%", "%เคส%"],
  },
];

function PcBuilderPage() {
  const navigate = useNavigate();
  const tier = useCustomerTier();
  const { add } = useCart();

  const [openStep, setOpenStep] = useState<StepKey | null>("cpu");
  const [selected, setSelected] = useState<Record<StepKey, Product | null>>({
    cpu: null,
    mb: null,
    ram: null,
    ssd: null,
    os: null,
    gpu: null,
    psu: null,
  });
  const [showQuote, setShowQuote] = useState(false);
  const [showSummaryMobile, setShowSummaryMobile] = useState(false);

  const priceOf = (p: Product | null) =>
    p ? getSellingPrice(p, tier) ?? p.selling_price ?? 0 : 0;

  const total = STEPS.reduce((s, st) => s + priceOf(selected[st.key]), 0);

  const setChoice = (key: StepKey, p: Product | null) => {
    setSelected((prev) => ({ ...prev, [key]: p }));
    if (p) {
      // auto-advance to next unset step
      const nextStep = STEPS.find((s) => s.key !== key && !selected[s.key]);
      setOpenStep(nextStep ? nextStep.key : null);
    }
  };

  const addAllToCart = () => {
    const picked = STEPS.map((s) => ({ step: s, p: selected[s.key] })).filter(
      (x) => x.p,
    ) as { step: StepDef; p: Product }[];
    if (picked.length === 0) {
      toast.error("กรุณาเลือกอย่างน้อย 1 ชิ้นส่วน");
      return;
    }
    for (const { p } of picked) {
      const price = priceOf(p);
      add(
        {
          id: p.id,
          sku: p.sku ?? "",
          slug: p.slug,
          name: p.name,
          price,
          image_url: p.image_url,
          distributor: p.distributor,
          category: p.category,
        },
        1,
      );
    }
    toast.success(`เพิ่ม ${picked.length} รายการลงตะกร้าแล้ว`);
    navigate({ to: "/cart" });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      <div className="border-b bg-gradient-to-br from-[color:var(--brand-navy)] to-[color:var(--brand-navy-2)] text-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="text-2xl font-bold sm:text-3xl">🖥️ Config คอมพิวเตอร์เอง</h1>
          <p className="mt-1 text-sm text-white/80 sm:text-base">
            เลือกชิ้นส่วนที่ใช่ สร้าง PC ในแบบของคุณ · สินค้าแท้ 100%
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 pb-24 lg:pb-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {/* LEFT — Steps */}
          <div className="space-y-3">
            {STEPS.map((step, i) => (
              <StepCard
                key={step.key}
                step={step}
                index={i + 1}
                open={openStep === step.key}
                selected={selected[step.key]}
                onToggle={() =>
                  setOpenStep((cur) => (cur === step.key ? null : step.key))
                }
                onPick={(p) => setChoice(step.key, p)}
                onClear={() => setChoice(step.key, null)}
                tier={tier}
              />
            ))}

            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              💡 ทีมงานจะตรวจสอบความเข้ากันได้ของชิ้นส่วนก่อนจัดส่งทุกครั้ง
            </p>
          </div>

          {/* RIGHT — Summary (desktop sticky) */}
          <aside className="hidden lg:block">
            <div className="sticky top-4">
              <SummaryPanel
                selected={selected}
                total={total}
                priceOf={priceOf}
                onAddAll={addAllToCart}
                onQuote={() => setShowQuote(true)}
                onClear={(k) => setChoice(k, null)}
              />
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile fixed bottom bar */}
      <div className="fixed inset-x-0 bottom-14 z-30 border-t bg-white p-3 shadow-lg lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-slate-500">รวม</div>
            <div className="text-lg font-bold text-[color:var(--brand-navy)]">
              {priceFmt.format(total)}
            </div>
          </div>
          <Button
            className="bg-[color:var(--brand-green)] text-white hover:bg-emerald-600"
            onClick={() => setShowSummaryMobile(true)}
          >
            ดูสรุป
          </Button>
        </div>
      </div>

      {/* Mobile summary drawer */}
      <Dialog open={showSummaryMobile} onOpenChange={setShowSummaryMobile}>
        <DialogContent className="max-h-[85vh] overflow-y-auto lg:hidden">
          <DialogHeader>
            <DialogTitle>🖥️ สรุป PC ของคุณ</DialogTitle>
          </DialogHeader>
          <SummaryPanel
            selected={selected}
            total={total}
            priceOf={priceOf}
            onAddAll={() => {
              setShowSummaryMobile(false);
              addAllToCart();
            }}
            onQuote={() => {
              setShowSummaryMobile(false);
              setShowQuote(true);
            }}
            onClear={(k) => setChoice(k, null)}
            embedded
          />
        </DialogContent>
      </Dialog>

      <QuotationDialog
        open={showQuote}
        onOpenChange={setShowQuote}
        selected={selected}
        priceOf={priceOf}
        total={total}
      />

      <SiteFooter />
    </div>
  );
}

/* ---------- Step Card ---------- */

function StepCard({
  step,
  index,
  open,
  selected,
  onToggle,
  onPick,
  onClear,
  tier,
}: {
  step: StepDef;
  index: number;
  open: boolean;
  selected: Product | null;
  onToggle: () => void;
  onPick: (p: Product) => void;
  onClear: () => void;
  tier: ReturnType<typeof useCustomerTier>;
}) {
  const Icon = step.icon;
  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[color:var(--brand-navy)] text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-slate-500">
            Step {index} {step.optional && <span className="ml-1">(ตัวเลือกเสริม)</span>}
          </div>
          <div className="truncate font-semibold text-[color:var(--brand-navy)]">
            {step.emoji} {step.title}
          </div>
          {selected ? (
            <div className="mt-1 truncate text-sm text-emerald-700">
              <Check className="mr-1 inline h-4 w-4" />
              {selected.name}
            </div>
          ) : (
            <div className="mt-1 text-sm text-slate-400">ยังไม่ได้เลือก</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selected && (
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              aria-label="ลบตัวเลือก"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <span className="rounded-md bg-[color:var(--brand-orange)]/10 px-3 py-1.5 text-sm font-medium text-[color:var(--brand-orange)]">
            {selected ? "เปลี่ยน" : "เลือก"}
          </span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t p-3">
          <ProductPicker step={step} tier={tier} selected={selected} onPick={onPick} />
        </div>
      )}
    </div>
  );
}

/* ---------- Filter Tabs ---------- */

function FilterTabs({
  value,
  onChange,
  options,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              active
                ? "rounded-full bg-[color:var(--brand-navy)] px-4 py-1.5 text-sm font-medium text-white"
                : "rounded-full bg-white px-4 py-1.5 text-sm text-slate-700 ring-1 ring-slate-200 hover:ring-slate-400"
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Product Picker (inline grid) ---------- */

function ProductPicker({
  step,
  tier,
  selected,
  onPick,
}: {
  step: StepDef;
  tier: ReturnType<typeof useCustomerTier>;
  selected: Product | null;
  onPick: (p: Product) => void;
}) {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cpuBrand, setCpuBrand] = useState<"all" | "intel" | "amd">("all");
  const [mbBrand, setMbBrand] = useState<"all" | "asus" | "gigabyte" | "msi" | "asrock">("all");
  const [mbSocket, setMbSocket] = useState<"all" | "am5" | "am4" | "lga1851" | "lga1700">("all");
  const [gpuBrand, setGpuBrand] = useState<"all" | "nvidia" | "amd">("all");
  const [ssdType, setSsdType] = useState<"all" | "sata" | "nvme">("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);

      let q = supabase
        .from("synnex_products")
        .select(
          "id, sku, slug, name, brand, category, selling_price, member_price, b2b_price, price_approved, image_url, distributor",
        );

      if (step.key !== "gpu") {
        q = q.eq("price_approved", true).gt("selling_price", 0);
      }

      let limit = 30;

      switch (step.key) {
        case "cpu": {
          q = q.eq("category", "Components").ilike("name", "CPU%");
          if (cpuBrand === "intel") q = q.eq("brand", "INTEL");
          else if (cpuBrand === "amd") q = q.eq("brand", "AMD");
          else q = q.or("brand.eq.INTEL,brand.eq.AMD");
          limit = cpuBrand === "all" ? 60 : 30;
          break;
        }
        case "mb": {
          q = q.eq("category", "Components").ilike("name", "MAINBOARD%");
          if (mbBrand === "asus") q = q.eq("brand", "ASUS");
          else if (mbBrand === "gigabyte") q = q.eq("brand", "GIGABYTE");
          else if (mbBrand === "msi") q = q.eq("brand", "MSI");
          else if (mbBrand === "asrock") q = q.eq("brand", "ASROCK");
          if (mbSocket === "am5") q = q.ilike("name", "%(AM5)%");
          else if (mbSocket === "am4") q = q.ilike("name", "%(AM4)%");
          else if (mbSocket === "lga1851") q = q.or("name.ilike.%LGA 1851%,name.ilike.%LGA1851%");
          else if (mbSocket === "lga1700") q = q.or("name.ilike.%LGA 1700%,name.ilike.%LGA1700%");
          limit = 40;
          break;
        }
        case "ram": {
          q = q
            .eq("category", "Storage")
            .or("name.ilike.%DDR4%,name.ilike.%DDR5%,name.ilike.%DDR3%,sku.ilike.%CMK%,sku.ilike.%CMH%,sku.ilike.%CMG%,sku.ilike.%F4-%,sku.ilike.%F5-%")
            .not("name", "ilike", "%SSD%")
            .not("name", "ilike", "%HDD%")
            .not("name", "ilike", "%NVMe%")
            .not("name", "ilike", "%Case%")
            .not("name", "ilike", "%FRAME%")
            .not("name", "ilike", "%Mainboard%")
            .not("name", "ilike", "%PRO H%")
            .not("name", "ilike", "%PRO B%")
            .not("name", "ilike", "%Flash%")
            .not("name", "ilike", "%USB%")
            .eq("price_approved", true)
            .gt("selling_price", 0);
          limit = 20;
          break;
        }
        case "ssd":
          q = q
            .eq("category", "Storage")
            .or("name.ilike.%SSD%,name.ilike.%NVMe%,name.ilike.%M.2%")
            .not("name", "ilike", "%RAM%")
            .not("name", "ilike", "%DDR%")
            .not("name", "ilike", "%Case%")
            .not("name", "ilike", "%Mainboard%")
            .not("name", "ilike", "%PC%")
            .not("name", "ilike", "%Intel® Core%");
          if (ssdType === "sata") q = q.ilike("name", "%SATA%");
          else if (ssdType === "nvme") q = q.or("name.ilike.%NVMe%,name.ilike.%M.2%,name.ilike.%PCIe%");
          limit = 40;
          break;
        case "os":
          q = q
            .eq("category", "Software")
            .eq("brand", "MICROSOFT")
            .ilike("name", "%WINDOWS%");
          limit = 10;
          break;
        case "gpu": {
          q = q
            .eq("category", "Components")
            .or("name.ilike.%RTX%,name.ilike.%GTX%,name.ilike.%GeForce%,name.ilike.%Radeon RX%")
            .not("name", "ilike", "%CPU%")
            .not("name", "ilike", "%Mainboard%")
            .not("name", "ilike", "%Threadripper%");
          if (gpuBrand === "nvidia") q = q.or("name.ilike.%RTX%,name.ilike.%GTX%,name.ilike.%GeForce%");
          else if (gpuBrand === "amd") q = q.or("name.ilike.%Radeon RX%,name.ilike.%RX 9%,name.ilike.%RX 7%");
          limit = 30;
          break;
        }
        case "psu": {
          q = q
            .eq("category", "Storage")
            .or("name.ilike.%Case%,name.ilike.%FRAME%,name.ilike.%Chassis%,name.ilike.%Tower%,sku.ilike.%FRAME%")
            .not("name", "ilike", "%SSD%")
            .not("name", "ilike", "%DDR%")
            .not("name", "ilike", "%RAM%")
            .eq("price_approved", true)
            .gt("selling_price", 0);
          limit = 20;
          break;
        }
      }

      const { data, error } = await q
        .order("selling_price", { ascending: true })
        .limit(limit);

      if (cancelled) return;
      if (error) {
        toast.error("โหลดสินค้าไม่สำเร็จ");
        setItems([]);
      } else {
        setItems((data as Product[]) ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [step.key, cpuBrand, mbBrand, mbSocket, gpuBrand, ssdType]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        (p.brand ?? "").toLowerCase().includes(s) ||
        (p.sku ?? "").toLowerCase().includes(s),
    );
  }, [q, items]);

  return (
    <div>
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`ค้นหา ${step.short}...`}
          className="pl-9"
        />
      </div>

      {step.key === "cpu" && (
        <FilterTabs
          className="mb-2"
          value={cpuBrand}
          onChange={(v) => setCpuBrand(v as typeof cpuBrand)}
          options={[
            { value: "all", label: "ทั้งหมด" },
            { value: "intel", label: "🔵 Intel" },
            { value: "amd", label: "🔴 AMD" },
          ]}
        />
      )}

      {step.key === "mb" && (
        <>
          <FilterTabs
            className="mb-2"
            value={mbBrand}
            onChange={(v) => setMbBrand(v as typeof mbBrand)}
            options={[
              { value: "all", label: "ทั้งหมด" },
              { value: "asus", label: "ASUS" },
              { value: "gigabyte", label: "GIGABYTE" },
              { value: "msi", label: "MSI" },
              { value: "asrock", label: "ASRock" },
            ]}
          />
          <FilterTabs
            className="mb-2"
            value={mbSocket}
            onChange={(v) => setMbSocket(v as typeof mbSocket)}
            options={[
              { value: "all", label: "ทั้งหมด" },
              { value: "am5", label: "AM5 (AMD)" },
              { value: "am4", label: "AM4 (AMD)" },
              { value: "lga1851", label: "LGA1851 (Intel)" },
              { value: "lga1700", label: "LGA1700 (Intel)" },
            ]}
          />
        </>
      )}

      {step.key === "ssd" && (
        <FilterTabs
          className="mb-2"
          value={ssdType}
          onChange={(v) => setSsdType(v as typeof ssdType)}
          options={[
            { value: "all", label: "ทั้งหมด" },
            { value: "sata", label: "SATA" },
            { value: "nvme", label: "NVMe / M.2" },
          ]}
        />
      )}

      {step.key === "gpu" && (
        <FilterTabs
          className="mb-2"
          value={gpuBrand}
          onChange={(v) => setGpuBrand(v as typeof gpuBrand)}
          options={[
            { value: "all", label: "ทั้งหมด" },
            { value: "nvidia", label: "🟢 NVIDIA RTX" },
            { value: "amd", label: "🔴 AMD RX" },
          ]}
        />
      )}

      {loading ? (
        <div className="py-10 text-center text-sm text-slate-500">กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-500">
          ไม่พบสินค้า — ลองปรึกษาผู้เชี่ยวชาญได้ที่ Line @entgroup
        </div>
      ) : (
        <div className="grid max-h-[440px] grid-cols-3 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-4 sm:gap-2">
          {filtered.map((p) => {
            const price = getSellingPrice(p, tier) ?? p.selling_price ?? 0;
            const isSelected = selected?.id === p.id;
            const isGpuZeroPrice = step.key === "gpu" && (p.selling_price === 0 || !p.selling_price);
            return (
              <div
                key={p.id}
                onClick={() => onPick(p)}
                className={`cursor-pointer rounded-lg border bg-white p-2 transition-all hover:border-green-500 hover:shadow-sm active:scale-95 ${
                  isSelected ? "border-2 border-green-500 bg-green-50" : ""
                }`}
              >
                <div
                  className="mb-1.5 grid aspect-square place-items-center overflow-hidden rounded-md bg-slate-50"
                  style={{ maxHeight: "80px" }}
                >
                  <ProductImage
                    src={p.image_url}
                    alt={p.name}
                    className="max-h-[75px] w-full object-contain"
                  />
                </div>
                <div className="line-clamp-2 min-h-[28px] text-[11px] leading-tight text-slate-700">
                  {p.name}
                </div>
                {isGpuZeroPrice ? (
                  <>
                    <div className="mt-1 inline-block rounded bg-orange-100 px-1.5 py-0.5 text-[9px] font-semibold text-orange-700">
                      By Order
                    </div>
                    <div className="mt-0.5 text-xs font-bold text-slate-500">ติดต่อสอบถาม</div>
                  </>
                ) : (
                  <div className="mt-1 text-xs font-bold text-[color:var(--brand-orange)]">
                    ฿{price.toLocaleString()}
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isGpuZeroPrice) {
                      window.open(
                        `mailto:sales@entgroup.co.th?subject=ขอใบเสนอราคาการ์ดจอ ${p.name}`,
                        "_blank",
                      );
                    } else {
                      onPick(p);
                    }
                  }}
                  className="mt-1.5 w-full rounded-md bg-[color:var(--brand-navy)] py-1 text-[10px] font-semibold text-white hover:opacity-90"
                >
                  {isGpuZeroPrice ? "📋 ขอใบเสนอราคา" : "เลือก"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Summary Panel ---------- */

function SummaryPanel({
  selected,
  total,
  priceOf,
  onAddAll,
  onQuote,
  onClear,
  embedded = false,
}: {
  selected: Record<StepKey, Product | null>;
  total: number;
  priceOf: (p: Product | null) => number;
  onAddAll: () => void;
  onQuote: () => void;
  onClear: (k: StepKey) => void;
  embedded?: boolean;
}) {
  return (
    <div
      className={
        embedded
          ? "space-y-3"
          : "space-y-3 rounded-lg border bg-white p-4 shadow-sm"
      }
    >
      {!embedded && (
        <h2 className="text-base font-bold text-[color:var(--brand-navy)]">
          🖥️ สรุป PC ของคุณ
        </h2>
      )}
      <div className="divide-y">
        {STEPS.map((s) => {
          const p = selected[s.key];
          return (
            <div key={s.key} className="flex items-start gap-2 py-2 text-sm">
              <div className="w-14 shrink-0 text-xs font-semibold uppercase text-slate-500">
                {s.short}
              </div>
              <div className="min-w-0 flex-1">
                {p ? (
                  <div className="flex items-start justify-between gap-2">
                    <div className="line-clamp-2 text-slate-800">{p.name}</div>
                    <button
                      onClick={() => onClear(s.key)}
                      className="text-slate-400 hover:text-red-500"
                      aria-label="ลบ"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-slate-400">— {s.optional ? "ไม่บังคับ" : "ยังไม่เลือก"}</span>
                )}
              </div>
              <div className="w-20 shrink-0 text-right font-medium">
                {p ? priceFmt.format(priceOf(p)) : "—"}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-sm text-slate-600">รวมทั้งหมด</span>
        <span className="text-xl font-bold text-[color:var(--brand-orange)]">
          {priceFmt.format(total)}
        </span>
      </div>
      <div className="space-y-2 pt-1">
        <Button
          className="w-full bg-[color:var(--brand-green)] text-white hover:bg-emerald-600"
          onClick={onAddAll}
        >
          <ShoppingCart className="mr-2 h-4 w-4" /> เพิ่มทั้งหมดลงตะกร้า
        </Button>
        <Button variant="outline" className="w-full" onClick={onQuote}>
          <FileText className="mr-2 h-4 w-4" /> ขอใบเสนอราคา
        </Button>
        <LineQrDialog>
          <Button variant="outline" className="w-full">
            <MessageCircle className="mr-2 h-4 w-4" /> ปรึกษาผู้เชี่ยวชาญ
          </Button>
        </LineQrDialog>
      </div>
      <p className="rounded-md bg-slate-50 p-2 text-xs text-slate-600">
        💡 ทีมงานจะตรวจสอบความเข้ากันได้ของชิ้นส่วนก่อนจัดส่งทุกครั้ง
      </p>
    </div>
  );
}

/* ---------- Quotation Dialog ---------- */

function QuotationDialog({
  open,
  onOpenChange,
  selected,
  priceOf,
  total,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selected: Record<StepKey, Product | null>;
  priceOf: (p: Product | null) => number;
  total: number;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [lineId, setLineId] = useState("");
  const [availableTime, setAvailableTime] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const TIME_SLOTS = [
    { v: "09:00-12:00", label: "🕘 09:00-12:00" },
    { v: "12:00-14:00", label: "🕐 12:00-14:00" },
    { v: "14:00-17:00", label: "🕑 14:00-17:00" },
    { v: "17:00-19:00", label: "🕔 17:00-19:00" },
    { v: "นัดหมายล่วงหน้า", label: "📅 นัดหมายล่วงหน้า" },
  ];
  const toggleTime = (v: string) =>
    setAvailableTime((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );

  const submit = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error("กรุณากรอกชื่อ อีเมล และเบอร์โทร");
      return;
    }
    const anyPicked = STEPS.some((s) => selected[s.key]);
    if (!anyPicked) {
      toast.error("กรุณาเลือกชิ้นส่วนอย่างน้อย 1 ชิ้น");
      return;
    }
    setSubmitting(true);
    const pick = (k: StepKey) => selected[k];
    const payload = {
      customer_name: name.trim(),
      customer_email: email.trim(),
      customer_phone: phone.trim(),
      note: notes.trim() || null,
      cpu_id: pick("cpu")?.id ?? null,
      cpu_name: pick("cpu")?.name ?? null,
      cpu_price: priceOf(pick("cpu")) || 0,
      mb_id: pick("mb")?.id ?? null,
      mb_name: pick("mb")?.name ?? null,
      mb_price: priceOf(pick("mb")) || 0,
      ram_id: pick("ram")?.id ?? null,
      ram_name: pick("ram")?.name ?? null,
      ram_price: priceOf(pick("ram")) || 0,
      ssd_id: pick("ssd")?.id ?? null,
      ssd_name: pick("ssd")?.name ?? null,
      ssd_price: priceOf(pick("ssd")) || 0,
      os_id: pick("os")?.id ?? null,
      os_name: pick("os")?.name ?? null,
      os_price: priceOf(pick("os")) || 0,
      gpu_id: pick("gpu")?.id ?? null,
      gpu_name: pick("gpu")?.name ?? null,
      gpu_price: priceOf(pick("gpu")) || 0,
      psu_case_id: pick("psu")?.id ?? null,
      psu_case_name: pick("psu")?.name ?? null,
      psu_case_price: priceOf(pick("psu")) || 0,
      total_price: total,
      status: "pending",
    };
    const { data: quote, error } = await supabase
      .from("pc_builder_quotes")
      .insert(payload)
      .select("quote_number")
      .single();
    if (error) {
      setSubmitting(false);
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
      return;
    }
    toast.success(
      `✅ ส่งคำขอสำเร็จ! เลขที่ใบเสนอราคา: ${quote?.quote_number}\nทีมงานจะติดต่อกลับภายใน 1 วันทำการ`,
    );
    onOpenChange(false);
    setName("");
    setEmail("");
    setPhone("");
    setNotes("");
    setSubmitting(false);
    supabase.functions
      .invoke("send-quote-notification", {
        body: {
          quote_number: quote?.quote_number,
          customer_name: payload.customer_name,
          customer_email: payload.customer_email,
          customer_phone: payload.customer_phone,
          components: selected,
          total_price: total,
          note: payload.note,
        },
      })
      .catch(() => {});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>📋 ขอใบเสนอราคา PC Builder</DialogTitle>
          <DialogDescription>
            กรอกข้อมูลติดต่อ ทีมงานจะส่งใบเสนอราคาให้ภายใน 1 วันทำการ
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">ชื่อ-นามสกุล *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">อีเมล *</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">เบอร์โทร *</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">หมายเหตุ</label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น งบประมาณ, การใช้งาน, กำหนดเวลา"
            />
          </div>
          <div className="rounded-md bg-slate-50 p-3 text-sm">
            <div className="mb-1 font-semibold">สรุปสเปค ({priceFmt.format(total)})</div>
            <ul className="space-y-0.5 text-xs text-slate-600">
              {STEPS.map((s) => {
                const p = selected[s.key];
                if (!p) return null;
                return (
                  <li key={s.key} className="truncate">
                    <span className="font-medium">{s.short}:</span> {p.name}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button
            className="bg-[color:var(--brand-green)] text-white hover:bg-emerald-600"
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? "กำลังส่ง..." : "ส่งคำขอใบเสนอราคา"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
