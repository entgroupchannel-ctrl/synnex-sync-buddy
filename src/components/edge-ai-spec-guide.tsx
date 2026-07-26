/**
 * EdgeAiSpecGuide — คำอธิบายเชิงผู้เชี่ยวชาญรายรุ่นสำหรับสินค้ากลุ่ม NVIDIA Jetson / Edge AI
 * วิเคราะห์จากชื่อรุ่น/สเปก (โมดูล, TOPS, RAM, จำนวน LAN/กล้อง, IP rating, ช่วงอุณหภูมิ, PoE)
 * แล้วแปลงเป็นภาษาที่ลูกค้าเข้าใจ: "รุ่นนี้รันงาน AI อะไรได้ กี่กล้อง เหมาะกับหน้างานแบบไหน"
 */
import { useState } from "react";
import {
  BrainCircuit,
  ChevronDown,
  Cpu,
  Camera,
  Gauge,
  Thermometer,
  Wrench,
  Phone,
  Layers,
} from "lucide-react";
import { LineQrDialog } from "@/components/line-qr-dialog";

export const EDGE_AI_CATEGORIES = [
  "edge ai box",
  "developer system",
  "carrier board",
  "developer kits",
  "module",
  "ai supercomputer",
];

export type EdgeAiSpec = {
  module: string | null;
  tops: number | null;
  ramGb: number | null;
  lan: number | null;
  csi: number | null;
  ipRating: string | null;
  tempMin: number | null;
  tempMax: number | null;
  poe: boolean;
  fanless: boolean;
  wireless: boolean;
  pcie: boolean;
};

const MODULES: { re: RegExp; label: string; tops?: number }[] = [
  { re: /jetson\s*thor|t5000|agx\s*thor/, label: "Jetson Thor", tops: 2070 },
  { re: /dgx\s*spark|supercomputer/, label: "DGX Spark", tops: 1000 },
  { re: /igx\s*orin/, label: "IGX Orin" },
  { re: /agx\s*orin/, label: "Jetson AGX Orin", tops: 275 },
  { re: /orin\s*nx/, label: "Jetson Orin NX", tops: 157 },
  { re: /orin\s*nano/, label: "Jetson Orin Nano", tops: 67 },
  { re: /agx\s*xavier/, label: "Jetson AGX Xavier", tops: 32 },
  { re: /xavier\s*nx/, label: "Jetson Xavier NX", tops: 21 },
  { re: /tx2\s*nx|tx2/, label: "Jetson TX2 NX", tops: 1.3 },
  { re: /\bnano\b/, label: "Jetson Nano", tops: 0.5 },
];

export function parseEdgeAiSpec(name?: string | null, description?: string | null): EdgeAiSpec | null {
  const raw = `${name ?? ""} ${description ?? ""}`;
  const t = raw.toLowerCase();
  if (!t.trim()) return null;

  const mod = MODULES.find((m) => m.re.test(t)) ?? null;

  const topsM = t.match(/(\d{1,4}(?:\.\d)?)\s*(?:\/\s*\d+(?:\.\d)?\s*)?tops/);
  const tops = topsM ? Number(topsM[1]) : (mod?.tops ?? null);

  const ramM = t.match(/(\d{1,3})\s*\/?\s*\d{0,3}\s*gb\s*(?:lpddr|ddr|128|256|memory)/) ?? t.match(/(\d{1,3})\s*gb\s*lpddr/);
  const ramGb = ramM ? Number(ramM[1]) : null;

  const lanM = t.match(/(\d)\s*[×x]\s*rj45/) ?? t.match(/(\d)\s*个千兆/);
  const csiM = t.match(/(\d)\s*[×x]\s*(?:\d\s*lane\s*)?mipi/) ?? t.match(/(\d)\s*[×x]\s*csi/);

  const tempM = t.match(/-?\s*(\d{1,2})\s*(?:℃|°c|c)?\s*(?:~|to|–|-)\s*\+?\s*(\d{1,3})\s*(?:℃|°c)/);

  return {
    module: mod?.label ?? null,
    tops,
    ramGb,
    lan: lanM ? Number(lanM[1]) : null,
    csi: csiM ? Number(csiM[1]) : null,
    ipRating: t.match(/ip6[5-8]/)?.[0]?.toUpperCase() ?? null,
    tempMin: tempM ? -Math.abs(Number(tempM[1])) : null,
    tempMax: tempM ? Number(tempM[2]) : null,
    poe: /\bpoe\b|802\.3af|802\.3at/.test(t),
    fanless: /fanless|无风扇|passive\s*cool/.test(t),
    wireless: /wi-?fi|802\.11|5g|lte|nano\s*sim/.test(t),
    pcie: /pcie|minipcie|m\.2/.test(t),
  };
}

