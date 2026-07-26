/**
 * Config ของ Mega Menu ต่อหมวดสินค้า — เพิ่มหมวดใหม่ให้แก้ที่ไฟล์นี้ที่เดียว
 * ตัวกรองที่ใช้ได้ต้องตรงกับ searchSchema ของหน้า "/" (q, brands, sub, min, max)
 */

export type MegaMenuFilter = {
  q?: string;
  brands?: string;
  sub?: string;
  min?: number;
  max?: number;
};

export type MegaMenuItem = {
  /** ชื่อไอคอนจาก lucide-react ที่ map ไว้ใน category-mega-menu.tsx */
  icon: string;
  title: string;
  sub: string;
  filter: MegaMenuFilter;
};

export type MegaMenuConfig = {
  /** ต้องตรงกับค่าใน CATEGORIES (synnex_products.category) */
  category: string;
  label: string;
  triggerIcon: string;
  panelTitle: string;
  /** กว้างของ panel (px) */
  width: number;
  items: MegaMenuItem[];
  /** คอลัมน์ขวา — แบรนด์แนะนำ */
  brands?: { label: string; brand: string }[];
  brandsTitle?: string;
  /** การ์ดโปรโมท/บริการช่าง ท้ายเมนู */
  promo?: { title: string; sub: string; to: string };
  ctaLabel: string;
};

