import { MemoryStick, Gamepad2, Briefcase, Video, Cpu, Monitor, Router, Server, Building2, BatteryCharging } from "lucide-react";

export type UsageProfile = {
  key: string;
  label: string;
  hint: string;
  cls: string;
  icon: "game" | "office" | "creator" | "workstation" | "basic" | "router" | "server" | "building" | "battery" | "ram";
};

const PROFILES: Record<string, UsageProfile> = {
  gaming_high: {
    key: "gaming_high",
    label: "เล่นเกมลื่นสุด",
    hint: "เกมออนไลน์/AAA ระดับสูง ปรับกราฟิกสูงได้สบาย",
    cls: "bg-violet-100 text-violet-700 ring-violet-200",
    icon: "game",
  },
  gaming_mid: {
    key: "gaming_mid",
    label: "เล่นเกมได้ดี",
    hint: "เกมออนไลน์ยอดนิยม เช่น Valorant / FIFA / GTA V",
    cls: "bg-indigo-100 text-indigo-700 ring-indigo-200",
    icon: "game",
  },
  creator: {
    key: "creator",
    label: "ตัดต่อ/กราฟิก",
    hint: "ตัดต่อวิดีโอ 4K, Photoshop, งานกราฟิก 3D เบา ๆ",
    cls: "bg-amber-100 text-amber-700 ring-amber-200",
    icon: "creator",
  },
  workstation: {
    key: "workstation",
    label: "งานหนัก/มืออาชีพ",
    hint: "เรนเดอร์ 3D, AI, งานคำนวณหนักต่อเนื่อง",
    cls: "bg-rose-100 text-rose-700 ring-rose-200",
    icon: "workstation",
  },
  office_plus: {
    key: "office_plus",
    label: "ทำงานออฟฟิศลื่น",
    hint: "Office, Excel ไฟล์ใหญ่, เปิดหลายแท็บพร้อมกัน, ประชุมออนไลน์",
    cls: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    icon: "office",
  },
  basic: {
    key: "basic",
    label: "ใช้งานทั่วไป",
    hint: "เอกสาร, อินเทอร์เน็ต, ดูวิดีโอ, งานขาย/แคชเชียร์",
    cls: "bg-sky-100 text-sky-700 ring-sky-200",
    icon: "basic",
  },
};

const UPS_PROFILES: Record<string, UsageProfile> = {
  ups_small: {
    key: "ups_small",
    label: "เหมาะกับเราเตอร์/กล้องวงจรปิด",
    hint: "สำรองไฟอุปกรณ์เล็ก เช่น Router, กล้อง CCTV, NVR — ใช้งานต่อได้ราว 15-30 นาที",
    cls: "bg-sky-100 text-sky-700 ring-sky-200",
    icon: "router",
  },
  ups_pc: {
    key: "ups_pc",
    label: "เหมาะกับคอมพิวเตอร์ 1 เครื่อง",
    hint: "คอมออฟฟิศ + จอ 1 ชุด — มีเวลาเซฟงานและปิดเครื่องอย่างปลอดภัย ราว 10-15 นาที",
    cls: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    icon: "battery",
  },
  ups_pc_gaming: {
    key: "ups_pc_gaming",
    label: "เหมาะกับคอมเล่นเกม/เครื่องแรง",
    hint: "คอมสเปกสูงมีการ์ดจอแยก หรือคอม + จอ 2 ตัว — สำรองไฟราว 10-15 นาที",
    cls: "bg-indigo-100 text-indigo-700 ring-indigo-200",
    icon: "battery",
  },
  ups_office: {
    key: "ups_office",
    label: "เหมาะกับหลายเครื่อง/จุดขาย",
    hint: "คอมหลายเครื่อง, เครื่อง POS, เครื่องพิมพ์ใบเสร็จ หรือชุดอุปกรณ์เครือข่ายในออฟฟิศ",
    cls: "bg-amber-100 text-amber-700 ring-amber-200",
    icon: "building",
  },
  ups_server: {
    key: "ups_server",
    label: "เหมาะกับเซิร์ฟเวอร์/ห้อง IT",
    hint: "เซิร์ฟเวอร์, ตู้ Rack, ระบบที่ต้องเปิด 24 ชม. — ไฟนิ่งสม่ำเสมอ ป้องกันไฟตกไฟกระชาก",
    cls: "bg-rose-100 text-rose-700 ring-rose-200",
    icon: "server",
  },
};

