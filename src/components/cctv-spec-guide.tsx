/**
 * CctvSpecGuide — คำอธิบายเชิงผู้เชี่ยวชาญรายรุ่นสำหรับสินค้าหมวด CCTV
 * วิเคราะห์จากชื่อรุ่น/สเปก (เลนส์ มม., ความละเอียด MP, ระยะ IR, PoE, IP rating, PTZ)
 * แล้วแปลงเป็นคำแนะนำ "มุมมอง–ระยะ–จุดติดตั้ง" ตามหลัก DORI
 */
import { useState } from "react";
import { Cctv, ChevronDown, Ruler, ScanEye, Moon, ArrowUpFromLine, Phone, Wrench, Camera } from "lucide-react";
import { LineQrDialog } from "@/components/line-qr-dialog";

export type CctvSpec = {
  brandLine: string | null;
  mp: number | null;
  lensMin: number | null;
  lensMax: number | null;
  fov: string | null;
  ir: number | null;
  colorNight: boolean;
  ai: boolean;
  ptz: boolean;
  zoomX: number | null;
  poe: boolean;
  ipRating: string | null;
  form: "dome" | "bullet" | "turret" | "ptz" | "other";
};

/** มุมมองแนวนอนโดยประมาณของเลนส์ (เซ็นเซอร์ 1/2.8") */
function fovOf(mm: number): number {
  const table: [number, number][] = [
    [2.0, 130],
    [2.8, 105],
    [3.6, 88],
    [4.0, 84],
    [6.0, 55],
    [8.0, 42],
    [12.0, 28],
    [16.0, 21],
    [25.0, 14],
  ];
  if (mm <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    const [m1, a1] = table[i - 1];
    const [m2, a2] = table[i];
    if (mm <= m2) return Math.round(a1 + ((mm - m1) / (m2 - m1)) * (a2 - a1));
  }
  return table[table.length - 1][1];
}

/**
 * ระยะตามหลัก DORI (EN 62676-4) โดยประมาณ
 * ใช้ความหนาแน่นพิกเซล: Detect 25px/m, Observe 62px/m, Recognize 125px/m, Identify 250px/m
 */
export function doriOf(mp: number, mm: number) {
  const widthPx = mp >= 7 ? 3840 : mp >= 5 ? 2880 : mp >= 4 ? 2560 : mp >= 3 ? 2304 : 1920;
  const fovRad = (fovOf(mm) * Math.PI) / 180;
  // ความกว้างของภาพ ณ ระยะ d (เมตร) = 2 * d * tan(fov/2)
  const at = (pxPerM: number) => {
    const widthAtTarget = widthPx / pxPerM; // เมตร
    return widthAtTarget / (2 * Math.tan(fovRad / 2));
  };
  return {
    detect: Math.round(at(25)),
    observe: Math.round(at(62)),
    recognize: Math.round(at(125)),
    identify: Math.round(at(250)),
  };
}

export function parseCctvSpec(name?: string | null, description?: string | null): CctvSpec | null {
  const raw = `${name ?? ""} ${description ?? ""}`;
  const t = raw.toLowerCase();
  if (!t.trim()) return null;

  const mpM = t.match(/(\d(?:\.\d)?)\s*(?:mp|ล้านพิกเซล|megapixel)/);
  let mp = mpM ? Number(mpM[1]) : null;
  if (!mp && /\b4k\b|8\s*mp/.test(t)) mp = 8;
  if (!mp && /1080p|full\s*hd/.test(t)) mp = 2;

  const lensRange = t.match(/(\d{1,2}(?:\.\d)?)\s*-\s*(\d{1,2}(?:\.\d)?)\s*mm/);
  const lensOne = t.match(/(\d{1,2}(?:\.\d)?)\s*mm/);
  const lensMin = lensRange ? Number(lensRange[1]) : lensOne ? Number(lensOne[1]) : null;
  const lensMax = lensRange ? Number(lensRange[2]) : null;

  const irM = t.match(/(?:ir|infrared|อินฟราเรด)[^\d]{0,8}(\d{2,3})\s*m/) ?? t.match(/(\d{2,3})\s*m\s*ir/);
  const ir = irM ? Number(irM[1]) : null;

  const zoomM = t.match(/(\d{1,2})\s*x\s*(?:optical\s*)?zoom/);

  const ptz = /\bptz\b|speed\s*dome|pan.?tilt/.test(t);
  const form: CctvSpec["form"] = ptz
    ? "ptz"
    : /turret|eyeball/.test(t)
      ? "turret"
      : /dome|โดม|dh-ipc-hdbw|ds-2cd11|ds-2cd21\d\d.*\(?d\)?/.test(t)
        ? "dome"
        : /bullet|กระบอก|hfw|ds-2cd2t/.test(t)
          ? "bullet"
          : "other";

  const brandLine = /hikvision|ds-2cd|ds-7|colorvu|acusense/.test(t)
    ? "HIKVISION"
    : /dahua|dh-|ipc-h|wizsense|wizcolor/.test(t)
      ? "DAHUA"
      : null;

  return {
    brandLine,
    mp,
    lensMin,
    lensMax,
    fov: lensMin ? (lensMax ? `${fovOf(lensMax)}°–${fovOf(lensMin)}°` : `≈ ${fovOf(lensMin)}°`) : null,
    ir,
    colorNight: /colorvu|wizcolor|full.?color|dual.?light|smart\s*dual/.test(t),
    ai: /acusense|wizsense|smart\s*motion|human.*vehicle|ai\b/.test(t),
    ptz,
    zoomX: zoomM ? Number(zoomM[1]) : null,
    poe: /\bpoe\b|802\.3af|802\.3at/.test(t),
    ipRating: t.match(/ip6[67]/)?.[0]?.toUpperCase() ?? null,
    form,
  };
}