/** ประมาณจำนวนกล้องที่รันงาน Object Detection (YOLO ~1080p 15fps) ได้ไหว */
function cameraCapacity(tops: number): { min: number; max: number } {
  const est = tops / 4;
  return { min: Math.max(1, Math.floor(est * 0.7)), max: Math.max(2, Math.round(est * 1.3)) };
}

function workloadOf(tops: number | null): { title: string; items: string[] } {
  if (!tops) {
    return {
      title: "งาน AI ทั่วไปที่ Edge",
      items: [
        "งานตรวจจับวัตถุ/นับจำนวนแบบพื้นฐาน",
        "เชื่อมกล้อง IP หรือกล้องอุตสาหกรรมเข้าประมวลผลในที่หน้างาน",
      ],
    };
  }
  if (tops < 15) {
    return {
      title: "งานเบา — เริ่มต้นเรียนรู้และงานจุดเดียว",
      items: [
        "นับคน/นับรถเข้า-ออก 1–2 กล้อง",
        "อ่านบาร์โค้ด/QR, ตรวจจับความเคลื่อนไหว, IoT Gateway",
        "เหมาะกับงานต้นแบบ (PoC) และห้องเรียน/แล็บ",
      ],
    };
  }
  if (tops < 80) {
    return {
      title: "งานกลาง — ใช้งานจริงในไซต์เล็กถึงกลาง",
      items: [
        "ตรวจจับคน/รถ/หมวกนิรภัย–PPE แบบเรียลไทม์หลายกล้อง",
        "อ่านป้ายทะเบียน (LPR) ทางเข้า-ออกโครงการ",
        "ตรวจสอบคุณภาพชิ้นงานบนสายการผลิตความเร็วปานกลาง",
      ],
    };
  }
  if (tops < 300) {
    return {
      title: "งานหนัก — โครงการระดับองค์กร",
      items: [
        "Video Analytics หลายสิบสตรีมพร้อมกัน (DeepStream)",
        "จดจำใบหน้า, พฤติกรรมเสี่ยง, Heat Map พฤติกรรมลูกค้าในร้าน",
        "หุ่นยนต์เคลื่อนที่อัตโนมัติ (AMR), ระบบตรวจสอบด้วยภาพความเร็วสูง",
      ],
    };
  }
  return {
    title: "งานระดับสูงสุด — Generative AI / Robotics ที่ Edge",
    items: [
      "รัน LLM / Vision-Language Model ในองค์กรโดยข้อมูลไม่ออกนอกไซต์",
      "หุ่นยนต์ฮิวแมนนอยด์และงาน Physical AI ที่ต้องตอบสนองระดับมิลลิวินาที",
      "ศูนย์ประมวลผล AI ย่อยประจำโรงงาน/โรงพยาบาล",
    ],
  };
}