const RAM_PROFILES: Record<string, UsageProfile> = {
  ram_basic: {
    key: "ram_basic",
    label: "พอสำหรับงานเอกสาร",
    hint: "4-8GB — เอกสาร, เว็บ, ดูวิดีโอ หรือใช้อัปเกรดเครื่องเก่าให้ลื่นขึ้น",
    cls: "bg-sky-100 text-sky-700 ring-sky-200",
    icon: "ram",
  },
  ram_office: {
    key: "ram_office",
    label: "ทำงานออฟฟิศลื่น",
    hint: "16GB — Excel ไฟล์ใหญ่, เปิดหลายแท็บ, ประชุมออนไลน์ และเล่นเกมทั่วไปได้",
    cls: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    icon: "ram",
  },
  ram_gaming: {
    key: "ram_gaming",
    label: "เล่นเกม/ตัดต่อ",
    hint: "32GB — เกมสเปกสูง, ตัดต่อวิดีโอ, งานกราฟิก และเปิดหลายโปรแกรมพร้อมกัน",
    cls: "bg-indigo-100 text-indigo-700 ring-indigo-200",
    icon: "ram",
  },
  ram_pro: {
    key: "ram_pro",
    label: "งานหนัก/มืออาชีพ",
    hint: "64GB ขึ้นไป — เรนเดอร์ 3D, งาน AI, Virtual Machine, เซิร์ฟเวอร์",
    cls: "bg-rose-100 text-rose-700 ring-rose-200",
    icon: "ram",
  },
};

const CAM_PROFILES: Record<string, UsageProfile> = {
  cam_personal: {
    key: "cam_personal",
    label: "ประชุมส่วนตัว/โต๊ะทำงาน",
    hint: "เว็บแคมติดหน้าจอ สำหรับใช้คนเดียว — Zoom / Teams / Google Meet, เรียนออนไลน์, ไลฟ์",
    cls: "bg-sky-100 text-sky-700 ring-sky-200",
    icon: "creator",
  },
  cam_huddle: {
    key: "cam_huddle",
    label: "ห้องประชุมเล็ก 2-6 คน",
    hint: "กล้อง+ไมค์+ลำโพงในตัว ตั้งบนโต๊ะ เก็บเสียงรอบทิศ เหมาะกับห้อง Huddle Room",
    cls: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    icon: "office",
  },
  cam_medium: {
    key: "cam_medium",
    label: "ห้องประชุมกลาง 6-12 คน",
    hint: "มุมกว้าง ซูมได้ พร้อมไมค์แยก/รีโมท เหมาะกับห้องประชุมมาตรฐานขององค์กร",
    cls: "bg-indigo-100 text-indigo-700 ring-indigo-200",
    icon: "building",
  },
  cam_large: {
    key: "cam_large",
    label: "ห้องประชุมใหญ่/ห้องอบรม",
    hint: "กล้อง PTZ หรือชุด Room System ซูมไกล หมุน-ก้ม-เงยได้ รองรับผู้เข้าประชุมจำนวนมาก",
    cls: "bg-rose-100 text-rose-700 ring-rose-200",
    icon: "server",
  },
};

function getCamProfile(t: string): UsageProfile {
  if (/ptz|rally|room\s*system|group\b|sm210|panacast\s*50/.test(t)) return CAM_PROFILES.cam_large;
  if (/meetup|panacast|conference|bcc950|\bcam\b.*(บาร์|bar)/.test(t)) {
    if (/meetup|bcc950|panacast\s*40/.test(t)) return CAM_PROFILES.cam_huddle;
    return CAM_PROFILES.cam_medium;
  }
  return CAM_PROFILES.cam_personal;
}

function getRamProfile(t: string): UsageProfile | null {
  const m = t.match(/(\d{1,3})\s*gb/);
  const gb = m ? Number(m[1]) : 0;
  if (!gb) return null;
  if (gb >= 64) return RAM_PROFILES.ram_pro;
  if (gb >= 32) return RAM_PROFILES.ram_gaming;
  if (gb >= 16) return RAM_PROFILES.ram_office;
  return RAM_PROFILES.ram_basic;
}


const ICON = {
  game: Gamepad2,
  office: Briefcase,
  creator: Video,
  workstation: Cpu,
  basic: Monitor,
  router: Router,
  server: Server,
  building: Building2,
  battery: BatteryCharging,
  ram: MemoryStick,
};

