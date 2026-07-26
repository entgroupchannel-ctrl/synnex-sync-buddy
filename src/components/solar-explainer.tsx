/**
 * SolarExplainer / SolarBrief — คำอธิบายสินค้าหมวด Solar & Energy
 * "อุปกรณ์ตัวนี้คืออะไร ทำงานยังไง ใช้กับบ้าน/โรงงานแบบไหน ต้องใช้ร่วมกับอะไร สิ่งที่ต้องคำนึงในการเลือก ข้อจำกัด"
 */
import { useState } from "react";
import {
  Sun,
  Info,
  Puzzle,
  CircleCheck,
  TriangleAlert,
  Sparkles,
  Phone,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LineQrDialog } from "@/components/line-qr-dialog";

export const SOLAR_CATEGORIES = ["solar", "energy", "พลังงาน"];

export type SolarKind =
  | "hybrid-inverter"
  | "grid-inverter"
  | "battery"
  | "panel"
  | "cable"
  | "accessory";

export type SolarSpec = {
  kw: number | null;
  kwh: number | null;
  phase: 1 | 3 | null;
  watt: number | null;
  hybrid: boolean;
  model: string | null;
};

export type SolarExplain = {
  kind: SolarKind;
  kindLabel: string;
  useLabel: string;
  brief: string;
  what: string;
  howItWorks: string[];
  canDo: string[];
  pairWith: string[];
  choosing: string[];
  limits: string[];
  spec: SolarSpec;
};

export function parseSolarSpec(name?: string | null, description?: string | null): SolarSpec {
  const s = `${name ?? ""} ${description ?? ""}`;
  const l = s.toLowerCase();

  // kW (inverter) — SUN2000-5KTL / 15kW / 50K-M3
  let kw: number | null = null;
  const kwM = l.match(/(\d{1,3}(?:\.\d)?)\s*kw/) ?? l.match(/sun-?2000-(\d{1,3})k/);
  if (kwM) kw = Number(kwM[1]);

  // kWh (battery) — LUNA2000-7-E1 = 7 kWh
  let kwh: number | null = null;
  const kwhM = l.match(/(\d{1,3}(?:\.\d)?)\s*kwh/) ?? l.match(/luna2000-(\d{1,2})/);
  if (kwhM) kwh = Number(kwhM[1]);

  const phase: 1 | 3 | null = /3\s*phase|three\s*phase|3เฟส|สามเฟส/.test(l)
    ? 3
    : /1\s*phase|single\s*phase|1เฟส|เฟสเดียว/.test(l)
      ? 1
      : null;

  const wM = l.match(/(\d{2,4})\s*w(?!h)/);
  const watt = wM ? Number(wM[1]) : null;

  const hybrid = /hybrid|ไฮบริด/.test(l);
  const modelM = s.match(/(SUN-?2000[-\w.]*|LUNA2000[-\w.]*|SP\d{3,4}|A\d{3})/i);

  return { kw, kwh, phase, watt, hybrid, model: modelM ? modelM[1] : null };
}

function kindOf(name?: string | null, description?: string | null, spec?: SolarSpec): SolarKind {
  const s = `${name ?? ""} ${description ?? ""}`.toLowerCase();
  if (/(battery|แบตเตอรี่|luna2000|เก็บพลังงาน|ess)/.test(s)) return "battery";
  if (/(inverter|อินเวอร์เตอร์|sun2000|sun-2000)/.test(s)) {
    return spec?.hybrid || /hybrid/.test(s) ? "hybrid-inverter" : "grid-inverter";
  }
  if (/(panel|แผง|โซล่าเซลล์|โซลาร์เซลล์|pv module)/.test(s)) return "panel";
  if (/(cable|สาย|mc4|connector)/.test(s)) return "cable";
  return "accessory";
}