function deploymentNotes(s: EdgeAiSpec, category: string): string[] {
  const out: string[] = [];
  const c = category.toLowerCase();
  if (c.includes("edge ai box")) out.push("เป็นเครื่องสำเร็จรูปพร้อมใช้ ติดตั้งในตู้คอนโทรล ยึดราง DIN หรือแขวนผนังหน้างานได้ทันที");
  if (c.includes("carrier board")) out.push("เป็นบอร์ดขยาย (Carrier Board) ต้องเลือกโมดูล Jetson และเคส/แหล่งจ่ายไฟเพิ่ม — เหมาะกับผู้ผลิตที่ออกแบบเครื่องของตัวเอง");
  if (c.includes("developer kit")) out.push("เป็นชุดพัฒนา (Dev Kit) สำหรับเขียนและทดสอบโมเดลก่อนย้ายขึ้นเครื่องที่ใช้งานจริง");
  if (c.includes("developer system")) out.push("เป็นชุดระบบพร้อมพัฒนา ประกอบมาให้ครบ เสียบไฟแล้วเริ่มเทรน/ทดสอบได้เลย");
  if (c.includes("module")) out.push("เป็นโมดูลประมวลผลอย่างเดียว ต้องใช้คู่กับ Carrier Board ที่รองรับ");
  if (c.includes("supercomputer")) out.push("เดสก์ท็อปสำหรับพัฒนาและรันโมเดลขนาดใหญ่ในองค์กร ไม่ต้องพึ่งคลาวด์");

  if (s.lan) out.push(`มีพอร์ต LAN ${s.lan} ช่อง แยกวงเครือข่ายกล้องออกจากวงออฟฟิศได้ ปลอดภัยและแบนด์วิดท์ไม่ชนกัน`);
  if (s.csi) out.push(`รองรับกล้อง MIPI CSI ${s.csi} ตัว เหมาะกับงานที่ต้องการภาพหน่วงต่ำมาก เช่น ตรวจชิ้นงานบนสายพาน`);
  if (s.poe) out.push("จ่ายไฟกล้องผ่านสาย LAN (PoE) ได้ ลดการเดินไฟที่จุดติดตั้งกล้อง");
  if (s.fanless) out.push("ระบายความร้อนแบบไม่มีพัดลม ฝุ่นไม่เข้า อายุการใช้งานยาว เหมาะกับโรงงานและงานกลางแจ้ง");
  if (s.tempMin != null && s.tempMax != null)
    out.push(`ทำงานได้ที่อุณหภูมิ ${s.tempMin}°C ถึง +${s.tempMax}°C ใช้ในตู้ริมถนน โรงงาน หรือห้องเย็นได้`);
  if (s.ipRating) out.push(`มาตรฐานกันฝุ่นกันน้ำ ${s.ipRating} ติดตั้งในพื้นที่เปียก/ฝุ่นจัดได้`);
  if (s.wireless) out.push("รองรับการเชื่อมต่อไร้สาย (Wi-Fi/4G-5G) ส่งผลวิเคราะห์กลับศูนย์ได้แม้ไซต์ไม่มีสาย LAN");
  if (s.pcie) out.push("มีสล็อตขยาย (M.2/PCIe) เพิ่ม SSD เก็บวิดีโอย้อนหลัง หรือการ์ดสื่อสารเพิ่มได้");
  return out;
}