function getUpsProfile(t: string): UsageProfile {
  const va = Number(
    (t.match(/(\d{3,5})\s*va/) ?? t.match(/(\d(?:\.\d)?)\s*kva/))?.[1]?.replace(/^(\d(?:\.\d)?)$/, (m) =>
      String(Number(m) * 1000),
    ) ?? 0,
  );
  const online = /online|true\s*online|double\s*conversion/.test(t);
  if (online || va >= 3000) return UPS_PROFILES.ups_server;
  if (va >= 1500) return UPS_PROFILES.ups_office;
  if (va >= 1000) return UPS_PROFILES.ups_pc_gaming;
  if (va > 0 && va < 800) return UPS_PROFILES.ups_small;
  return UPS_PROFILES.ups_pc;
}

/** Guess what the machine is good for, from its spec text / name / price. */
export function getUsageProfile(input: {
  category?: string | null;
  name?: string | null;
  description?: string | null;
  price?: number | null;
}): UsageProfile | null {
  const c = (input.category ?? "").toLowerCase();
  if (c === "ram" || c.includes("ram ")) {
    return getRamProfile(`${input.name ?? ""} ${input.description ?? ""}`.toLowerCase());
  }
  if (c.includes("ups") || /\bups\b/.test((input.name ?? "").toLowerCase())) {
    return getUpsProfile(`${input.name ?? ""} ${input.description ?? ""}`.toLowerCase());
  }
  if (!(c.includes("computer set") || c.includes("คอมประกอบ") || c === "pc")) return null;


  const t = `${input.name ?? ""} ${input.description ?? ""}`.toLowerCase();
  const price = input.price ?? 0;

  // discrete GPU tier
  const rtx = t.match(/rtx\s*(\d{4})/);
  const gtx = /gtx\s*\d{3,4}/.test(t);
  const rx = /\brx\s*\d{3,4}/.test(t);
  const rtxNum = rtx ? Number(rtx[1]) : 0;

  const workstation =
    /threadripper|xeon|ryzen\s*9|core\s*i9|quadro|rtx\s*a\d|\ba\d{4}\b.*ada|workstation/.test(t);
  const highGpu = rtxNum >= 4060 || /rtx\s*30[678]0|rtx\s*40[6789]0|rtx\s*50[6789]0/.test(t);

  const ramMatch = t.match(/(\d{1,3})\s*gb.*(ddr|ram)/) ?? t.match(/(ddr\d)\s*(\d{1,3})\s*gb/);
  const ram = ramMatch ? Number(ramMatch[1] ?? ramMatch[2]) : 0;

  if (workstation && (highGpu || price >= 60000)) return PROFILES.workstation;
  if (highGpu) return PROFILES.gaming_high;
  if (rtxNum > 0 || gtx || rx) return PROFILES.gaming_mid;
  if (/ryzen\s*7|core\s*i7|core\s*ultra\s*7|radeon\s*graphics.*ryzen\s*7/.test(t) || ram >= 32)
    return PROFILES.creator;
  if (/ryzen\s*5|core\s*i5|core\s*ultra\s*5/.test(t) || ram >= 16 || price >= 15000)
    return PROFILES.office_plus;
  return PROFILES.basic;
}

/** Small badge for product cards. */
export function UsageBadge(props: {
  category?: string | null;
  name?: string | null;
  description?: string | null;
  price?: number | null;
  className?: string;
}) {
  const p = getUsageProfile(props);
  if (!p) return null;
  const Icon = ICON[p.icon];
  return (
    <span
      title={p.hint}
      className={`mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${p.cls} ${props.className ?? ""}`}
    >
      <Icon className="h-3 w-3" />
      {p.label}
    </span>
  );
}

/** Fuller explainer for the product detail page. */
export function UsageInfoBox(props: {
  category?: string | null;
  name?: string | null;
  description?: string | null;
  price?: number | null;
}) {
  const p = getUsageProfile(props);
  if (!p) return null;
  const Icon = ICON[p.icon];
  return (
    <div className="mt-4 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-[13px]">
      <div className="mb-1 flex items-center gap-2 font-semibold text-slate-900">
        <Icon className="h-4 w-4" />
        เครื่องนี้เหมาะกับ: {p.label}
      </div>
      <div className="pl-6 text-slate-600">{p.hint}</div>
    </div>
  );
}