export const MEGA_MENUS: MegaMenuConfig[] = [
  {
    category: "Network",
    label: "Network",
    triggerIcon: "Network",
    panelTitle: "อุปกรณ์เครือข่ายองค์กร",
    width: 720,
    ctaLabel: "ดูสินค้า Network ทั้งหมด →",
    brandsTitle: "แบรนด์ระดับองค์กร",
    items: [
      { icon: "Network", title: "Switch", sub: "สวิตช์ Managed / Unmanaged / PoE", filter: { q: "switch" } },
      { icon: "Router", title: "Router", sub: "เราเตอร์องค์กรและสาขา", filter: { q: "router" } },
      { icon: "ShieldCheck", title: "Firewall", sub: "ไฟร์วอลล์ / UTM ป้องกันเครือข่าย", filter: { q: "firewall" } },
      { icon: "Wifi", title: "Access Point", sub: "กระจาย Wi-Fi ครอบคลุมทั้งอาคาร", filter: { q: "access point" } },
      { icon: "Cable", title: "Media / Transceiver", sub: "ตัวแปลงสัญญาณ ไฟเบอร์ SFP", filter: { q: "sfp" } },
      { icon: "Server", title: "NAS / Server Network", sub: "อุปกรณ์เชื่อมต่อศูนย์ข้อมูล", filter: { q: "nas" } },
    ],
    brands: [
      { label: "Cisco", brand: "CISCO" },
      { label: "Huawei", brand: "HUAWEI" },
      { label: "Aruba", brand: "ARUBA" },
      { label: "Fortinet", brand: "FORTINET" },
      { label: "TP-Link", brand: "TPLINK" },
      { label: "Ubiquiti", brand: "UBIQUITI" },
    ],
    promo: {
      title: "มีทีมช่างติดตั้งระบบเครือข่าย",
      sub: "สำรวจหน้างาน เดินสาย ตั้งค่า พร้อมใบเสนอราคา",
      to: "/corporate",
    },
  },
  {
    category: "CCTV & Security",
    label: "CCTV & Security",
    triggerIcon: "Camera",
    panelTitle: "ระบบกล้องวงจรปิด",
    width: 700,
    ctaLabel: "ดูสินค้า CCTV ทั้งหมด →",
    brandsTitle: "แบรนด์ยอดนิยม",
    items: [
      { icon: "Camera", title: "กล้อง IP", sub: "กล้องเครือข่ายความละเอียดสูง", filter: { q: "ip camera" } },
      { icon: "Video", title: "กล้องอนาล็อก", sub: "HDCVI / HDTVI ต่อระบบเดิมได้", filter: { q: "hdcvi" } },
      { icon: "MonitorPlay", title: "NVR / DVR", sub: "เครื่องบันทึกภาพ", filter: { q: "nvr" } },
      { icon: "HardDrive", title: "Storage สำหรับกล้อง", sub: "ฮาร์ดดิสก์บันทึกต่อเนื่อง 24 ชม.", filter: { q: "surveillance" } },
      { icon: "Wifi", title: "กล้อง Wi-Fi ในบ้าน", sub: "ติดตั้งเองง่าย ดูผ่านมือถือ", filter: { q: "wifi camera" } },
      { icon: "Wrench", title: "ชุดติดตั้งพร้อมช่าง", sub: "ออกแบบจุดติดตั้ง เดินสาย ครบวงจร", filter: { q: "kit" } },
    ],
    brands: [
      { label: "Hikvision", brand: "HIKVISION" },
      { label: "Dahua", brand: "DAHUA" },
      { label: "EZVIZ", brand: "EZVIZ" },
      { label: "TP-Link VIGI", brand: "TPLINK" },
    ],
    promo: {
      title: "ต้องการช่างติดตั้งกล้อง?",
      sub: "ประเมินจำนวนกล้องและมุมมองให้ฟรี",
      to: "/corporate",
    },
  },
  {
    category: "Solar & Energy",
    label: "Solar & Energy",
    triggerIcon: "Sun",
    panelTitle: "ระบบพลังงานแสงอาทิตย์",
    width: 700,
    ctaLabel: "ดูสินค้า Solar ทั้งหมด →",
    items: [
      { icon: "Sun", title: "แผงโซลาร์เซลล์", sub: "แผงประสิทธิภาพสูง รับประกันยาว", filter: { q: "panel" } },
      { icon: "Zap", title: "อินเวอร์เตอร์", sub: "แปลงไฟ On-grid / Hybrid", filter: { q: "inverter" } },
      { icon: "BatteryCharging", title: "แบตเตอรี่สำรอง", sub: "เก็บพลังงานไว้ใช้ตอนกลางคืน", filter: { q: "battery" } },
      { icon: "Boxes", title: "ชุดระบบครบชุด", sub: "เลือกตามขนาดการใช้ไฟ", filter: { q: "kit" } },
      { icon: "Plug", title: "อุปกรณ์ประกอบระบบ", sub: "สายไฟ ตู้คอนโทรล อุปกรณ์ยึด", filter: { q: "mount" } },
      { icon: "Wrench", title: "สำรวจ & ติดตั้ง", sub: "ทีมช่างออกหน้างานทั่วประเทศ", filter: {} },
    ],
    promo: {
      title: "ไม่แน่ใจว่าต้องใช้ขนาดเท่าไร?",
      sub: "ส่งบิลค่าไฟให้เรา ประเมินระบบที่คุ้มที่สุดให้ฟรี",
      to: "/corporate",
    },
  },
  {
    category: "Printer",
    label: "Printer",
    triggerIcon: "Printer",
    panelTitle: "เครื่องพิมพ์ & สแกนเนอร์",
    width: 640,
    ctaLabel: "ดูเครื่องพิมพ์ทั้งหมด →",
    brandsTitle: "แบรนด์ยอดนิยม",
    items: [
      { icon: "Receipt", title: "เครื่องพิมพ์ใบเสร็จ", sub: "สำหรับร้านค้า POS สลิปความร้อน", filter: { sub: "Slip Printer" } },
      { icon: "Printer", title: "เลเซอร์", sub: "พิมพ์เอกสารเร็ว ต้นทุนต่ำ", filter: { sub: "Laser" } },
      { icon: "Droplets", title: "อิงค์เจ็ท / แท็งก์", sub: "พิมพ์สีสวย เติมหมึกเองได้", filter: { sub: "Inkjet / Ink Tank" } },
      { icon: "ScanLine", title: "สแกนเนอร์", sub: "สแกนเอกสารเข้าระบบดิจิทัล", filter: { sub: "Scanner" } },
      { icon: "Boxes", title: "เครื่องพิมพ์ 3 มิติ", sub: "งานต้นแบบและงานสร้างสรรค์", filter: { sub: "3D Printer" } },
    ],
    brands: [
      { label: "Epson", brand: "EPSON" },
      { label: "Canon", brand: "CANON" },
      { label: "HP", brand: "HP" },
      { label: "Brother", brand: "BROTHER" },
    ],
  },
];

export const MEGA_MENU_BY_CATEGORY: Record<string, MegaMenuConfig> = Object.fromEntries(
  MEGA_MENUS.map((m) => [m.category, m]),
);