export function EdgeAiSpecGuide({
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
  const c = (category ?? "").toLowerCase();
  if (!EDGE_AI_CATEGORIES.some((k) => c.includes(k))) return null;

  const s = parseEdgeAiSpec(name, description);
  if (!s) return null;

  const work = workloadOf(s.tops);
  const cams = s.tops ? cameraCapacity(s.tops) : null;
  const notes = deploymentNotes(s, category ?? "");

  return (
    <div className={`mt-4 rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-[13px] ${className}`}>
      <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
        <BrainCircuit className="h-4 w-4 text-emerald-700" />
        คำแนะนำจากทีมวิศวกร AI ของ ENT Group
        {s.module && (
          <span className="rounded bg-white px-1.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            {s.module}
          </span>
        )}
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {s.tops != null && (
          <div className="rounded-md bg-white px-3 py-2 ring-1 ring-emerald-100">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <Gauge className="h-3.5 w-3.5" /> พลังประมวลผล AI
            </div>
            <div className="mt-0.5 font-bold text-slate-800">{s.tops} TOPS</div>
            <div className="text-[11px] text-slate-500">
              {s.ramGb ? `หน่วยความจำ ${s.ramGb}GB · ` : ""}ประมวลผลในเครื่อง ไม่ต้องพึ่งคลาวด์
            </div>
          </div>
        )}
        {cams && (
          <div className="rounded-md bg-white px-3 py-2 ring-1 ring-emerald-100">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <Camera className="h-3.5 w-3.5" /> รองรับกล้องพร้อมกัน
            </div>
            <div className="mt-0.5 font-bold text-slate-800">≈ {cams.min}–{cams.max} กล้อง</div>
            <div className="text-[11px] text-slate-500">งานตรวจจับวัตถุ 1080p ~15 fps ต่อกล้อง</div>
          </div>
        )}
        {(s.tempMin != null || s.fanless || s.ipRating) && (
          <div className="rounded-md bg-white px-3 py-2 ring-1 ring-emerald-100">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <Thermometer className="h-3.5 w-3.5" /> ความทนทานหน้างาน
            </div>
            <div className="mt-0.5 font-bold text-slate-800">
              {s.tempMin != null ? `${s.tempMin}°C ถึง +${s.tempMax}°C` : s.ipRating ? s.ipRating : "ไม่มีพัดลม"}
            </div>
            <div className="text-[11px] text-slate-500">
              {s.fanless ? "ดีไซน์ไร้พัดลม ฝุ่นไม่เข้า" : "ออกแบบสำหรับงานเดินเครื่อง 24/7"}
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 rounded-md bg-white px-3 py-2 ring-1 ring-emerald-100">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
          <Cpu className="h-4 w-4 text-emerald-700" /> {work.title}
        </div>
        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-slate-600">
          {work.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-700 hover:underline"
      >
        {open ? "ย่อรายละเอียด" : "ดูวิธีใช้งานจริง จุดติดตั้ง และบริการ Config ให้เบื้องต้น"}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-2 space-y-3 border-l-2 border-emerald-300 pl-3 text-slate-600">
          {notes.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Layers className="h-4 w-4 text-emerald-700" /> รุ่นนี้เอาไปวางหน้างานยังไง
              </div>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <BrainCircuit className="h-4 w-4 text-emerald-700" /> เราติดตั้งและ Config ให้เบื้องต้น
            </div>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              <li>ลง JetPack / CUDA / TensorRT และ DeepStream พร้อมทดสอบให้เห็นภาพจากกล้องจริง</li>
              <li>เชื่อมกล้อง IP หรือกล้องอุตสาหกรรม ตั้งค่าเครือข่าย และตั้งให้ระบบสตาร์ทเองเมื่อไฟดับ-ไฟมา</li>
              <li>ติดตั้งโมเดลตัวอย่าง (นับคน/นับรถ/ตรวจ PPE/อ่านป้ายทะเบียน) ให้เห็นผลลัพธ์ตั้งแต่วันแรก</li>
              <li>สอนทีมของคุณใช้งานและส่งมอบเอกสารการตั้งค่า พร้อมดูแลต่อเนื่องหลังส่งมอบ</li>
            </ul>
            <p className="mt-1 text-[12px] text-slate-500">
              ส่วนที่ว่า “AI ของคุณจะทำอะไร” ขึ้นอยู่กับโจทย์ของคุณ — Computer Vision, Machine Learning
              หรืองาน AI ด้านอื่น เราออกแบบและส่งมอบให้ได้ทั้งโครงการเล็กและใหญ่
            </p>
          </div>

          <div className="rounded-md border border-emerald-200 bg-white px-3 py-2">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
              <Wrench className="h-4 w-4" /> ไม่แน่ใจว่ารุ่นนี้พอกับงานคุณไหม?
            </div>
            <p className="mt-1">
              บอกเราแค่ว่ามีกี่กล้อง อยากให้ AI ตรวจจับอะไร และหน้างานเป็นแบบไหน
              ทีมวิศวกรจะคำนวณรุ่นที่พอดี ไม่ให้จ่ายเกินและไม่ให้เครื่องทำงานไม่ไหว
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
      )}
    </div>
  );
}