function placementOf(s: CctvSpec): string[] {
  const out: string[] = [];
  const mm = s.lensMin ?? 0;
  if (s.ptz) {
    out.push("ติดที่มุมอาคารหรือเสาสูง 4–6 เมตร ให้กวาดเห็นลานกว้างหรือทางเข้า–ออกได้ทั้งหมด");
    out.push("ตั้ง Preset/Patrol ไปยังจุดสำคัญ และควรมีกล้องนิ่งคุมจุดเข้า–ออกคู่กัน เพราะขณะ PTZ หันไปทางอื่นจะไม่มีภาพจุดนั้น");
  } else if (mm && mm <= 3.0) {
    out.push("เลนส์มุมกว้าง เหมาะกับ 'ภาพรวมพื้นที่' เช่น ห้องโถง เคาน์เตอร์ ลานจอดรถขนาดเล็ก");
    out.push("ติดสูง 2.5–3 เมตร ก้มลง 10–15 องศา ให้เป้าหมายเดินเข้าหาในระยะไม่เกิน 8–10 เมตร");
  } else if (mm && mm <= 4.5) {
    out.push("เลนส์สมดุล เห็นทั้งภาพรวมและใบหน้า เหมาะกับหน้าประตู ทางเดิน หน้าร้าน");
    out.push("ติดสูง 3–3.5 เมตร วางแนวขวางทางเดิน จับใบหน้าได้ดีในช่วง 4–12 เมตร");
  } else if (mm && mm <= 8) {
    out.push("เลนส์มุมแคบลง เน้นระยะไกล เหมาะกับรั้วยาว ถนนหน้าโครงการ ทางเข้าออกรถ");
    out.push("ติดสูง 3.5–4.5 เมตร เล็งไปตามแนวยาว ไม่ควรใช้คุมพื้นที่กว้างด้านข้าง");
  } else if (mm) {
    out.push("เลนส์เทเลระยะไกล เหมาะกับงานเฉพาะจุด เช่น อ่านป้ายทะเบียนที่ปากทางเข้า หรือมองข้ามลานกว้าง");
    out.push("ต้องยึดกล้องให้แน่นมาก เพราะการสั่นเพียงเล็กน้อยเห็นชัดในภาพระยะไกล");
  }
  if (s.form === "dome") out.push("ทรงโดมเหมาะติดฝ้าภายในอาคาร ดูเรียบร้อยและถูกงัดยาก");
  if (s.form === "bullet") out.push("ทรงกระบอกเหมาะติดผนัง/ใต้ชายคาภายนอก เห็นชัดว่ามีกล้อง ช่วยป้องปราม");
  if (s.form === "turret") out.push("ทรงเทอร์เร็ต (Eyeball) ปรับมุมง่าย และแสงสะท้อนในโดมน้อยกว่า จึงให้ภาพกลางคืนสะอาดกว่าโดม");
  if (s.ir) out.push(`ไฟ IR ระยะ ${s.ir} เมตรคือระยะ "เห็นความเคลื่อนไหว" ระยะที่จำหน้าได้จริงมักอยู่ราวครึ่งหนึ่ง — ${Math.round(s.ir / 2)} เมตร`);
  if (s.colorNight) out.push("รองรับภาพสีกลางคืน เก็บสีเสื้อ/สีรถได้ ซึ่งเป็นหลักฐานที่ภาพขาวดำให้ไม่ได้");
  if (s.ai) out.push("มี AI แยกคน/ยานพาหนะ ตั้งเส้นกันล้ำและพื้นที่หวงห้ามได้ ลดการแจ้งเตือนหลอกจากสัตว์และใบไม้");
  if (s.poe) out.push("จ่ายไฟผ่านสาย LAN (PoE) เดินสายเส้นเดียวถึงกล้อง ไม่ต้องหาปลั๊กที่จุดติดตั้ง");
  if (s.ipRating) out.push(`มาตรฐานกันน้ำกันฝุ่น ${s.ipRating} ติดตั้งภายนอกอาคารได้`);
  return out;
}

