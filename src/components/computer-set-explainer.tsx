/**
 * ComputerSetExplainer / ComputerSetBrief — คำอธิบายชุดคอมพิวเตอร์ (Computer Set)
 * "เครื่องรุ่นนี้แรงแค่ไหน ทำอะไรได้ ทำงานยังไง สิ่งที่ต้องคำนึงในการเลือก ข้อจำกัด"
 */
import { useState } from "react";
import {
  Monitor,
  Info,
  Puzzle,
  CircleCheck,
  TriangleAlert,
  Sparkles,
  Phone,
  Cpu,
  Gamepad2,
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

export const COMPUTER_SET_CATEGORIES = ["computer set", "คอมประกอบ", "คอมพิวเตอร์เซ็ต"];

export type PcTier = "office" | "entry" | "mid" | "high" | "ultra";

export type PcSpec = {
  cpu: string | null;
  cpuBrand: "AMD" | "Intel" | null;
  gpu: string | null;
  vram: number | null;
  ram: number | null;
  ramType: "DDR4" | "DDR5" | null;
  storage: string | null;
  igpuOnly: boolean;
  x3d: boolean;
};

export type PcExplain = {
  tier: PcTier;
  kindLabel: string;
  useLabel: string;
  brief: string;
  what: string;
  howItWorks: string[];
  canDo: string[];
  pairWith: string[];
  choosing: string[];
  limits: string[];
  spec: PcSpec;
};

export function parsePcSpec(name?: string | null, description?: string | null): PcSpec {
  const s = `${name ?? ""} ${description ?? ""}`;
  const l = s.toLowerCase();

  const cpuM =
    s.match(/(Ryzen\s*\d\s*[\w-]+)/i) ??
    s.match(/(Core\s*ULTRA\s*\d\s*[\w-]+)/i) ??
    s.match(/(i[3579][- ]?\d{4,5}\w*)/i);
  const cpu = cpuM ? cpuM[1].replace(/\s+/g, " ").trim() : null;
  const cpuBrand = /ryzen|amd/.test(l) && !/intel|core ultra|\bi[3579]\b/.test(l)
    ? "AMD"
    : /intel|core ultra|i[3579][- ]?\d{4}/.test(l)
      ? "Intel"
      : /ryzen/.test(l)
        ? "AMD"
        : null;

  const gpuM = s.match(/(RTX\s*\d{4}\s*(?:TI)?|RX\s*\d{4}\s*(?:XT)?|GTX\s*\d{3,4})/i);
  const gpu = gpuM ? gpuM[1].replace(/\s+/g, " ").toUpperCase().trim() : null;

  const vramM = gpu ? s.match(new RegExp(`${gpu.replace(/\s/g, "\\s*")}\\s*(\\d{1,2})\\s*GB`, "i")) : null;
  const vram = vramM ? Number(vramM[1]) : null;

  const ramM = s.match(/(\d{1,3})\s*GB\s*DDR([45])/i);
  const ram = ramM ? Number(ramM[1]) : null;
  const ramType = ramM ? (`DDR${ramM[2]}` as "DDR4" | "DDR5") : null;

  const stM = s.match(/((?:\d+(?:TB|GB))\s*SSD(?:\s*\+\s*\d+(?:TB|GB)\s*SSD)?)/i);
  const storage = stM ? stM[1].toUpperCase() : null;

  const igpuOnly = /no\s*vga/i.test(s) || (!gpu && /\d{4}g\b|8500g|3200g|3400g/i.test(s));

  return { cpu, cpuBrand, gpu, vram, ram, ramType, storage, igpuOnly, x3d: /x3d/i.test(s) };
}

function tierOf(spec: PcSpec): PcTier {
  if (spec.igpuOnly || !spec.gpu) return "office";
  const g = spec.gpu.replace(/\s/g, "");
  const num = Number(g.replace(/[^\d]/g, "").slice(0, 4));
  const ti = /TI|XT/i.test(spec.gpu);
  if (/5090|4090|5080/i.test(g)) return "ultra";
  if (/5070|4070|9070|7800XT|5080/i.test(g)) return "high";
  if (/5060|4060|7600|9060/i.test(g)) return ti ? "mid" : "mid";
  if (/3050|1650|6500/i.test(g)) return "entry";
  return num >= 5070 ? "high" : "mid";
}

export function explainComputerSet(
  category?: string | null,
  name?: string | null,
  description?: string | null,
): PcExplain | null {
  const c = (category ?? "").toLowerCase();
  if (!COMPUTER_SET_CATEGORIES.some((k) => c.includes(k))) return null;

  const spec = parsePcSpec(name, description);
  const tier = tierOf(spec);
  const gpuTxt = spec.gpu ? `${spec.gpu}${spec.vram ? ` ${spec.vram}GB` : ""}` : "การ์ดจอออนบอร์ด";

  const kindLabel: Record<PcTier, string> = {
    office: "คอมสำนักงาน / ใช้งานทั่วไป (การ์ดจอในตัว)",
    entry: "คอมเกมมิ่งระดับเริ่มต้น",
    mid: "คอมเกมมิ่ง–ทำงานกราฟิก ระดับกลาง",
    high: "คอมเกมมิ่ง–ครีเอเตอร์ ระดับสูง",
    ultra: "คอมสเปกท็อป สำหรับงานหนัก/4K/AI",
  };

  const useLabel: Record<PcTier, string> = {
    office: "เอกสาร บัญชี POS เรียนออนไลน์",
    entry: "เกมออนไลน์ 1080p ตั้งค่ากลาง",
    mid: "เกม 1080p–1440p ลื่น / ตัดต่อ FHD",
    high: "เกม 1440p–4K / ตัดต่อ 4K / 3D",
    ultra: "4K สูงสุด / เรนเดอร์ / งาน AI",
  };

  const brief: Record<PcTier, string> = {
    office: `ชุดคอมประกอบพร้อมใช้${spec.cpu ? ` ซีพียู ${spec.cpu}` : ""} ใช้กราฟิกในตัว เน้นงานเอกสาร อินเทอร์เน็ต และโปรแกรมสำนักงาน ประหยัดไฟและเงียบ`,
    entry: `ชุดคอมเกมมิ่งเริ่มต้น${spec.cpu ? ` ${spec.cpu}` : ""} + ${gpuTxt} เล่นเกมออนไลน์ยอดนิยมที่ 1080p ได้สบาย`,
    mid: `ชุดคอมสมดุล${spec.cpu ? ` ${spec.cpu}` : ""} + ${gpuTxt} เล่นเกมลื่นที่ 1080p–1440p และทำงานตัดต่อ/ออกแบบได้ดี`,
    high: `ชุดคอมประสิทธิภาพสูง${spec.cpu ? ` ${spec.cpu}` : ""} + ${gpuTxt} รองรับเกม 1440p–4K, ตัดต่อวิดีโอ 4K และงาน 3D`,
    ultra: `ชุดคอมสเปกสูงสุด${spec.cpu ? ` ${spec.cpu}` : ""} + ${gpuTxt} สำหรับเกม 4K, เรนเดอร์, สตรีมมิ่งระดับมืออาชีพ และงาน AI/Machine Learning`,
  };

  const what: Record<PcTier, string> = {
    office: `Computer Set คือชุดคอมพิวเตอร์ที่ประกอบสำเร็จจากอะไหล่แยกชิ้น (CPU, เมนบอร์ด, RAM, SSD, เคส, พาวเวอร์ซัพพลาย) รุ่นนี้ใช้กราฟิกที่รวมอยู่ในซีพียู (iGPU) จึงไม่ต้องมีการ์ดจอแยก เหมาะกับงานที่ไม่ต้องการพลังกราฟิกมาก ข้อดีคือราคาประหยัด กินไฟน้อย และอัปเกรดเพิ่มการ์ดจอทีหลังได้`,
    entry: `ชุดคอมประกอบพร้อมใช้ที่มีการ์ดจอแยกระดับเริ่มต้น การ์ดจอแยกจะรับภาระงานประมวลผลภาพแทนซีพียู ทำให้เล่นเกมและใช้โปรแกรมกราฟิกได้ลื่นกว่าเครื่องที่ใช้กราฟิกในตัวมาก`,
    mid: `ชุดคอมประกอบที่จับคู่ซีพียูกับการ์ดจอให้สมดุล (ไม่มีตัวใดคอขวดอีกตัว) เป็นระดับที่คนส่วนใหญ่เลือกเพราะคุ้มค่าที่สุด — เล่นเกมได้ลื่น พร้อมรองรับงานตัดต่อและออกแบบไปด้วย`,
    high: `ชุดคอมระดับสูงที่ใช้การ์ดจอแรงและ RAM มาก รองรับความละเอียดสูงและงานที่ต้องประมวลผลต่อเนื่องนาน ๆ เช่น เรนเดอร์วิดีโอ งาน 3D และการสตรีมพร้อมเล่นเกม`,
    ultra: `ชุดคอมสเปกท็อประดับ Workstation/Enthusiast ใช้ซีพียูและการ์ดจอเรือธง VRAM สูง เหมาะกับงานที่กินทรัพยากรสูงสุด ทั้งเกม 4K, เรนเดอร์ 3D, งานวิดีโอมืออาชีพ และการเทรน/รันโมเดล AI ในเครื่อง`,
  };

  const howItWorks: string[] = [
    `ซีพียู${spec.cpu ? ` (${spec.cpu})` : ""} ทำหน้าที่ประมวลผลหลัก ยิ่งคอร์/ความเร็วสูง ยิ่งเปิดหลายโปรแกรมพร้อมกันได้ลื่น`,
    spec.igpuOnly
      ? "ใช้กราฟิกในตัวซีพียู (iGPU) แสดงผลภาพ — เพียงพอสำหรับงานเอกสาร วิดีโอ และเกมเบา ๆ"
      : `การ์ดจอ ${gpuTxt} รับหน้าที่เรนเดอร์ภาพในเกม/โปรแกรมกราฟิก โดย VRAM${spec.vram ? ` ${spec.vram}GB` : ""} คือหน่วยความจำสำหรับเก็บพื้นผิวและโมเดล ยิ่งเล่นความละเอียดสูงยิ่งต้องการมาก`,
    spec.ram
      ? `RAM ${spec.ram}GB ${spec.ramType ?? ""} เป็นพื้นที่ทำงานชั่วคราว — 16GB พอสำหรับเกมและงานทั่วไป, 32GB ขึ้นไปเหมาะกับตัดต่อและเปิดหลายงานพร้อมกัน`
      : "RAM คือพื้นที่ทำงานชั่วคราว ยิ่งมากยิ่งเปิดงานพร้อมกันได้เยอะ",
    spec.storage
      ? `พื้นที่เก็บข้อมูล ${spec.storage} เป็น SSD จึงบูตเครื่องและเปิดโปรแกรมได้เร็วกว่าฮาร์ดดิสก์จานหมุนหลายเท่า`
      : "ใช้ SSD เป็นไดรฟ์หลัก ทำให้เปิดเครื่องและโหลดเกมเร็ว",
    "ทุกชิ้นส่วนทำงานร่วมกันผ่านเมนบอร์ด และใช้พาวเวอร์ซัพพลายจ่ายไฟ — เราประกอบ ติดตั้งระบบ ทดสอบเสถียรภาพ (Burn-in) ก่อนส่งมอบ",
  ];
  if (spec.x3d) howItWorks.push("ซีพียูรหัส X3D มีแคช 3D เพิ่มพิเศษ ช่วยเพิ่มเฟรมเรตในเกมได้ชัดเจน โดยเฉพาะเกมแนว Simulation/MOBA");

  const canDo: string[] = [];
  if (tier === "office") {
    canDo.push("งานเอกสาร Word/Excel, บัญชี, ระบบ POS, งานขาย–สต๊อกสินค้า");
    canDo.push("ประชุมออนไลน์ Zoom/Teams เรียนออนไลน์ ดูวิดีโอ 4K บน YouTube/Netflix");
    canDo.push("เกมออนไลน์เบา ๆ เช่น Valorant, ROV, Dota 2 ที่ตั้งค่าต่ำ–กลาง");
    canDo.push("อัปเกรดใส่การ์ดจอแยกภายหลังได้ หากต้องการเล่นเกมจริงจัง");
  }
  if (tier === "entry") {
    canDo.push("เล่นเกมออนไลน์ยอดฮิต (Valorant, GTA V, Fortnite) ที่ 1080p ได้ 60fps ขึ้นไป");
    canDo.push("ตัดต่อวิดีโอ Full HD, แต่งภาพ Photoshop, งานออกแบบเบื้องต้น");
    canDo.push("ทำงานหลายหน้าจอ และใช้เป็นเครื่องหลักในบ้าน/สำนักงานได้สบาย");
  }
  if (tier === "mid") {
    canDo.push("เล่นเกม AAA ที่ 1080p ตั้งค่าสูง หรือ 1440p ตั้งค่ากลาง–สูงได้ลื่น");
    canDo.push("ตัดต่อวิดีโอ 4K, งาน 3D ระดับเริ่มต้น, สตรีมเกมลง Facebook/YouTube");
    canDo.push("ใช้กับจอ 144Hz เพื่อความลื่นในเกมแนว FPS/E-Sport");
    if (spec.vram && spec.vram >= 16) canDo.push("VRAM 16GB ช่วยรองรับงาน AI สร้างภาพ (Stable Diffusion) และเกมที่กินแรมการ์ดจอสูง");
  }
  if (tier === "high") {
    canDo.push("เล่นเกม AAA ที่ 1440p ตั้งค่าสูงสุด หรือ 4K พร้อมเปิด DLSS/FSR");
    canDo.push("ตัดต่อและเรนเดอร์วิดีโอ 4K–8K, งาน 3D Blender/SolidWorks, สถาปัตย์–เรนเดอร์ภาพ");
    canDo.push("สตรีมสดพร้อมเล่นเกมในเครื่องเดียวโดยเฟรมไม่ตก");
  }
  if (tier === "ultra") {
    canDo.push("เล่นเกม 4K ตั้งค่าสูงสุด พร้อม Ray Tracing เต็มรูปแบบ");
    canDo.push("งานวิดีโอมืออาชีพ 8K, Motion Graphic, เรนเดอร์ฟาร์มขนาดเล็ก");
    canDo.push("งาน AI ในเครื่อง — เทรน/ไฟน์จูนโมเดล, รัน LLM ขนาดกลาง, งาน Computer Vision");
    canDo.push("ใช้เป็น Workstation ขององค์กร ออกใบกำกับภาษีเต็มรูปแบบ พร้อมบริการดูแลถึงที่");
  }

  const pairWith: string[] = [
    spec.igpuOnly
      ? "จอมอนิเตอร์ 24 นิ้ว Full HD และชุดคีย์บอร์ด–เมาส์ (ชุดนี้ยังไม่รวมจอ)"
      : `จอมอนิเตอร์ที่เหมาะกับสเปก — ${tier === "mid" ? "1080p/1440p 144Hz" : tier === "high" ? "1440p 165Hz หรือ 4K" : tier === "ultra" ? "4K 144Hz ขึ้นไป" : "1080p 75–144Hz"} (ชุดนี้ยังไม่รวมจอ)`,
    "ระบบปฏิบัติการ Windows 11 ลิขสิทธิ์ และ Microsoft Office (สั่งเพิ่มพร้อมเครื่องได้ เราติดตั้งให้)",
    "เครื่องสำรองไฟ (UPS) เพื่อป้องกันไฟตก–ไฟดับทำให้ข้อมูลเสียหาย",
    "คีย์บอร์ด เมาส์ หูฟัง/ลำโพง และเว็บแคมสำหรับการประชุมออนไลน์",
  ];
  if (tier !== "office") pairWith.push("อินเทอร์เน็ตความเร็วสูงหรือสาย LAN สำหรับเกมออนไลน์ให้ค่า Ping ต่ำ");

  const choosing: string[] = [
    "เริ่มจาก 'งานที่จะใช้' ก่อนเสมอ — งานเอกสารไม่จำเป็นต้องมีการ์ดจอแยก แต่ถ้าจะเล่นเกมหรือตัดต่อ การ์ดจอคือส่วนที่สำคัญที่สุด",
    "ดูความละเอียดจอที่จะใช้ — 1080p เลือกระดับ RTX 5060, 1440p เลือก RTX 5070, 4K ควรเป็น RTX 5080/5090",
    spec.ramType === "DDR4"
      ? "รุ่นนี้ใช้ RAM DDR4 ราคาประหยัดกว่า แต่แพลตฟอร์มใหม่กว่าจะเป็น DDR5 ที่อัปเกรดในอนาคตได้ยาวกว่า"
      : "รุ่นนี้ใช้ RAM DDR5 ซึ่งเป็นแพลตฟอร์มใหม่ อัปเกรดในอนาคตได้ยาวกว่า DDR4",
    spec.ram && spec.ram <= 8
      ? "RAM 8GB เพียงพอสำหรับงานเอกสาร แต่ถ้าจะเปิดหลายแท็บ/หลายโปรแกรม แนะนำเพิ่มเป็น 16GB"
      : "RAM 16GB เป็นมาตรฐานปัจจุบัน ส่วนงานตัดต่อ/AI ควรเลือก 32GB ขึ้นไป",
    "พื้นที่ SSD 500GB พอสำหรับงานทั่วไป แต่ถ้าลงเกมหลายเกมหรือเก็บวิดีโอ ควรเลือก 1TB ขึ้นไป",
    "ให้ซีพียูกับการ์ดจอสมดุลกัน — ซีพียูอ่อนเกินไปจะทำให้การ์ดจอแรง ๆ ทำงานได้ไม่เต็มที่ (คอขวด)",
    "ถ้าไม่แน่ใจ เลือกผ่านเครื่องมือ PC Builder ของเรา หรือให้ทีมช่างจัดสเปกให้ตามงบประมาณ",
  ];

  const limits: string[] = [
    "ราคานี้เป็นชุดเครื่อง (Case + อุปกรณ์ภายใน) ยังไม่รวมจอมอนิเตอร์ คีย์บอร์ด และเมาส์ เว้นแต่ระบุไว้",
    "ยังไม่รวมระบบปฏิบัติการ Windows ลิขสิทธิ์ — สั่งซื้อเพิ่มพร้อมเครื่องได้ในราคาพิเศษ",
    "สเปกอาจมีการปรับเปลี่ยนรุ่นอะไหล่ที่เทียบเท่าตามสต๊อกจริง เราจะแจ้งยืนยันก่อนประกอบทุกครั้ง",
    "ราคายังไม่รวม VAT 7%",
  ];
  if (spec.igpuOnly) limits.push("ไม่มีการ์ดจอแยก จึงไม่เหมาะกับเกมหนักหรืองานเรนเดอร์ 3D");
  if (tier === "ultra") limits.push("เครื่องสเปกสูงกินไฟและเกิดความร้อนมาก ควรจัดวางในที่ระบายอากาศดี และแนะนำใช้ร่วมกับ UPS");

  return {
    tier,
    kindLabel: kindLabel[tier],
    useLabel: useLabel[tier],
    brief: brief[tier],
    what: what[tier],
    howItWorks,
    canDo,
    pairWith,
    choosing,
    limits,
    spec,
  };
}

function Body({ x }: { x: PcExplain }) {
  return (
    <div className="space-y-3 text-[13px] leading-relaxed text-slate-600">
      <div>
        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
          <Info className="h-4 w-4 text-emerald-700" /> เครื่องรุ่นนี้คืออะไร
        </div>
        <p className="mt-1">{x.what}</p>
      </div>

      <div>
        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
          <Cpu className="h-4 w-4 text-emerald-700" /> แต่ละชิ้นส่วนทำงานอย่างไร
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
          <Gamepad2 className="h-4 w-4 text-emerald-700" /> สิ่งที่ต้องคำนึงในการเลือก
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
          <Sparkles className="h-4 w-4" /> ช่างเราประกอบ ทดสอบ และติดตั้งให้พร้อมใช้
        </div>
        <p className="mt-1">
          ทุกเครื่องประกอบโดยช่างผู้ชำนาญ จัดสายภายในเรียบร้อย ติดตั้งระบบปฏิบัติการและไดรเวอร์ ทดสอบความเสถียรและอุณหภูมิก่อนส่ง
          พร้อมแนะนำการใช้งานและบริการหลังการขาย — ปรับสเปกตามงบประมาณได้
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
export function ComputerSetBrief({
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
  const x = explainComputerSet(category, name, description);
  if (!x) return null;

  return (
    <div className={`mt-1.5 ${className}`} onClick={(e) => e.stopPropagation()}>
      <div className="rounded-md bg-sky-50 px-2 py-1.5 text-[11px] leading-snug text-sky-900 ring-1 ring-sky-100">
        <span className="mr-1 inline-flex items-center gap-1 font-semibold">
          <Monitor className="h-3 w-3" />
          {x.kindLabel}
        </span>
        <span className="line-clamp-2 text-sky-800/90">{x.brief}</span>
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
            <Info className="h-3 w-3" /> เครื่องรุ่นนี้แรงแค่ไหน เหมาะกับงานอะไร?
          </button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Monitor className="h-4 w-4 text-emerald-700" /> {name}
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
export function ComputerSetExplainer({
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
  const x = explainComputerSet(category, name, description);
  if (!x) return null;
  const s = x.spec;

  return (
    <section
      className={`mt-6 rounded-lg border border-emerald-200 bg-white p-4 ${className}`}
      aria-label="ทำความรู้จักชุดคอมพิวเตอร์รุ่นนี้"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white">
          <Monitor className="h-3.5 w-3.5" /> {x.kindLabel}
        </span>
        <span className="rounded bg-sky-50 px-2 py-1 text-[11px] font-bold text-sky-700 ring-1 ring-sky-200">
          {x.useLabel}
        </span>
        {s.cpu && (
          <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            {s.cpu}
          </span>
        )}
        {s.gpu && (
          <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            {s.gpu}
            {s.vram ? ` ${s.vram}GB` : ""}
          </span>
        )}
        {s.ram && (
          <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            RAM {s.ram}GB {s.ramType ?? ""}
          </span>
        )}
        {s.storage && (
          <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            {s.storage}
          </span>
        )}
      </div>
      <p className="mb-3 text-sm font-medium text-slate-800">{x.brief}</p>
      <Body x={x} />
    </section>
  );
}
