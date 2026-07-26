/**
 * EdgeAiExplainer / EdgeAiBrief — คำอธิบาย "สินค้าตัวนี้คืออะไร ทำอะไรได้ ต้องใช้คู่กับอะไร ทำได้แค่ไหน"
 * สำหรับสินค้ากลุ่ม NVIDIA Jetson / Edge AI ซึ่งเป็นสินค้าใหม่ที่ลูกค้าส่วนใหญ่ยังไม่คุ้นเคย
 */
import { useState } from "react";
import {
  BrainCircuit,
  Info,
  Puzzle,
  CircleCheck,
  TriangleAlert,
  Sparkles,
  Phone,
  Package,
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
import { EDGE_AI_CATEGORIES, parseEdgeAiSpec } from "@/components/edge-ai-spec-guide";

export type EdgeAiKind = "box" | "board" | "kit" | "devsystem" | "module" | "supercomputer";

export type EdgeAiExplain = {
  kind: EdgeAiKind;
  kindLabel: string;
  brief: string;
  what: string;
  canDo: string[];
  pairWith: string[];
  limits: string[];
  tops: number | null;
  module: string | null;
};

function kindOf(category: string): EdgeAiKind {
  const c = category.toLowerCase();
  if (c.includes("carrier")) return "board";
  if (c.includes("developer kit")) return "kit";
  if (c.includes("developer system")) return "devsystem";
  if (c.includes("supercomputer")) return "supercomputer";
  if (c.includes("module")) return "module";
  return "box";
}

/** ระดับงานตามพลังประมวลผล */
function tierOf(tops: number | null): "entry" | "mid" | "high" | "ultra" {
  if (!tops) return "mid";
  if (tops < 15) return "entry";
  if (tops < 80) return "mid";
  if (tops < 300) return "high";
  return "ultra";
}

export function explainEdgeAi(
  category?: string | null,
  name?: string | null,
  description?: string | null,
): EdgeAiExplain | null {
  const c = (category ?? "").toLowerCase();
  if (!EDGE_AI_CATEGORIES.some((k) => c.includes(k))) return null;
  const s = parseEdgeAiSpec(name, description);
  if (!s) return null;

  const kind = kindOf(category ?? "");
  const tier = tierOf(s.tops);
  const mod = s.module ?? "โมดูล NVIDIA Jetson";
  const topsTxt = s.tops ? `${s.tops} TOPS` : "ระดับ Edge";

  const kindLabel = {
    box: "กล่องคอมพิวเตอร์ AI สำเร็จรูป (Edge AI Box)",
    board: "บอร์ดฐาน (Carrier Board)",
    kit: "ชุดพัฒนา (Developer Kit)",
    devsystem: "ชุดระบบพร้อมพัฒนา (Developer System)",
    module: "โมดูลประมวลผล AI (Module)",
    supercomputer: "เดสก์ท็อป AI ประสิทธิภาพสูง",
  }[kind];

  const briefByKind: Record<EdgeAiKind, string> = {
    box: `กล่องคอมพิวเตอร์ AI พร้อมใช้ ใช้ชิป ${mod} (${topsTxt}) วางที่หน้างานเพื่อวิเคราะห์ภาพจากกล้องแบบเรียลไทม์`,
    board: `บอร์ดฐานสำหรับเสียบโมดูล Jetson เพื่อดึงพอร์ตกล้อง/LAN/IO ออกมาใช้งาน — ใช้เดี่ยว ๆ ไม่ได้ ต้องมีโมดูลและเคส`,
    kit: `ชุดพัฒนา ${mod} (${topsTxt}) สำหรับนักพัฒนา ใช้ทดลองเขียนและเทรนโมเดล AI ก่อนขึ้นระบบจริง`,
    devsystem: `ชุดระบบพร้อมพัฒนา ประกอบบอร์ด+โมดูล+เคสมาให้ครบ เสียบไฟแล้วเริ่มพัฒนาได้เลย`,
    module: `โมดูลประมวลผล AI ${mod} (${topsTxt}) เป็นหัวใจของเครื่อง ต้องเสียบบนบอร์ดฐานจึงจะทำงานได้`,
    supercomputer: `เดสก์ท็อป AI สำหรับเทรนและรันโมเดลขนาดใหญ่ในองค์กร โดยข้อมูลไม่ต้องออกไปคลาวด์`,
  };

  const what = {
    box: `เครื่องนี้คือคอมพิวเตอร์ขนาดเล็กที่ "คิดเองได้" ติดตั้งไว้ใกล้กล้องหรือเครื่องจักร รับภาพ/สัญญาณเข้ามาแล้วประมวลผลด้วย AI ในตัวทันที ไม่ต้องส่งข้อมูลขึ้นคลาวด์ จึงตอบสนองเร็วระดับเสี้ยววินาที ประหยัดค่าอินเทอร์เน็ต และข้อมูลไม่ออกนอกองค์กร`,
    board: `Carrier Board คือแผงวงจรฐานที่ทำหน้าที่ "แปลง" โมดูล Jetson ให้ใช้งานได้จริง โดยดึงพอร์ต LAN, USB, HDMI, กล้อง MIPI CSI, GPIO และแหล่งจ่ายไฟออกมา เหมาะกับผู้ผลิตหรือทีมวิศวกรที่ต้องการออกแบบเครื่องเป็นของตัวเอง`,
    kit: `Developer Kit คือชุดอุปกรณ์ครบชุดจาก NVIDIA สำหรับเรียนรู้และพัฒนา — มีทั้งโมดูล บอร์ด และอะแดปเตอร์ ใช้ลง JetPack แล้วเริ่มเขียนโปรแกรม AI ได้ทันที นิยมใช้ทำต้นแบบ (PoC) ก่อนสั่งผลิตจริง`,
    devsystem: `Developer System คือชุดที่ประกอบบอร์ดฐาน โมดูล และเคสมาให้เรียบร้อย เหมาะกับทีมที่อยากเริ่มพัฒนาบนฮาร์ดแวร์ที่ใกล้เคียงเครื่องจริงมากที่สุด แล้วย้ายโปรแกรมไปลงเครื่องที่ผลิตจริงได้ทันที`,
    module: `Module คือชิ้นส่วนสมองกลของระบบ ประกอบด้วย GPU, CPU, RAM และหน่วยความจำในแผ่นเดียว ผู้ผลิตจะนำไปเสียบบนบอร์ดฐานเพื่อประกอบเป็นเครื่องตามการใช้งาน`,
    supercomputer: `เครื่องระดับเดสก์ท็อปที่ให้พลังประมวลผลใกล้เคียงเซิร์ฟเวอร์ AI ใช้เทรนโมเดล ปรับจูน (Fine-tune) และรันโมเดลภาษาขนาดใหญ่ในองค์กรได้ด้วยตัวเอง`,
  }[kind];

  const canDoByTier: Record<ReturnType<typeof tierOf>, string[]> = {
    entry: [
      "นับคน / นับรถ เข้า-ออก ได้ประมาณ 1–2 กล้อง",
      "ตรวจจับความเคลื่อนไหว อ่านบาร์โค้ด/QR",
      "เป็น IoT Gateway เก็บค่าจากเซ็นเซอร์ส่งขึ้นระบบกลาง",
      "เหมาะกับงานต้นแบบ งานสอน และงานจุดเดียว",
    ],
    mid: [
      "ตรวจจับคน/รถ/สิ่งของแบบเรียลไทม์ได้หลายกล้องพร้อมกัน",
      "ตรวจ PPE (หมวกนิรภัย เสื้อสะท้อนแสง) และการล้ำเขตอันตราย",
      "อ่านป้ายทะเบียนรถ (LPR) เปิดไม้กั้นอัตโนมัติ",
      "ตรวจตำหนิชิ้นงานบนสายพานความเร็วปานกลาง",
    ],
    high: [
      "รัน Video Analytics หลายสิบสตรีมพร้อมกันด้วย DeepStream",
      "จดจำใบหน้า วิเคราะห์พฤติกรรมเสี่ยง ทำ Heat Map ในร้าน",
      "ควบคุมหุ่นยนต์เคลื่อนที่อัตโนมัติ (AMR/AGV)",
      "งานตรวจสอบด้วยภาพความเร็วสูงในสายการผลิต",
    ],
    ultra: [
      "รันโมเดลภาษาขนาดใหญ่ (LLM) และ Vision-Language Model ภายในองค์กร",
      "งานหุ่นยนต์ขั้นสูง / Physical AI ที่ต้องตอบสนองระดับมิลลิวินาที",
      "เทรนและปรับจูนโมเดลเองโดยไม่ต้องเช่า GPU บนคลาวด์",
      "เป็นศูนย์ประมวลผล AI ย่อยประจำโรงงาน โรงพยาบาล หรือหน่วยงานวิจัย",
    ],
  };

  const canDo = [...canDoByTier[tier]];
  if (s.csi) canDo.push(`ต่อกล้อง MIPI CSI ได้ ${s.csi} ตัว สำหรับงานที่ต้องการภาพหน่วงต่ำมาก`);
  if (s.lan && s.lan > 1) canDo.push(`มี LAN ${s.lan} พอร์ต แยกวงกล้องออกจากวงออฟฟิศได้`);

  const pairWithBase: Record<EdgeAiKind, string[]> = {
    box: [
      "กล้อง IP (ONVIF/RTSP) เช่น HIKVISION หรือ Dahua — เป็นตาให้ระบบ AI",
      "สวิตช์ PoE สำหรับจ่ายไฟและเชื่อมกล้องหลายตัว",
      "SSD M.2 หรือ NVR ถ้าต้องการเก็บวิดีโอย้อนหลัง",
      "UPS เพื่อให้ระบบไม่ดับกลางคันเวลาไฟตก",
    ],
    board: [
      "โมดูล NVIDIA Jetson ที่รองรับ (เช่น Orin Nano / Orin NX / AGX Orin) — จำเป็นต้องมี",
      "เคสโลหะและชุดระบายความร้อน",
      "อะแดปเตอร์จ่ายไฟตามสเปกบอร์ด และสาย I/O ตามการใช้งาน",
      "กล้อง MIPI CSI หรือกล้อง USB/IP ตามงาน",
    ],
    kit: [
      "การ์ด microSD หรือ SSD NVMe สำหรับติดตั้งระบบปฏิบัติการ",
      "จอ HDMI, คีย์บอร์ด, เมาส์ สำหรับตั้งค่าครั้งแรก",
      "กล้อง USB / CSI / กล้อง IP เพื่อทดสอบโมเดล Computer Vision",
    ],
    devsystem: [
      "กล้องที่จะใช้งานจริง (IP หรือ CSI) เพื่อทดสอบให้ตรงกับหน้างาน",
      "SSD เพิ่มเติมสำหรับเก็บชุดข้อมูลและวิดีโอทดสอบ",
      "สวิตช์เครือข่าย/PoE ในกรณีทดสอบหลายกล้อง",
    ],
    module: [
      "Carrier Board ที่รองรับโมดูลรุ่นนี้ — ขาดไม่ได้ เพราะโมดูลใช้เดี่ยว ๆ ไม่ได้",
      "ชุดฮีตซิงก์/พัดลมตามสเปกของโมดูล",
      "เคสและแหล่งจ่ายไฟที่ออกแบบมาให้พอดีกัน",
    ],
    supercomputer: [
      "จอภาพและอุปกรณ์ต่อพ่วงสำหรับใช้งานแบบเดสก์ท็อป",
      "เครือข่ายความเร็วสูงหากต้องดึงข้อมูลจากเซิร์ฟเวอร์ภายใน",
      "พื้นที่เก็บข้อมูลเพิ่มเติมสำหรับชุดข้อมูลเทรนโมเดล",
    ],
  };
  const pairWith = [...pairWithBase[kind]];
  if (s.poe) pairWith.push("รองรับจ่ายไฟกล้องผ่านสาย LAN (PoE) จึงลดอุปกรณ์เสริมลงได้");

  const limits: string[] = [];
  if (kind === "module") limits.push("ใช้งานเดี่ยวไม่ได้ ต้องเสียบบนบอร์ดฐานที่รองรับเท่านั้น");
  if (kind === "board") limits.push("ในกล่องไม่มีโมดูล Jetson และไม่มีเคส/อะแดปเตอร์ ต้องสั่งเพิ่ม");
  if (kind === "kit") limits.push("เป็นชุดสำหรับพัฒนา ไม่ได้ออกแบบมาให้เดินเครื่อง 24/7 ในโรงงาน ควรย้ายขึ้น Edge AI Box เมื่อใช้งานจริง");
  if (s.tops) {
    const est = Math.max(1, Math.round(s.tops / 4));
    limits.push(`รองรับงานตรวจจับวัตถุ 1080p ราว ${est} กล้องต่อเครื่อง — ถ้าโมเดลซับซ้อนหรือความละเอียดสูงขึ้น จำนวนกล้องจะลดลง`);
  }
  limits.push("เครื่องไม่ได้ “ฉลาด” มาจากโรงงาน ต้องเลือกและติดตั้งโมเดล AI ให้ตรงกับโจทย์ก่อนใช้งาน — ส่วนนี้ทีมเราทำให้ได้");
  if (s.tempMin == null && kind === "box") limits.push("ควรติดตั้งในตู้ที่มีการระบายอากาศ หลีกเลี่ยงแดดส่องตรงและความชื้นสูง");

  return {
    kind,
    kindLabel,
    brief: briefByKind[kind],
    what,
    canDo,
    pairWith,
    limits,
    tops: s.tops,
    module: s.module,
  };
}

function Body({ x }: { x: EdgeAiExplain }) {
  return (
    <div className="space-y-3 text-[13px] leading-relaxed text-slate-600">
      <div>
        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
          <Info className="h-4 w-4 text-emerald-700" /> สินค้านี้คืออะไร
        </div>
        <p className="mt-1">{x.what}</p>
      </div>

      <div>
        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
          <CircleCheck className="h-4 w-4 text-emerald-700" /> ทำอะไรได้บ้าง
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
          <TriangleAlert className="h-4 w-4 text-amber-600" /> ทำได้แค่ไหน (ข้อจำกัดที่ควรรู้ก่อนซื้อ)
        </div>
        <ul className="mt-1 list-disc space-y-1 pl-4">
          {x.limits.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
        <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
          <Sparkles className="h-4 w-4" /> เราติดตั้งและ Config ให้เบื้องต้น
        </div>
        <p className="mt-1">
          ลง JetPack / CUDA / TensorRT / DeepStream เชื่อมกล้องและเครือข่าย ติดตั้งโมเดลตัวอย่างให้เห็นผลตั้งแต่วันแรก
          พร้อมสอนทีมของคุณใช้งาน — ส่วนที่ว่า AI จะทำอะไร คุณเลือกได้ เราออกแบบและส่งมอบให้
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

/** เวอร์ชันย่อบนการ์ดสินค้า: คำอธิบายสั้น + กดดูรายละเอียดเพิ่มเติม */
export function EdgeAiBrief({
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
  const x = explainEdgeAi(category, name, description);
  if (!x) return null;

  return (
    <div className={`mt-1.5 ${className}`} onClick={(e) => e.stopPropagation()}>
      <div className="rounded-md bg-emerald-50 px-2 py-1.5 text-[11px] leading-snug text-emerald-900 ring-1 ring-emerald-100">
        <span className="mr-1 inline-flex items-center gap-1 font-semibold">
          <BrainCircuit className="h-3 w-3" />
          {x.kindLabel}
        </span>
        <span className="line-clamp-2 text-emerald-800/90">{x.brief}</span>
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
            <Info className="h-3 w-3" /> สินค้านี้คืออะไร ทำอะไรได้?
          </button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <BrainCircuit className="h-4 w-4 text-emerald-700" /> {name}
            </DialogTitle>
            <DialogDescription>
              {x.kindLabel}
              {x.module ? ` · ${x.module}` : ""}
              {x.tops ? ` · ${x.tops} TOPS` : ""}
            </DialogDescription>
          </DialogHeader>
          <Body x={x} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** เวอร์ชันเต็มบนหน้ารายละเอียดสินค้า */
export function EdgeAiExplainer({
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
  const x = explainEdgeAi(category, name, description);
  if (!x) return null;

  return (
    <section
      className={`mt-6 rounded-lg border border-emerald-200 bg-white p-4 ${className}`}
      aria-label="ทำความรู้จักสินค้า Edge AI รุ่นนี้"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white">
          <Package className="h-3.5 w-3.5" /> {x.kindLabel}
        </span>
        {x.module && (
          <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            {x.module}
          </span>
        )}
        {x.tops && (
          <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            {x.tops} TOPS
          </span>
        )}
      </div>
      <p className="mb-3 text-sm font-medium text-slate-800">{x.brief}</p>
      <Body x={x} />
    </section>
  );
}