export function CctvSpecGuide({
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
  if (!(c.includes("cctv") || c.includes("security"))) return null;
  const s = parseCctvSpec(name, description);
  if (!s) return null;

  const mm = s.lensMin;
  const mp = s.mp;
  const dori = mm && mp ? doriOf(mp, mm) : null;
  const points = placementOf(s);
  if (!points.length && !dori) return null;

  return (
    <div className={`mt-4 rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-[13px] ${className}`}>
      <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
        <Cctv className="h-4 w-4 text-emerald-700" />
        คำแนะนำจากทีมช่างกล้องวงจรปิด ENT Group
        {s.brandLine && (
          <span className="rounded bg-white px-1.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            {s.brandLine}
          </span>
        )}
      </div>

      {/* สรุปสเปกเชิงมุมมอง */}
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {s.fov && (
          <div className="rounded-md bg-white px-3 py-2 ring-1 ring-emerald-100">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <ScanEye className="h-3.5 w-3.5" /> มุมมองภาพ
            </div>
            <div className="mt-0.5 font-bold text-slate-800">{s.fov}</div>
            <div className="text-[11px] text-slate-500">
              เลนส์ {s.lensMax ? `${s.lensMin}–${s.lensMax}` : s.lensMin} มม.
              {s.lensMax ? " (ปรับได้)" : ""}
            </div>
          </div>
        )}
        {dori && (
          <div className="rounded-md bg-white px-3 py-2 ring-1 ring-emerald-100">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <Ruler className="h-3.5 w-3.5" /> ระยะจำหน้าคนได้
            </div>
            <div className="mt-0.5 font-bold text-slate-800">≈ {dori.recognize} เมตร</div>
            <div className="text-[11px] text-slate-500">อ่านป้ายทะเบียน/ระบุตัวตน ≈ {dori.identify} ม.</div>
          </div>
        )}
        {(s.ir || s.colorNight) && (
          <div className="rounded-md bg-white px-3 py-2 ring-1 ring-emerald-100">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <Moon className="h-3.5 w-3.5" /> กลางคืน
            </div>
            <div className="mt-0.5 font-bold text-slate-800">
              {s.colorNight ? "ภาพสี 24 ชม." : `IR ${s.ir} เมตร`}
            </div>
            <div className="text-[11px] text-slate-500">
              {s.colorNight ? "เก็บสีเสื้อ/สีรถได้ตอนกลางคืน" : "ภาพขาวดำเมื่อไม่มีแสง"}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-700 hover:underline"
      >
        {open ? "ย่อคำแนะนำการติดตั้ง" : "ดูหลักการเลือกมุม/ระยะ และจุดติดตั้งที่เหมาะสม"}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-2 space-y-3 border-l-2 border-emerald-300 pl-3 text-slate-600">
          {dori && (
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Camera className="h-4 w-4 text-emerald-700" /> ระยะใช้งานตามหลัก DORI (มาตรฐาน EN 62676-4)
              </div>
              <ul className="mt-1 space-y-0.5">
                <li>• เห็นว่ามีคน/มีของเคลื่อนไหว (Detect): ไกลถึง ~{dori.detect} เมตร</li>
                <li>• สังเกตพฤติกรรมได้ (Observe): ~{dori.observe} เมตร</li>
                <li>• จำได้ว่าเป็นคนที่รู้จัก (Recognize): ~{dori.recognize} เมตร</li>
                <li>• ระบุตัวตน/อ่านป้ายทะเบียน (Identify): ~{dori.identify} เมตร</li>
              </ul>
              <p className="mt-1 text-[12px] text-slate-500">
                ตัวเลขคำนวณจากความละเอียด {mp} MP กับเลนส์ {mm} มม. เป็นค่าประมาณในสภาพแสงดี
                หน้างานจริงขึ้นกับแสง มุมก้ม และทิศทางการเดินของเป้าหมาย
              </p>
            </div>
          )}

          {points.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <ArrowUpFromLine className="h-4 w-4 text-emerald-700" /> จุดติดตั้งและมุมที่แนะนำ
              </div>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-md border border-emerald-200 bg-white px-3 py-2">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
              <Wrench className="h-4 w-4" /> ไม่แน่ใจว่ารุ่นนี้เหมาะกับหน้างานคุณหรือไม่?
            </div>
            <p className="mt-1">
              ส่งผังพื้นที่หรือรูปหน้างานมาให้เราดูได้เลย ทีมช่างของ ENT Group จะคำนวณจำนวนกล้าง
              จุดติดตั้ง มุมกล้อง ขนาดฮาร์ดดิสก์ และเสนอราคาพร้อมค่าติดตั้งให้ครบในใบเดียว
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
