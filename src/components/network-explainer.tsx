/**
 * NetworkExplainer / NetworkProBadge — สำหรับสินค้าเครือข่ายระดับองค์กร (Huawei, Cisco, Aruba, Fortinet ฯลฯ)
 * อธิบายว่าอุปกรณ์รุ่นนี้คืออะไร ทำอะไรได้ ข้อควรคำนึงในการเลือกใช้
 * และเหตุผลที่ควรใช้บริการติดตั้ง/ดูแลระบบกับ ENT Group
 */
import { useState } from "react";
import {
  Network,
  Info,
  Cog,
  CircleCheck,
  TriangleAlert,
  ShieldCheck,
  Wrench,
  BadgeCheck,
  Building2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

export const ENTERPRISE_NET_BRANDS = [
  "huawei",
  "cisco",
  "aruba",
  "hpe",
  "hp enterprise",
  "fortinet",
  "juniper",
  "ruckus",
  "ubiquiti",
  "mikrotik",
  "h3c",
  "zyxel",
  "netgear",
  "dell",
  "extreme",
  "sophos",
  "palo alto",
];

const NETWORK_CATEGORIES = ["network", "networking", "network & security"];

export function isEnterpriseNetwork(
  category?: string | null,
  brand?: string | null,
  name?: string | null,
) {
  const c = (category ?? "").toLowerCase();
  if (!NETWORK_CATEGORIES.some((k) => c.includes(k))) return false;
  const s = `${brand ?? ""} ${name ?? ""}`.toLowerCase();
  return ENTERPRISE_NET_BRANDS.some((b) => s.includes(b));
}

type NetKind =
  | "switch"
  | "router"
  | "firewall"
  | "ap"
  | "controller"
  | "transceiver"
  | "poe"
  | "accessory";

function kindOf(name?: string | null, description?: string | null): NetKind {
  const s = `${name ?? ""} ${description ?? ""}`.toLowerCase();
  if (/(firewall|fortigate|utm|ngfw|security gateway|usg)/.test(s)) return "firewall";
  if (/(access point|\bap\b|wireless ap|wi-?fi 6|wi-?fi 7|airengine|unifi ap)/.test(s)) return "ap";
  if (/(controller|wlc|ac650|ac6[0-9]{3}|cloud key)/.test(s)) return "controller";
  if (/(sfp|qsfp|transceiver|gbic|module optical|โมดูล)/.test(s)) return "transceiver";
  if (/(switch|สวิตช์|s5700|s5735|catalyst|cbs\d|es-\d)/.test(s)) return "switch";
  if (/(router|เราเตอร์|ar\d{3}|isr|rb\d{3})/.test(s)) return "router";
  if (/(poe injector|midspan|adapter|power module|fan|rack|patch)/.test(s)) return "accessory";
  if (/\bpoe\b/.test(s)) return "poe";
  return "switch";
}

const KIND_LABEL: Record<NetKind, string> = {
  switch: "สวิตช์เครือข่ายองค์กร (Enterprise Switch)",
  router: "เราเตอร์องค์กร (Enterprise Router)",
  firewall: "ไฟร์วอลล์ / อุปกรณ์ความปลอดภัยเครือข่าย",
  ap: "แอคเซสพอยต์ Wi-Fi ระดับองค์กร",
  controller: "ตัวควบคุมระบบไร้สาย (Wireless Controller)",
  transceiver: "โมดูลไฟเบอร์ (SFP/QSFP Transceiver)",
  poe: "อุปกรณ์จ่ายไฟผ่านสาย LAN (PoE)",
  accessory: "อุปกรณ์เสริมระบบเครือข่าย",
};

const WHAT: Record<NetKind, string> = {
  switch:
    "สวิตช์คือหัวใจของระบบ LAN ในองค์กร ทำหน้าที่เชื่อมคอมพิวเตอร์ เซิร์ฟเวอร์ กล้องวงจรปิด และ Access Point เข้าด้วยกัน รุ่นระดับองค์กรจะจัดการได้ (Managed) คือแบ่ง VLAN จำกัดแบนด์วิดท์ ทำ Link Aggregation และมอนิเตอร์ทราฟฟิกได้",
  router:
    "เราเตอร์องค์กรทำหน้าที่เชื่อมเครือข่ายภายในออกสู่อินเทอร์เน็ตหรือสาขาอื่น รองรับหลาย WAN, VPN ระหว่างสาขา, การจัดลำดับความสำคัญของทราฟฟิก (QoS) และเส้นทางสำรองเมื่อลิงก์หลักล่ม",
  firewall:
    "ไฟร์วอลล์ยุคใหม่ (NGFW) ตรวจสอบทราฟฟิกในระดับแอปพลิเคชัน ป้องกันมัลแวร์ กรองเว็บ ทำ VPN ให้พนักงานทำงานนอกออฟฟิศ และเก็บ Log ตาม พ.ร.บ.คอมพิวเตอร์",
  ap: "Access Point ระดับองค์กรกระจายสัญญาณ Wi-Fi ให้รองรับผู้ใช้จำนวนมากพร้อมกัน ส่งต่อสัญญาณระหว่างจุด (Roaming) ได้ต่อเนื่อง และบริหารจัดการรวมศูนย์ผ่านคอนโทรลเลอร์หรือคลาวด์",
  controller:
    "คอนโทรลเลอร์ทำหน้าที่บริหาร Access Point ทั้งหมดจากจุดเดียว กำหนดนโยบาย SSID, การยืนยันตัวตน, การจำกัดสิทธิ์ผู้ใช้ และดูสถานะสัญญาณทั้งอาคาร",
  transceiver:
    "โมดูล SFP/QSFP คือตัวแปลงสัญญาณสำหรับเชื่อมสวิตช์ด้วยสายไฟเบอร์ ใช้เมื่อระยะเกิน 100 เมตรหรือต้องการความเร็วสูงระหว่างตู้แร็ค/อาคาร",
  poe: "อุปกรณ์ PoE จ่ายไฟไปพร้อมกับข้อมูลบนสาย LAN เส้นเดียว ทำให้กล้อง IP, Access Point และโทรศัพท์ IP ไม่ต้องเดินปลั๊กไฟเพิ่ม",
  accessory:
    "อุปกรณ์เสริมที่ช่วยให้ระบบเครือข่ายติดตั้งได้เรียบร้อย ปลอดภัย และดูแลรักษาง่ายในระยะยาว",
};

const CAN_DO: Record<NetKind, string[]> = {
  switch: [
    "แบ่ง VLAN แยกวงงาน เช่น วงออฟฟิศ / วงกล้อง / วง Guest ออกจากกัน",
    "จ่ายไฟ PoE ให้กล้องและ Access Point (เฉพาะรุ่นที่รองรับ)",
    "ทำ Link Aggregation และ Spanning Tree เพื่อความเร็วและกันเครือข่ายล่ม",
    "มอนิเตอร์การใช้งานรายพอร์ตและจำกัดสิทธิ์อุปกรณ์แปลกปลอม",
  ],
  router: [
    "รวมอินเทอร์เน็ตหลายเส้นและสลับอัตโนมัติเมื่อเส้นหลักล่ม",
    "เชื่อมสาขาด้วย VPN แบบเข้ารหัส",
    "จัดลำดับความสำคัญทราฟฟิกงานสำคัญ เช่น ERP, VoIP",
  ],
  firewall: [
    "ป้องกันการโจมตีจากภายนอกและคัดกรองเว็บ/แอปที่ไม่เหมาะสม",
    "ทำ SSL VPN ให้พนักงานเข้าระบบภายในจากนอกออฟฟิศ",
    "เก็บ Log การใช้งานเพื่อรองรับการตรวจสอบตามกฎหมาย",
  ],
  ap: [
    "รองรับผู้ใช้พร้อมกันจำนวนมากในพื้นที่เดียว",
    "ทำ SSID แยกสำหรับพนักงานและผู้มาติดต่อ พร้อมระบบยืนยันตัวตน",
    "เดินสัญญาณต่อเนื่องระหว่างชั้น/อาคารโดยไม่หลุดสาย",
  ],
  controller: [
    "ตั้งค่าและอัปเดต Access Point ทุกตัวพร้อมกันจากหน้าจอเดียว",
    "ดูแผนผังสัญญาณ ตรวจจุดอับ และวิเคราะห์ปัญหาได้รวดเร็ว",
  ],
  transceiver: [
    "เชื่อมต่อระยะไกลระหว่างอาคารด้วยไฟเบอร์ได้ถึงหลายกิโลเมตร",
    "อัปลิงก์ความเร็วสูง 1G/10G/40G ระหว่างสวิตช์แกนหลัก",
  ],
  poe: [
    "ลดงานเดินไฟฟ้าที่จุดติดตั้งกล้องและ Access Point",
    "รีสตาร์ตอุปกรณ์ปลายทางจากระยะไกลได้ (รุ่น Managed)",
  ],
  accessory: ["ช่วยจัดระเบียบตู้แร็คและลดปัญหาสายหลวม/ความร้อนสะสม"],
};

const CHOOSING: Record<NetKind, string[]> = {
  switch: [
    "นับจำนวนพอร์ตที่ใช้จริงแล้วเผื่ออีก 20–30% สำหรับการขยายในอนาคต",
    "ถ้าต้องจ่ายไฟกล้อง/AP ให้ดู PoE Budget รวม (วัตต์) ไม่ใช่แค่ว่ามี PoE",
    "เลือก Managed หากต้องแบ่ง VLAN หรือมีกล้อง/ระบบสำคัญ — Unmanaged จะดูแลและแก้ปัญหาได้ยาก",
    "ตรวจความเร็วอัปลิงก์ (1G/10G SFP+) ให้พอกับทราฟฟิกรวมของสวิตช์ตัวนั้น",
  ],
  router: [
    "ดูจำนวน WAN และปริมาณผู้ใช้พร้อมกันที่รุ่นนั้นรองรับจริง",
    "ถ้ามีหลายสาขา ให้ตรวจว่ารองรับ VPN แบบและจำนวนอุโมงค์ที่ต้องใช้",
  ],
  firewall: [
    "ดู Throughput เมื่อเปิดฟีเจอร์ป้องกันครบ (ไม่ใช่ตัวเลข Firewall เปล่า)",
    "ฟีเจอร์ความปลอดภัยส่วนใหญ่ต้องต่ออายุ License รายปี ควรคิดงบส่วนนี้ด้วย",
  ],
  ap: [
    "จำนวน AP ควรคำนวณจากจำนวนผู้ใช้และผนัง ไม่ใช่ตารางเมตรอย่างเดียว",
    "ต้องมีสวิตช์ PoE รองรับมาตรฐานที่ AP ต้องการ (802.3af/at/bt)",
    "Wi-Fi 6/6E จะได้ประโยชน์เต็มเมื่ออุปกรณ์ผู้ใช้รองรับด้วย",
  ],
  controller: [
    "ตรวจจำนวน AP สูงสุดที่รองรับและรุ่นที่เข้ากันได้",
    "พิจารณาแบบคลาวด์เทียบกับฮาร์ดแวร์ตามนโยบายไอทีขององค์กร",
  ],
  transceiver: [
    "ต้องเลือกให้ตรงชนิดไฟเบอร์ (Single-mode/Multi-mode) ระยะ และความเร็ว",
    "บางแบรนด์ล็อกโมดูลเฉพาะยี่ห้อตัวเอง ควรยืนยันความเข้ากันได้ก่อนสั่ง",
  ],
  poe: ["ตรวจมาตรฐานและกำลังไฟต่อพอร์ตให้พอกับอุปกรณ์ปลายทาง"],
  accessory: ["ตรวจขนาดแร็ค ระยะยึด และความเข้ากันได้กับรุ่นอุปกรณ์หลัก"],
};

const LIMITS = [
  "อุปกรณ์ระดับองค์กรต้องตั้งค่าก่อนใช้งาน เสียบแล้วใช้ทันทีไม่ได้เหมือนอุปกรณ์ตามบ้าน",
  "การตั้งค่าผิด เช่น VLAN หรือ Spanning Tree อาจทำให้เครือข่ายทั้งระบบล่มได้",
  "ควรวางไว้ในตู้แร็คที่ระบายอากาศดีและมี UPS สำรองไฟ เพื่อยืดอายุการใช้งาน",
  "ฟีเจอร์ความปลอดภัยและซัพพอร์ตของบางแบรนด์ผูกกับ License/สัญญาบริการรายปี",
];

const WHY_ENT = [
  "มีทีมช่างและวิศวกรเครือข่ายของบริษัทเอง ออกหน้างานได้จริงทั้งกรุงเทพฯ และต่างจังหวัด",
  "บริการครบวงจร: สำรวจหน้างาน ออกแบบผัง เดินสาย ติดตั้ง ตั้งค่า ทดสอบ และส่งมอบเอกสารระบบ",
  "สินค้าของแท้จากตัวแทนจำหน่าย พร้อมรับประกันศูนย์และช่วยเคลมให้ตลอดอายุประกัน",
  "รองรับงานจัดซื้อองค์กร: ใบเสนอราคาทันที ใบกำกับภาษี VAT ครบ และวงเงินเครดิต B2B",
  "มีบริการดูแลต่อเนื่อง (MA) และช่วยแก้ปัญหาระยะไกลเมื่อระบบมีปัญหา",
];

export type NetExplain = {
  kind: NetKind;
  kindLabel: string;
  what: string;
  canDo: string[];
  choosing: string[];
};

export function explainNetwork(
  category?: string | null,
  brand?: string | null,
  name?: string | null,
  description?: string | null,
): NetExplain | null {
  if (!isEnterpriseNetwork(category, brand, name)) return null;
  const kind = kindOf(name, description);
  return {
    kind,
    kindLabel: KIND_LABEL[kind],
    what: WHAT[kind],
    canDo: CAN_DO[kind],
    choosing: CHOOSING[kind],
  };
}

/** Badge เล็กบนการ์ดสินค้า: "มีช่างติดตั้ง" */
export function NetworkProBadge({
  category,
  brand,
  name,
  className = "",
}: {
  category?: string | null;
  brand?: string | null;
  name?: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!isEnterpriseNetwork(category, brand, name)) return null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100 ${className}`}
      >
        <Wrench className="h-3 w-3" /> Enterprise · มีช่างติดตั้ง
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-emerald-700" /> เรามีทีมช่างติดตั้งระบบเครือข่าย
            </DialogTitle>
            <DialogDescription>
              สินค้ากลุ่มองค์กร (Huawei, Cisco, Aruba, Fortinet ฯลฯ) ต้องตั้งค่าก่อนใช้งาน — ENT Group
              มีทีมช่างและวิศวกรดูแลให้ตั้งแต่ออกแบบจนส่งมอบ
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc space-y-1.5 pl-4 text-[13px] leading-relaxed text-slate-600">
            {WHY_ENT.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
          <a
            href="tel:020456104"
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
          >
            โทรปรึกษาช่าง 02-045-6104
          </a>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** เวอร์ชันเต็มบนหน้ารายละเอียดสินค้า */
export function NetworkExplainer({
  category,
  brand,
  name,
  description,
  className = "",
}: {
  category?: string | null;
  brand?: string | null;
  name?: string | null;
  description?: string | null;
  className?: string;
}) {
  const x = explainNetwork(category, brand, name, description);
  if (!x) return null;

  return (
    <section
      className={`mt-6 rounded-lg border border-emerald-200 bg-white p-4 ${className}`}
      aria-label="ทำความรู้จักอุปกรณ์เครือข่ายรุ่นนี้"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white">
          <Network className="h-3.5 w-3.5" /> {x.kindLabel}
        </span>
        {brand && (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            <BadgeCheck className="h-3.5 w-3.5" /> {brand} Enterprise Grade
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
          <Wrench className="h-3.5 w-3.5" /> มีทีมช่างติดตั้ง/ตั้งค่าให้
        </span>
      </div>

      <div className="space-y-3 text-[13px] leading-relaxed text-slate-600">
        <div>
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <Info className="h-4 w-4 text-emerald-700" /> อุปกรณ์นี้คืออะไร
          </div>
          <p className="mt-1">{x.what}</p>
        </div>

        <div>
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <CircleCheck className="h-4 w-4 text-emerald-700" /> ใช้ทำอะไรได้ / ดีอย่างไร
          </div>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {x.canDo.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <Cog className="h-4 w-4 text-emerald-700" /> ข้อควรคำนึงในการเลือกใช้
          </div>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {x.choosing.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <TriangleAlert className="h-4 w-4 text-amber-600" /> ข้อจำกัดที่ควรรู้ก่อนใช้งาน
          </div>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {LIMITS.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg bg-emerald-50 p-3 ring-1 ring-emerald-200">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
            <Building2 className="h-4 w-4 text-emerald-700" /> ทำไมต้องใช้บริการ ENT Group
          </div>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-emerald-900/90">
            {WHY_ENT.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
