import { Truck, Building2, Zap, MapPin, Clock, Phone, Printer, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  OFFICE_ADDRESS,
  useShippingMethod,
  type ShippingMethod,
} from "@/lib/shipping-method";

type Option = {
  value: ShippingMethod;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  line1: string;
  line2: string;
};

const OPTIONS: Option[] = [
  {
    value: "delivery",
    icon: Truck,
    title: "จัดส่งทั่วประเทศไทย",
    subtitle: "Kerry Express / Flash Express",
    line1: "รับสินค้าใน 1-3 วันทำการ",
    line2: "ค่าจัดส่งคำนวณตอน checkout",
  },
  {
    value: "pickup",
    icon: Building2,
    title: "รับสินค้าที่สำนักงาน (ฟรี)",
    subtitle: "บริษัท เอ็นที กรุ๊ป จำกัด",
    line1: "จ-ศ 9:00-18:00 น.",
    line2: "นัดหมายล่วงหน้าก่อนมารับ",
  },
  {
    value: "express",
    icon: Zap,
    title: "ส่งด่วนใน กทม./ปริมณฑล",
    subtitle: "Grab / Lalamove",
    line1: "ได้รับสินค้าภายใน 3 ชั่วโมง",
    line2: "ติดต่อทีมงานเพื่อจัดการ",
  },
];

export function ShippingMethodSelector({ className }: { className?: string }) {
  const [selected, setSelected] = useShippingMethod();

  return (
    <div className={cn("mt-4", className)}>
      <div className="mb-3 font-medium text-gray-700">🚚 เลือกวิธีรับสินค้า</div>
      <div className="space-y-2">
        {OPTIONS.map((opt) => {
          const active = selected === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              className={cn(
                "flex w-full cursor-pointer items-start gap-3 rounded-xl p-3 text-left transition-colors",
                active
                  ? "border-2 border-green-600 bg-green-50"
                  : "border border-gray-200 bg-white hover:border-gray-300",
              )}
              aria-pressed={active}
            >
              <span
                className={cn(
                  "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                  active ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-gray-900">{opt.title}</span>
                <span className="mt-0.5 block text-xs text-gray-600">{opt.subtitle}</span>
                <span className="mt-1 block text-xs text-gray-500">{opt.line1}</span>
                <span className="block text-xs text-gray-400">{opt.line2}</span>
              </span>
              <span
                className={cn(
                  "mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2",
                  active ? "border-green-600 bg-green-600" : "border-gray-300 bg-white",
                )}
                aria-hidden
              >
                {active && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>
            </button>
          );
        })}
      </div>

      {selected === "pickup" && <PickupMap />}
    </div>
  );
}

function PickupMap() {
  return (
    <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
        <MapPin className="h-4 w-4 text-green-600" /> ที่อยู่สำนักงาน
      </div>
      <div className="text-sm text-gray-700">{OFFICE_ADDRESS.name}</div>
      <div className="text-xs text-gray-600">{OFFICE_ADDRESS.line1}</div>
      <div className="text-xs text-gray-600">{OFFICE_ADDRESS.line2}</div>

      <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
        <iframe
          src="https://maps.google.com/maps?q=13.9320709,100.4819588&z=16&output=embed"
          width="100%"
          height={250}
          style={{ border: 0, borderRadius: "12px" }}
          allowFullScreen
          loading="lazy"
          title="ENT GROUP Office Location"
        />
      </div>

      <a
        href={OFFICE_ADDRESS.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
      >
        <MapPin className="h-3.5 w-3.5 text-green-600" /> เปิดใน Google Maps
        <ExternalLink className="h-3 w-3" />
      </a>

      <div className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          <span>เวลาทำการ: จันทร์-ศุกร์ {OFFICE_ADDRESS.hours.replace("จ-ศ ", "")}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Phone className="h-3.5 w-3.5 text-gray-400" />
          <a href={`tel:${OFFICE_ADDRESS.phone.replace(/-/g, "")}`} className="hover:text-gray-900">
            โทร {OFFICE_ADDRESS.phone}
          </a>
          <span className="text-gray-300">|</span>
          <Printer className="h-3.5 w-3.5 text-gray-400" />
          <span>แฟกซ์ {OFFICE_ADDRESS.fax}</span>
        </div>
      </div>
    </div>
  );
}
