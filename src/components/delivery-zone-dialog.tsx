import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Truck, MapPin, Building2, X, User, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DELIVERY_ZONE_EVENTS,
  ZONE_INFO,
  getDeliveryZone,
  setDeliveryZone,
  useDeliveryZone,
  openDeliveryZoneDialog,
  type DeliveryZone,
} from "@/lib/delivery-zone";

const ZONES: { key: DeliveryZone; label: string; sub: string }[] = [
  { key: "bkk", label: ZONE_INFO.bkk.label, sub: `${ZONE_INFO.bkk.courier} · ฟรีเมื่อครบ ฿5,000` },
  { key: "upcountry", label: ZONE_INFO.upcountry.label, sub: `${ZONE_INFO.upcountry.courier} · ฟรีเมื่อครบ ฿10,000` },
];

export function DeliveryZoneDialog() {
  const [open, setOpen] = useState(false);
  const [zone, setZone] = useState<DeliveryZone | null>(null);

  useEffect(() => {
    const current = getDeliveryZone();
    setZone(current ?? "bkk");
    const shown = window.sessionStorage.getItem(DELIVERY_ZONE_EVENTS.SESSION_KEY);
    let timer: number | undefined;
    if (!current && !shown) {
      timer = window.setTimeout(() => {
        window.sessionStorage.setItem(DELIVERY_ZONE_EVENTS.SESSION_KEY, "1");
        setOpen(true);
      }, 2000);
    }
    const onOpen = () => {
      setZone(getDeliveryZone() ?? "bkk");
      setOpen(true);
    };
    window.addEventListener(DELIVERY_ZONE_EVENTS.OPEN, onOpen);
    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener(DELIVERY_ZONE_EVENTS.OPEN, onOpen);
    };
  }, []);

  if (!open) return null;

  const dismiss = () => {
    if (!getDeliveryZone()) setDeliveryZone("bkk");
    setOpen(false);
  };

  const confirm = () => {
    setDeliveryZone(zone ?? "bkk");
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/30 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="ตรวจสอบการจัดส่งในพื้นที่ของคุณ"
      onClick={dismiss}
    >
      <div
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
          <h2 className="flex min-w-0 items-center gap-2 text-base font-bold text-slate-900">
            <Truck className="h-5 w-5 shrink-0 text-[color:var(--brand-green)]" />
            ตรวจสอบการจัดส่งในพื้นที่ของคุณ
          </h2>
          <button onClick={dismiss} aria-label="ปิด" className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">ราคาและเวลาจัดส่งอาจแตกต่างกันตามพื้นที่ที่คุณอยู่</p>

        <div className="mt-4 rounded-xl border bg-slate-50 p-3">
          <Link to="/auth" search={{ tab: "signin" } as never} onClick={() => setOpen(false)}>
            <Button className="w-full gap-2 bg-[color:var(--brand-navy)] text-white hover:opacity-90">
              <User className="h-4 w-4" /> เข้าสู่ระบบ / สมัครสมาชิก
            </Button>
          </Link>
          <p className="mt-1 text-center text-xs text-slate-400">สมัครฟรี รับราคาสมาชิกทันที -5%</p>
        </div>

        <Divider />

        <div className="text-sm font-semibold text-slate-700">เลือกพื้นที่จัดส่ง:</div>
        <div className="mt-2 space-y-2">
          {ZONES.map((z) => (
            <ZoneCard key={z.key} selected={zone === z.key} onSelect={() => setZone(z.key)} icon={<MapPin className="h-4 w-4" />} label={z.label} sub={z.sub} />
          ))}
        </div>

        <Divider />

        <ZoneCard
          selected={zone === "pickup"}
          onSelect={() => setZone("pickup")}
          icon={<Building2 className="h-4 w-4" />}
          label="รับสินค้าที่สำนักงาน (ฟรี)"
          sub="ปากเกร็ด นนทบุรี · จ-ศ 9:00-18:00"
        />

        <Button onClick={confirm} className="mt-4 w-full bg-[color:var(--brand-green)] font-semibold text-white hover:opacity-90">
          ยืนยัน
        </Button>
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
      <span className="h-px flex-1 bg-slate-200" />
      หรือ
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function ZoneCard({
  selected,
  onSelect,
  icon,
  label,
  sub,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border-2 p-3 text-left transition ${
        selected ? "border-green-600 bg-green-50" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <span className="shrink-0 text-slate-500">{icon}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-900">{label}</span>
        <span className="block truncate text-xs text-slate-500">{sub}</span>
      </span>
      {selected && <Check className="h-4 w-4 shrink-0 text-green-600" />}
    </button>
  );
}

/** Badge แสดงพื้นที่ที่เลือก — คลิกเพื่อเปลี่ยน */
export function DeliveryZoneBadge({ className }: { className?: string }) {
  const zone = useDeliveryZone();
  return (
    <button
      type="button"
      onClick={openDeliveryZoneDialog}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium hover:bg-white/20 ${className ?? ""}`}
      aria-label="เปลี่ยนพื้นที่จัดส่ง"
    >
      <Truck className="h-3.5 w-3.5" />
      <span className="max-w-24 truncate">{zone ? ZONE_INFO[zone].short : "เลือกพื้นที่ส่ง"}</span>
    </button>
  );
}

/** กล่องข้อมูลจัดส่งตามพื้นที่ที่เลือก */
export function DeliveryZoneInfoBox({ className }: { className?: string }) {
  const zone = useDeliveryZone();
  const info = zone ? ZONE_INFO[zone] : null;
  return (
    <button
      type="button"
      onClick={openDeliveryZoneDialog}
      className={`w-full rounded-lg border bg-slate-50 p-3 text-left text-sm hover:border-slate-300 ${className ?? ""}`}
    >
      <div className="font-medium text-slate-800">{info ? info.hint : "🚚 เลือกพื้นที่จัดส่งเพื่อดูค่าส่งและระยะเวลา"}</div>
      {info && (
        <div className="mt-0.5 text-xs text-slate-500">
          {info.courier}
          {info.freeOver ? ` · ฟรีค่าส่งเมื่อครบ ฿${info.freeOver.toLocaleString()}` : ""} · ค่าส่ง {info.feeRange}
        </div>
      )}
      <div className="mt-1 text-xs font-medium text-[color:var(--brand-green)]">เปลี่ยนพื้นที่จัดส่ง</div>
    </button>
  );
}