function useLabelOf(kind: SolarKind, s: SolarSpec): string {
  if (kind === "hybrid-inverter") {
    if (s.kw && s.kw <= 5) return "บ้านพักอาศัย / ทาวน์โฮม";
    if (s.kw && s.kw <= 15) return "บ้านหลังใหญ่ / ร้านค้า–สำนักงาน";
    if (s.kw) return "โรงงาน–อาคารพาณิชย์";
    return "บ้านที่ต้องการสำรองไฟ";
  }
  if (kind === "grid-inverter") return "ลดค่าไฟกลางวัน (ไม่สำรองไฟ)";
  if (kind === "battery") return s.kwh ? `สำรองไฟ ~${s.kwh} kWh` : "เก็บไฟใช้ตอนกลางคืน";
  if (kind === "panel") return s.watt ? `ผลิตไฟ ${s.watt}W` : "ผลิตไฟจากแสงอาทิตย์";
  if (kind === "cable") return "เดินสาย DC ฝั่งแผงโซลาร์";
  return "อุปกรณ์ประกอบระบบโซลาร์";
}

export function explainSolar(
  category?: string | null,
  name?: string | null,
  description?: string | null,
): SolarExplain | null {
  const c = (category ?? "").toLowerCase();
  if (!SOLAR_CATEGORIES.some((k) => c.includes(k))) return null;

  const spec = parseSolarSpec(name, description);
  const kind = kindOf(name, description, spec);
  const kwTxt = spec.kw ? `${spec.kw}kW` : "";
  const phaseTxt = spec.phase ? `${spec.phase} เฟส` : "";

  const kindLabel: Record<SolarKind, string> = {
    "hybrid-inverter": `อินเวอร์เตอร์ไฮบริด${kwTxt ? ` ${kwTxt}` : ""}${phaseTxt ? ` ${phaseTxt}` : ""}`,
    "grid-inverter": `อินเวอร์เตอร์ออนกริด${kwTxt ? ` ${kwTxt}` : ""}${phaseTxt ? ` ${phaseTxt}` : ""}`,
    battery: `แบตเตอรี่เก็บพลังงาน${spec.kwh ? ` ${spec.kwh} kWh` : ""}`,
    panel: `แผงโซลาร์เซลล์${spec.watt ? ` ${spec.watt}W` : ""}`,
    cable: "สายไฟ DC สำหรับระบบโซลาร์ (PV Cable)",
    accessory: "อุปกรณ์ประกอบระบบโซลาร์เซลล์",
  };

  const brief: Record<SolarKind, string> = {
    "hybrid-inverter": `หัวใจของระบบโซลาร์แบบมีแบตเตอรี่ — แปลงไฟ DC จากแผงเป็นไฟบ้าน 220V ใช้เอง เก็บส่วนเกินลงแบตเตอรี่ และจ่ายไฟต่อได้เมื่อไฟดับ${kwTxt ? ` รองรับโหลดระดับ ${kwTxt}` : ""}`,
    "grid-inverter": `แปลงไฟจากแผงโซลาร์เป็นไฟบ้านใช้ทันทีตอนกลางวัน เพื่อลดค่าไฟ${kwTxt ? ` ขนาด ${kwTxt}` : ""} — เหมาะกับบ้าน/อาคารที่ใช้ไฟกลางวันเยอะ`,
    battery: `แบตเตอรี่ลิเธียมสำหรับเก็บไฟส่วนเกินจากแผงตอนกลางวัน${spec.kwh ? ` ความจุ ${spec.kwh} kWh` : ""} เอาไว้ใช้ตอนเย็น–กลางคืน หรือสำรองไฟตอนไฟดับ`,
    panel: `แผงรับแสงอาทิตย์แล้วผลิตไฟ DC${spec.watt ? ` กำลัง ${spec.watt} วัตต์` : ""} เป็นต้นทางของพลังงานทั้งระบบ`,
    cable: `สายไฟทนแดด–ทนความร้อนสำหรับฝั่ง DC ระหว่างแผงกับอินเวอร์เตอร์ ใช้สายทั่วไปแทนไม่ได้`,
    accessory: `อุปกรณ์เสริมที่ทำให้ระบบโซลาร์ติดตั้งได้เรียบร้อย ปลอดภัย และใช้งานได้เต็มประสิทธิภาพ`,
  };

  const what: Record<SolarKind, string> = {
    "hybrid-inverter": `อินเวอร์เตอร์ไฮบริดคือเครื่องแปลงไฟที่รวม 3 หน้าที่ไว้ในตัวเดียว — แปลงไฟ DC จากแผงโซลาร์เป็นไฟ AC 220V ใช้ในบ้าน, บริหารการชาร์จ/คายประจุแบตเตอรี่ และสลับมาจ่ายไฟจากแบตเตอรี่เมื่อไฟหลวงดับ (Backup) ต่างจากออนกริดตรงที่ "ต่อแบตเตอรี่ได้" จึงใช้ไฟที่ผลิตเองตอนกลางคืนได้ด้วย`,
    "grid-inverter": `อินเวอร์เตอร์ออนกริด (Grid-tied) แปลงไฟ DC จากแผงเป็นไฟ AC แล้วป้อนเข้าระบบไฟบ้านขนานกับไฟการไฟฟ้า ไฟที่ผลิตได้จะถูกใช้ก่อน ส่วนที่ขาดค่อยดึงจากการไฟฟ้า จุดสำคัญคือเมื่อไฟดับ ระบบจะตัดการทำงานทันทีตามมาตรฐานความปลอดภัย จึงไม่มีไฟสำรอง`,
    battery: `แบตเตอรี่เก็บพลังงาน (ESS) มักเป็นลิเธียม LFP ที่ปลอดภัยและอายุยาว ทำหน้าที่เก็บไฟส่วนเกินตอนกลางวัน แล้วปล่อยออกมาใช้ช่วงหัวค่ำที่ค่าไฟแพงหรือช่วงไฟดับ ต่อพ่วงเพิ่มความจุเป็นชั้น ๆ ได้ตามการใช้งานจริง`,
    panel: `แผงโซลาร์เซลล์แปลงพลังงานแสงเป็นไฟฟ้ากระแสตรง (DC) กำลังผลิตขึ้นกับขนาดวัตต์ ความเข้มแสง ทิศทาง–องศาการติดตั้ง และอุณหภูมิ โดยทั่วไปแผง 1 kW ในไทยผลิตได้ราว 4–4.5 หน่วย (kWh) ต่อวัน`,
    cable: `สาย PV (Photovoltaic Cable) เป็นสายไฟฝั่ง DC ที่ออกแบบให้ทน UV ทนความร้อน และมีฉนวนสองชั้น ใช้เดินจากแผงลงมายังอินเวอร์เตอร์ พร้อมหัวต่อมาตรฐาน MC4`,
    accessory: `อุปกรณ์ประกอบ เช่น โครงยึด เบรกเกอร์ DC กันฟ้าผ่า หรือระบบมอนิเตอร์ ที่ช่วยให้ระบบทำงานปลอดภัยและตรวจสอบผลผลิตไฟได้`,
  };

  const howItWorks: string[] = [];
  if (kind === "hybrid-inverter" || kind === "grid-inverter") {
    howItWorks.push("แผงโซลาร์ผลิตไฟ DC → อินเวอร์เตอร์แปลงเป็น AC 220V → จ่ายเข้าตู้ไฟบ้านเพื่อใช้กับเครื่องใช้ไฟฟ้าทันที");
    howItWorks.push("ไฟที่ผลิตได้จะถูกใช้ก่อนเสมอ ส่วนที่ไม่พอจึงดึงจากการไฟฟ้าโดยอัตโนมัติ ผู้ใช้ไม่ต้องสลับอะไรเอง");
    if (kind === "hybrid-inverter") {
      howItWorks.push("ไฟเหลือใช้จะถูกชาร์จเก็บลงแบตเตอรี่ แล้วดึงกลับมาใช้ช่วงเย็น–กลางคืน");
      howItWorks.push("เมื่อไฟดับ ระบบสลับมาจ่ายไฟจากแบตเตอรี่ให้วงจรสำรอง (Backup Box) ภายในเสี้ยววินาที");
    } else {
      howItWorks.push("เมื่อไฟการไฟฟ้าดับ อินเวอร์เตอร์ออนกริดจะหยุดจ่ายไฟทันที (Anti-islanding) เพื่อความปลอดภัยของช่างที่ซ่อมสายไฟ");
    }
    howItWorks.push("ดูผลผลิตไฟ การใช้ไฟ และสถานะระบบย้อนหลังผ่านแอปบนมือถือได้ตลอดเวลา");
  }
  if (kind === "battery") {
    howItWorks.push("ชาร์จไฟส่วนเกินจากแผงในช่วงกลางวันที่ผลิตได้มากกว่าที่ใช้");
    howItWorks.push("คายประจุช่วงหัวค่ำ–กลางคืน ทำให้ลดการซื้อไฟจากการไฟฟ้าได้อีกช่วงหนึ่ง");
    howItWorks.push("เมื่อไฟดับ จ่ายไฟให้วงจรสำรองที่กำหนดไว้ เช่น ตู้เย็น ไฟแสงสว่าง Wi-Fi กล้องวงจรปิด");
    howItWorks.push("ระบบ BMS ในตัวคอยคุมอุณหภูมิ แรงดัน และสมดุลเซลล์เพื่อความปลอดภัยและอายุการใช้งาน");
  }
  if (kind === "panel") {
    howItWorks.push("รับแสงอาทิตย์แล้วผลิตไฟ DC ส่งลงมาที่อินเวอร์เตอร์ผ่านสาย PV");
    howItWorks.push("ผลผลิตสูงสุดช่วง 10:00–15:00 น. และลดลงเมื่อมีเมฆ เงาบัง หรือฝุ่นเกาะหน้าแผง");
    howItWorks.push("ในไทยหันแผงไปทางทิศใต้ องศาเอียงประมาณ 10–15 องศา จะได้ผลผลิตเฉลี่ยดีที่สุด");
  }
  if (kind === "cable" || kind === "accessory") {
    howItWorks.push("เชื่อมต่อกับอุปกรณ์หลักของระบบให้ครบวงจรและปลอดภัยตามมาตรฐานงานไฟฟ้า");
    howItWorks.push("ต้องเลือกขนาด/พิกัดให้สอดคล้องกับกระแสและแรงดันของสตริงแผงที่ใช้จริง");
  }

  const canDo: string[] = [];
  if (kind === "hybrid-inverter") {
    canDo.push("ลดค่าไฟกลางวันได้ทันที และใช้ไฟที่เก็บไว้ต่อในช่วงกลางคืน");
    canDo.push("มีไฟใช้ต่อเมื่อไฟดับ เหมาะกับบ้านที่มีผู้สูงอายุ ร้านค้า ห้องเซิร์ฟเวอร์ หรือกล้องวงจรปิด");
    if (spec.kw) canDo.push(`รองรับการติดตั้งแผงรวมประมาณ ${Math.round(spec.kw * 1.2)}–${Math.round(spec.kw * 1.5)} kWp (ติดแผงเกินกำลังอินเวอร์เตอร์ได้เล็กน้อยเพื่อเก็บผลผลิตช่วงเช้า–เย็น)`);
    if (spec.phase === 3) canDo.push("เหมาะกับอาคาร/โรงงานที่ใช้ไฟ 3 เฟส มีมอเตอร์ แอร์ขนาดใหญ่ หรือเครื่องจักร");
  }
  if (kind === "grid-inverter") {
    canDo.push("ลดค่าไฟช่วงกลางวันได้สูงสุด คืนทุนเร็วกว่าระบบที่มีแบตเตอรี่");
    canDo.push("เหมาะกับสำนักงาน โรงงาน ร้านค้า ที่ใช้ไฟหนักในเวลาทำการ");
    if (spec.kw) canDo.push(`ประมาณการผลิตไฟ ~${Math.round(spec.kw * 4)}–${Math.round(spec.kw * 4.5)} หน่วยต่อวัน เมื่อติดแผงเต็มพิกัดและแดดปกติ`);
  }
  if (kind === "battery") {
    if (spec.kwh) {
      canDo.push(`สำรองไฟให้โหลดจำเป็น (ตู้เย็น + ไฟ + Wi-Fi ~500W) ได้ราว ${Math.max(1, Math.round((spec.kwh * 0.9) / 0.5))} ชั่วโมง`);
      canDo.push(`หรือใช้กับแอร์ 1 เครื่อง (~1,200W) ได้ประมาณ ${Math.max(1, Math.round((spec.kwh * 0.9) / 1.2))} ชั่วโมง`);
    }
    canDo.push("ย้ายการใช้ไฟจากช่วงกลางวันมาช่วงค่ำ (Time shift) ลดค่าไฟช่วง Peak");
    canDo.push("ขยายความจุเพิ่มภายหลังได้ด้วยการต่อโมดูลเพิ่ม");
  }
  if (kind === "panel") {
    if (spec.watt) canDo.push(`ผลิตไฟได้ราว ${(spec.watt * 4) / 1000 < 1 ? ((spec.watt * 4) / 1000).toFixed(2) : Math.round((spec.watt * 4) / 1000)} หน่วยต่อวันต่อแผง (แดดปกติ)`);
    canDo.push("ใช้เป็นต้นทางพลังงานของระบบโซลาร์บ้าน อาคาร หรือใช้กับอุปกรณ์เฉพาะ เช่น กล้องวงจรปิดพลังงานแสงอาทิตย์");
  }
  if (kind === "cable") {
    canDo.push("เดินสายจากแผงบนหลังคาลงมายังอินเวอร์เตอร์ได้อย่างปลอดภัย ทนแดดทนฝนระยะยาว");
    canDo.push("ใช้ทำสายต่อพ่วงระหว่างแผงในสตริงเดียวกัน");
  }
  if (kind === "accessory") canDo.push("เสริมความปลอดภัยและความเรียบร้อยของงานติดตั้ง");

  const pairWith: string[] = [];
  if (kind === "hybrid-inverter") {
    pairWith.push("แผงโซลาร์เซลล์ให้ได้กำลังรวมใกล้เคียงพิกัดอินเวอร์เตอร์");
    pairWith.push("แบตเตอรี่ (เช่น HUAWEI LUNA2000) หากต้องการใช้ไฟกลางคืน/สำรองไฟ");
    pairWith.push("Smart Meter / Backup Box สำหรับควบคุมการจ่ายไฟย้อนกลับและวงจรสำรอง");
    pairWith.push("โครงยึดแผง สาย PV เบรกเกอร์ DC/AC และระบบกราวด์–กันฟ้าผ่า");
  }
  if (kind === "grid-inverter") {
    pairWith.push("แผงโซลาร์เซลล์ + โครงยึด + สาย PV และเบรกเกอร์ DC/AC");
    pairWith.push("Smart Meter เพื่อจำกัดการจ่ายไฟย้อนเข้าสายการไฟฟ้า (Zero export) ตามข้อกำหนด");
    pairWith.push("หากต้องการสำรองไฟ ต้องเปลี่ยนไปใช้รุ่นไฮบริดหรือเพิ่มระบบแยกต่างหาก");
  }
  if (kind === "battery") {
    pairWith.push("อินเวอร์เตอร์ไฮบริดรุ่นที่รองรับ (ยี่ห้อ/ซีรีส์เดียวกัน) — ต่อกับออนกริดทั่วไปไม่ได้");
    pairWith.push("Backup Box สำหรับตัดแยกวงจรสำรองเมื่อไฟดับ");
    pairWith.push("จุดติดตั้งที่ระบายอากาศดี ไม่โดนแดดตรง และรับน้ำหนักได้");
  }
  if (kind === "panel") {
    pairWith.push("อินเวอร์เตอร์ที่มีช่วงแรงดัน MPPT รองรับจำนวนแผงต่อสตริง");
    pairWith.push("โครงยึด (Rail/Clamp) ที่เหมาะกับชนิดหลังคา และสาย PV + หัว MC4");
  }
  if (kind === "cable" || kind === "accessory") {
    pairWith.push("แผงโซลาร์ อินเวอร์เตอร์ และอุปกรณ์ป้องกันฝั่ง DC ให้พิกัดสอดคล้องกัน");
  }

  const choosing: string[] = [];
  if (kind === "hybrid-inverter" || kind === "grid-inverter") {
    choosing.push("ดูบิลค่าไฟย้อนหลังก่อน — ค่าไฟ 3,000–5,000 บาท/เดือน มักเหมาะกับระบบ 3–5kW, 8,000–12,000 บาท เหมาะกับ 10–15kW");
    choosing.push("บ้านทั่วไปใช้ไฟ 1 เฟส ส่วนอาคาร/โรงงานใช้ 3 เฟส ต้องเลือกให้ตรงกับระบบไฟที่มีอยู่");
    choosing.push("พื้นที่หลังคาว่างต้องพอ — ทุก 1kW ใช้พื้นที่ราว 5–6 ตร.ม. และควรไม่มีเงาบังช่วงกลางวัน");
    choosing.push("ตรวจสอบจำนวน MPPT และแรงดันเข้าสูงสุด ถ้าหลังคาหลายทิศควรเลือกรุ่นที่มี MPPT หลายชุด");
    choosing.push("ถ้าต้องการสำรองไฟตอนไฟดับ ต้องเลือก 'ไฮบริด' เท่านั้น ออนกริดจะดับตามการไฟฟ้า");
  }
  if (kind === "battery") {
    choosing.push("คำนวณจากพลังงานที่ใช้ช่วงค่ำ–กลางคืนจริง (หน่วย kWh) ไม่ใช่จากขนาดอินเวอร์เตอร์");
    choosing.push("ดูกำลังจ่ายสูงสุด (kW) ด้วย — ถ้าจะสตาร์ทแอร์หรือปั๊มน้ำ ต้องมีกำลังเผื่อกระแสตอนสตาร์ท");
    choosing.push("เลือกเคมี LFP ที่ปลอดภัย และดูรอบการชาร์จ (Cycle) กับเงื่อนไขรับประกันเป็นปี/รอบ");
    choosing.push("ต้องเข้ากันได้กับอินเวอร์เตอร์เดิม ตรวจสอบรุ่นที่รองรับก่อนสั่งซื้อทุกครั้ง");
  }
  if (kind === "panel") {
    choosing.push("ดูวัตต์ต่อแผงและประสิทธิภาพ (%) — พื้นที่หลังคาน้อยควรเลือกแผงวัตต์สูง");
    choosing.push("ตรวจสอบแรงดัน Voc/Vmp เพื่อคำนวณจำนวนแผงต่อสตริงให้อยู่ในช่วงที่อินเวอร์เตอร์รับได้");
    choosing.push("ดูการรับประกันตัวแผง (มักราว 10–12 ปี) และรับประกันกำลังผลิต (25 ปี)");
  }
  if (kind === "cable") {
    choosing.push("เลือกขนาดสาย (mm²) ให้รับกระแสของสตริงได้ และเผื่อระยะเดินสายเพื่อลดแรงดันตก");
    choosing.push("ต้องเป็นสายชนิด PV/DC ทน UV เท่านั้น ห้ามใช้สาย VAF/THW ทั่วไปเดินนอกอาคาร");
    choosing.push("แยกสีขั้วบวก–ลบให้ชัดเจน เพื่อความปลอดภัยตอนติดตั้งและซ่อมบำรุง");
  }
  if (kind === "accessory") {
    choosing.push("เลือกพิกัดกระแส/แรงดันให้สูงกว่าค่าที่ใช้งานจริง และเหมาะกับสภาพติดตั้งกลางแจ้ง");
  }

  const limits: string[] = [];
  if (kind === "hybrid-inverter" || kind === "grid-inverter") {
    limits.push("ราคาสินค้าเป็นเฉพาะตัวอินเวอร์เตอร์ ยังไม่รวมแผง โครงยึด อุปกรณ์ป้องกัน และค่าติดตั้ง");
    limits.push("การเชื่อมต่อขนานกับการไฟฟ้าต้องยื่นขออนุญาต (กฟน./กฟภ.) และมีวิศวกรรับรองแบบ");
    limits.push("ผลผลิตไฟขึ้นกับสภาพอากาศจริง ฤดูฝนหรือวันฟ้าปิดจะได้ไฟน้อยลงอย่างเห็นได้ชัด");
    if (kind === "grid-inverter") limits.push("ไม่มีไฟใช้เมื่อไฟดับ และต่อแบตเตอรี่โดยตรงไม่ได้");
  }
  if (kind === "battery") {
    limits.push("ต้องใช้กับอินเวอร์เตอร์ที่รองรับรุ่นนี้เท่านั้น ไม่สามารถใช้ข้ามยี่ห้อได้");
    limits.push("ความจุใช้งานจริงจะน้อยกว่าค่าบนสเปกเล็กน้อย (เผื่อ DoD และประสิทธิภาพแปลงไฟ)");
    limits.push("ความจุลดลงตามอายุการใช้งานและจำนวนรอบชาร์จ ควรดูเงื่อนไขรับประกันประกอบ");
    limits.push("เป็นสินค้าน้ำหนักมาก ต้องมีช่างติดตั้งและยึดผนัง/ฐานตามมาตรฐาน");
  }
  if (kind === "panel") {
    limits.push("ผลผลิตลดลงเมื่อมีเงาบัง ฝุ่นเกาะ หรืออุณหภูมิแผงสูง ควรล้างแผงปีละ 1–2 ครั้ง");
    limits.push("ต้องตรวจสอบโครงสร้างหลังคาว่ารับน้ำหนักได้ก่อนติดตั้ง");
  }
  if (kind === "cable" || kind === "accessory") {
    limits.push("เป็นอุปกรณ์ประกอบ ไม่สามารถใช้งานเดี่ยว ๆ ต้องติดตั้งร่วมกับระบบทั้งชุด");
    limits.push("งานฝั่ง DC มีแรงดันสูงและอันตราย ควรให้ช่างที่มีประสบการณ์ดำเนินการ");
  }

  return {
    kind,
    kindLabel: kindLabel[kind],
    useLabel: useLabelOf(kind, spec),
    brief: brief[kind],
    what: what[kind],
    howItWorks,
    canDo,
    pairWith,
    choosing,
    limits,
    spec,
  };
}

function Body({ x }: { x: SolarExplain }) {
  return (
    <div className="space-y-3 text-[13px] leading-relaxed text-slate-600">
      <div>
        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
          <Info className="h-4 w-4 text-emerald-700" /> อุปกรณ์นี้คืออะไร
        </div>
        <p className="mt-1">{x.what}</p>
      </div>

      <div>
        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
          <Zap className="h-4 w-4 text-emerald-700" /> ทำงานอย่างไร
        </div>
        <ul className="mt-1 list-disc space-y-1 pl-4">
          {x.howItWorks.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>

      <div>
        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
          <CircleCheck className="h-4 w-4 text-emerald-700" /> นำไปใช้อะไรได้บ้าง
        </div>
        <ul className="mt-1 list-disc space-y-1 pl-4">
          {x.canDo.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>

      <div>
        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
          <Puzzle className="h-4 w-4 text-emerald-700" /> ต้องใช้ร่วมกับอะไร
        </div>
        <ul className="mt-1 list-disc space-y-1 pl-4">
          {x.pairWith.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>

      <div>
        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
          <Sun className="h-4 w-4 text-emerald-700" /> สิ่งที่ต้องคำนึงในการเลือก
        </div>
        <ul className="mt-1 list-disc space-y-1 pl-4">
          {x.choosing.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>

      <div>
        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
          <TriangleAlert className="h-4 w-4 text-amber-600" /> ข้อจำกัดที่ควรรู้ก่อนซื้อ
        </div>
        <ul className="mt-1 list-disc space-y-1 pl-4">
          {x.limits.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
        <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
          <Sparkles className="h-4 w-4" /> เราสำรวจ ออกแบบ ติดตั้ง และดูแลต่อเนื่อง
        </div>
        <p className="mt-1">
          ทีมช่างของเราสำรวจหน้างาน คำนวณขนาดระบบจากบิลค่าไฟจริง ออกแบบการวางแผงบนหลังคา ติดตั้งพร้อมอุปกรณ์ป้องกัน
          ดำเนินเรื่องขออนุญาตการไฟฟ้า ตั้งค่าแอปมอนิเตอร์ และมีบริการล้างแผง–บำรุงรักษา (MA) — ตัวแทนจำหน่าย HUAWEI FusionSolar
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href="tel:020456104"
            className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-[12px] font-semibold text-white hover:bg-emerald-700"
          >
            <Phone className="h-3.5 w-3.5" /> โทรปรึกษา 02-045-6104
          </a>
          <LineQrDialog>
            <button
              type="button"
              className="inline-flex items-center rounded border border-emerald-300 bg-white px-2.5 py-1 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              LINE @entgroup
            </button>
          </LineQrDialog>
          <a
            href="mailto:sales@entgroup.co.th"
            className="inline-flex items-center rounded border border-emerald-300 bg-white px-2.5 py-1 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            sales@entgroup.co.th
          </a>
        </div>
      </div>
    </div>
  );
}

/** เวอร์ชันย่อบนการ์ดสินค้า */
export function SolarBrief({
  category,
  name,
  description,
  className = "",
}: {
  category?: string | null;
  name?: string | null;
  description?: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const x = explainSolar(category, name, description);
  if (!x) return null;

  return (
    <div className={`mt-1.5 ${className}`} onClick={(e) => e.stopPropagation()}>
      <div className="rounded-md bg-amber-50 px-2 py-1.5 text-[11px] leading-snug text-amber-900 ring-1 ring-amber-100">
        <span className="mr-1 inline-flex items-center gap-1 font-semibold">
          <Sun className="h-3 w-3" />
          {x.kindLabel}
        </span>
        <span className="line-clamp-2 text-amber-800/90">{x.brief}</span>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(true);
            }}
            className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
          >
            <Info className="h-3 w-3" /> รุ่นนี้คืออะไร เหมาะกับบ้าน/อาคารแบบไหน?
          </button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Sun className="h-4 w-4 text-amber-500" /> {name}
            </DialogTitle>
            <DialogDescription>
              {x.kindLabel} · {x.useLabel}
            </DialogDescription>
          </DialogHeader>
          <Body x={x} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** เวอร์ชันเต็มบนหน้ารายละเอียดสินค้า */
export function SolarExplainer({
  category,
  name,
  description,
  className = "",
}: {
  category?: string | null;
  name?: string | null;
  description?: string | null;
  className?: string;
}) {
  const x = explainSolar(category, name, description);
  if (!x) return null;
  const s = x.spec;

  return (
    <section
      className={`mt-6 rounded-lg border border-emerald-200 bg-white p-4 ${className}`}
      aria-label="ทำความรู้จักอุปกรณ์โซลาร์รุ่นนี้"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white">
          <Sun className="h-3.5 w-3.5" /> {x.kindLabel}
        </span>
        <span className="rounded bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200">
          {x.useLabel}
        </span>
        {s.kw && (
          <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            {s.kw} kW
          </span>
        )}
        {s.kwh && (
          <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            {s.kwh} kWh
          </span>
        )}
        {s.phase && (
          <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            {s.phase} เฟส
          </span>
        )}
        {s.hybrid && (
          <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            สำรองไฟได้
          </span>
        )}
        {s.model && (
          <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700">
            รุ่น {s.model}
          </span>
        )}
      </div>
      <p className="mb-3 text-sm font-medium text-slate-800">{x.brief}</p>
      <Body x={x} />
    </section>
  );
}
