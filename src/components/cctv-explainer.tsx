/**
 * CctvExplainer / CctvBrief — คำอธิบายสินค้าหมวด CCTV & Security
 * "อุปกรณ์ตัวนี้คืออะไร ทำงานยังไง ใช้งานอะไรได้ ต้องใช้ร่วมกับอะไร สิ่งที่ต้องคำนึงในการเลือก ข้อจำกัด"
 */
import { useState } from "react";
import {
  Cctv,
  Info,
  Puzzle,
  CircleCheck,
  TriangleAlert,
  Sparkles,
  Phone,
  ScanEye,
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
import { parseCctvSpec, doriOf, type CctvSpec } from "@/components/cctv-spec-guide";

export const CCTV_CATEGORIES = ["cctv", "security"];

export type CctvKind =
  | "camera"
  | "ptz"
  | "recorder"
  | "switch"
  | "storage"
  | "monitor"
  | "alarm"
  | "accessory";

export type CctvExplain = {
  kind: CctvKind;
  kindLabel: string;
  useLabel: string;
  brief: string;
  what: string;
  howItWorks: string[];
  canDo: string[];
  pairWith: string[];
  choosing: string[];
  limits: string[];
  spec: CctvSpec | null;
};

function kindOf(name?: string | null, description?: string | null, spec?: CctvSpec | null): CctvKind {
  const s = `${name ?? ""} ${description ?? ""}`.toLowerCase();
  if (/(nvr|dvr|xvr|เครื่องบันทึก|recorder)/.test(s)) return "recorder";
  if (/(switch|สวิตช์|สวิทช์)/.test(s)) return "switch";
  if (/(hdd|harddisk|hard disk|purple|skyhawk|surveillance drive|ssd|micro\s*sd)/.test(s)) return "storage";
  if (/(monitor|จอ|display)/.test(s)) return "monitor";
  if (/(alarm|กันขโมย|sensor|เซ็นเซอร์|siren|ax\s*pro|door\s*contact|pir)/.test(s)) return "alarm";
  if (spec?.ptz) return "ptz";
  if (/(camera|กล้อง|ipc|ds-2cd|dome|bullet|turret|colorvu|wizsense)/.test(s)) return "camera";
  if (/(mount|bracket|adapter|power supply|สาย|cable|junction|ขายึด|อะแดปเตอร์)/.test(s)) return "accessory";
  return "accessory";
}

function useLabelOf(kind: CctvKind, s: CctvSpec | null): string {
  if (kind === "ptz") return "พื้นที่กว้าง ลานจอดรถ โรงงาน";
  if (kind === "camera") {
    const mm = s?.lensMin ?? 0;
    if (mm && mm <= 3.0) return "ภาพรวมพื้นที่ / ห้องโถง–หน้าร้าน";
    if (mm && mm <= 4.5) return "ทางเข้า–ออก / ทางเดิน จับใบหน้าได้";
    if (mm) return "แนวรั้ว ถนน ระยะไกล";
    return "งานเฝ้าระวังทั่วไป";
  }
  if (kind === "recorder") return "ศูนย์กลางบันทึกภาพของระบบ";
  if (kind === "switch") return "จ่ายไฟ+เชื่อมกล้องหลายตัว";
  if (kind === "storage") return "เก็บวิดีโอย้อนหลัง 24/7";
  if (kind === "monitor") return "จอดูภาพสด/ย้อนหลัง";
  if (kind === "alarm") return "ระบบแจ้งเตือนผู้บุกรุก";
  return "อุปกรณ์เสริมของระบบ CCTV";
}

export function explainCctv(
  category?: string | null,
  name?: string | null,
  description?: string | null,
): CctvExplain | null {
  const c = (category ?? "").toLowerCase();
  if (!CCTV_CATEGORIES.some((k) => c.includes(k))) return null;

  const spec = parseCctvSpec(name, description);
  const kind = kindOf(name, description, spec);
  const s = `${name ?? ""} ${description ?? ""}`.toLowerCase();
  const chM = s.match(/(\d{1,2})\s*(?:ch|channel|ช่อง)/);
  const ch = chM ? Number(chM[1]) : null;
  const portM = s.match(/(\d{1,2})\s*(?:port|พอร์ต)/);
  const ports = portM ? Number(portM[1]) : null;
  const tbM = s.match(/(\d{1,2})\s*tb/);
  const tb = tbM ? Number(tbM[1]) : null;

  const kindLabel: Record<CctvKind, string> = {
    camera: "กล้องวงจรปิด IP (กล้องนิ่ง)",
    ptz: "กล้อง PTZ หมุน–ก้ม–ซูมได้",
    recorder: `เครื่องบันทึกภาพ${ch ? ` ${ch} ช่อง` : ""}`,
    switch: `สวิตช์ PoE${ports ? ` ${ports} พอร์ต` : ""}`,
    storage: `ฮาร์ดดิสก์สำหรับกล้องวงจรปิด${tb ? ` ${tb}TB` : ""}`,
    monitor: "จอมอนิเตอร์สำหรับระบบ CCTV",
    alarm: "อุปกรณ์ระบบแจ้งเตือน/กันขโมย",
    accessory: "อุปกรณ์เสริมระบบ CCTV",
  };

  const mp = spec?.mp ?? null;
  const mm = spec?.lensMin ?? null;
  const dori = mp && mm ? doriOf(mp, mm) : null;

  const briefByKind: Record<CctvKind, string> = {
    camera: `กล้อง IP ${mp ? `${mp}MP ` : ""}${mm ? `เลนส์ ${mm}mm ` : ""}ต่อสาย LAN เส้นเดียว${spec?.poe ? " (จ่ายไฟ PoE ในตัว)" : ""} ส่งภาพเข้าเครื่องบันทึกและดูผ่านมือถือได้`,
    ptz: `กล้องหมุนได้รอบทิศ${spec?.zoomX ? ` ซูม ${spec.zoomX} เท่า` : ""} ใช้กวาดดูพื้นที่กว้าง แล้วซูมเข้าไปดูรายละเอียดจุดที่สนใจ`,
    recorder: `เครื่องบันทึกภาพ${ch ? ` ${ch} ช่อง` : ""} เป็นศูนย์กลางของระบบ เก็บวิดีโอ ค้นย้อนหลัง และเปิดให้ดูผ่านแอปมือถือ`,
    switch: `สวิตช์จ่ายไฟผ่านสาย LAN (PoE)${ports ? ` ${ports} พอร์ต` : ""} เชื่อมกล้องหลายตัวเข้าระบบด้วยสายเส้นเดียวต่อกล้อง`,
    storage: `ฮาร์ดดิสก์รุ่นสำหรับกล้องวงจรปิดโดยเฉพาะ ออกแบบให้เขียนข้อมูลต่อเนื่อง 24 ชั่วโมงทุกวัน`,
    monitor: `จอสำหรับต่อกับเครื่องบันทึก เพื่อดูภาพสดหลายกล้องพร้อมกันและเปิดดูย้อนหลัง`,
    alarm: `อุปกรณ์ตรวจจับและแจ้งเตือนผู้บุกรุก ทำงานร่วมกับกล้องเพื่อยืนยันเหตุการณ์`,
    accessory: `อุปกรณ์เสริมที่ช่วยให้การติดตั้งระบบกล้องเรียบร้อย ปลอดภัย และใช้งานได้เต็มประสิทธิภาพ`,
  };

  const what: Record<CctvKind, string> = {
    camera: `กล้อง IP คือกล้องที่แปลงภาพเป็นข้อมูลดิจิทัลแล้วส่งผ่านสายเครือข่าย (LAN) ไปยังเครื่องบันทึก ต่างจากกล้องอนาล็อกตรงที่ให้ความละเอียดสูงกว่ามาก ตั้งค่ากฎการแจ้งเตือนในตัวกล้องได้ และเดินสายเพียงเส้นเดียวก็ได้ทั้งภาพและไฟเลี้ยง (เมื่อรองรับ PoE)`,
    ptz: `กล้อง PTZ (Pan–Tilt–Zoom) มีมอเตอร์หมุนซ้าย–ขวา ก้ม–เงย และเลนส์ซูมออปติคอล จึงใช้กล้องตัวเดียวคุมพื้นที่กว้างได้ สั่งงานด้วยเมาส์/แอป ตั้งจุด Preset ที่ใช้บ่อย หรือให้กล้องกวาดอัตโนมัติ (Patrol) และบางรุ่นติดตามวัตถุที่เคลื่อนไหวได้เอง`,
    recorder: `NVR/DVR คือคอมพิวเตอร์เฉพาะทางที่รับภาพจากกล้องทุกตัวมาบันทึกลงฮาร์ดดิสก์ พร้อมทำหน้าที่จัดการผู้ใช้ ตั้งตารางบันทึก ค้นหาเหตุการณ์ย้อนหลัง และเปิดช่องทางให้ดูผ่านมือถือ ถือเป็น "หัวใจ" ของระบบ — ถ้าเครื่องนี้ไม่ทำงาน กล้องทั้งระบบก็ไม่มีการบันทึก`,
    switch: `PoE Switch คืออุปกรณ์กระจายเครือข่ายที่จ่ายไฟฟ้าไปตามสาย LAN ได้ด้วย ทำให้ติดตั้งกล้องในจุดที่ไม่มีปลั๊กไฟได้ ลดงานเดินสายไฟและทำให้สำรองไฟทั้งระบบผ่าน UPS ตัวเดียวได้`,
    storage: `ฮาร์ดดิสก์สาย Surveillance (เช่น WD Purple / Seagate SkyHawk) ต่างจากฮาร์ดดิสก์คอมทั่วไปตรงที่ออกแบบมาให้เขียนข้อมูลตลอดเวลา ทนความร้อนและการสั่นสะเทือนจากการทำงานต่อเนื่อง และรองรับการเขียนหลายสตรีมพร้อมกัน`,
    monitor: `จอสำหรับห้องควบคุมหรือจุดเฝ้าระวัง ต่อกับเครื่องบันทึกผ่าน HDMI/VGA เน้นการเปิดทิ้งไว้ต่อเนื่องและแสดงหลายช่องพร้อมกันได้ชัดเจน`,
    alarm: `ระบบแจ้งเตือนใช้เซ็นเซอร์ตรวจจับความเคลื่อนไหว การเปิดประตู/หน้าต่าง หรือการล้ำเขต แล้วส่งสัญญาณไปยังศูนย์ควบคุมและมือถือ ใช้คู่กับกล้องเพื่อ "รู้ก่อน" ไม่ใช่แค่ "ดูย้อนหลัง"`,
    accessory: `อุปกรณ์ประกอบการติดตั้ง เช่น ขายึด กล่องกันน้ำ อะแดปเตอร์ หรือชุดจ่ายไฟ ที่ช่วยให้ระบบทำงานเสถียรและทนสภาพหน้างานได้จริง`,
  };

  const howItWorks: string[] = [];
  if (kind === "camera" || kind === "ptz") {
    howItWorks.push("กล้องต่อสาย LAN เข้าสวิตช์ PoE แล้วเข้าเครื่องบันทึก (NVR) — ได้ทั้งภาพและไฟเลี้ยงในสายเส้นเดียว");
    howItWorks.push("NVR บันทึกภาพลงฮาร์ดดิสก์ตามตารางที่ตั้งไว้ และเปิดให้ดูสด/ย้อนหลังผ่านแอปมือถือ");
    if (spec?.ai) howItWorks.push("AI ในกล้องแยกคนกับยานพาหนะออกจากใบไม้ไหวหรือสัตว์ จึงเตือนเฉพาะเหตุการณ์จริง");
    if (spec?.colorNight) howItWorks.push("กลางคืนใช้แสงขาวหรือเซ็นเซอร์ไวแสง ให้ภาพ 'สี' แทนภาพขาวดำ เก็บสีเสื้อ/สีรถเป็นหลักฐานได้");
    else if (spec?.ir) howItWorks.push(`กลางคืนเปิดไฟอินฟราเรดอัตโนมัติ ให้ภาพขาวดำในระยะราว ${spec.ir} เมตร`);
    if (kind === "ptz") howItWorks.push("สั่งหมุน/ซูมจากเครื่องบันทึกหรือแอป และตั้ง Preset–Patrol ให้กวาดจุดสำคัญอัตโนมัติ");
  }
  if (kind === "recorder") {
    howItWorks.push("รับสตรีมภาพจากกล้องทุกตัวผ่านเครือข่าย แล้วเขียนลงฮาร์ดดิสก์ตามตารางหรือเมื่อมีเหตุการณ์");
    howItWorks.push("ค้นย้อนหลังได้ตามเวลา กล้อง หรือประเภทเหตุการณ์ (คน/รถ/ล้ำเส้น) และส่งออกไฟล์เป็นหลักฐานได้");
    howItWorks.push("ลงทะเบียนกับบริการคลาวด์ของแบรนด์ เพื่อดูผ่านมือถือได้โดยไม่ต้องมี IP จริง");
  }
  if (kind === "switch") {
    howItWorks.push("จ่ายไฟมาตรฐาน 802.3af/at ให้กล้องอัตโนมัติเมื่อเสียบสาย LAN");
    howItWorks.push("ควรเลือกงบไฟรวม (PoE Budget) ให้มากกว่าผลรวมกำลังไฟกล้องทุกตัวราว 30%");
  }
  if (kind === "storage") howItWorks.push("ติดตั้งในเครื่องบันทึกแล้วฟอร์แมต ระบบจะเขียนทับข้อมูลเก่าวนไปเมื่อพื้นที่เต็ม");
  if (kind === "alarm") howItWorks.push("เซ็นเซอร์ส่งสัญญาณเข้าแผงควบคุม แล้วแจ้งเตือนไปยังมือถือ/ไซเรน พร้อมเรียกดูภาพจากกล้องจุดนั้นได้ทันที");
  if (!howItWorks.length) howItWorks.push("ทำงานเป็นส่วนหนึ่งของระบบกล้อง–เครือข่าย–เครื่องบันทึก ตามสเปกของอุปกรณ์หลัก");

  const canDo: string[] = [];
  if (kind === "camera" || kind === "ptz") {
    canDo.push("เฝ้าระวังทรัพย์สิน ดูสดผ่านมือถือได้ทุกที่ทุกเวลา");
    canDo.push("เก็บภาพย้อนหลังเป็นหลักฐานกรณีเกิดเหตุ อุบัติเหตุ หรือข้อพิพาท");
    canDo.push("ตั้งแจ้งเตือนเมื่อมีคนเข้าพื้นที่หวงห้ามหรือนอกเวลาทำการ");
    if (dori) {
      canDo.push(`ตรวจจับว่ามีคน (Detect) ได้ไกลราว ${dori.detect} ม. · จำหน้าได้ (Recognize) ราว ${dori.recognize} ม. · ระบุตัวบุคคลชัด (Identify) ราว ${dori.identify} ม.`);
    }
    if (spec?.ai) canDo.push("นับคน/รถ ตั้งเส้นกันล้ำ และลดการแจ้งเตือนหลอกได้");
    if (kind === "ptz") canDo.push("ใช้กล้องตัวเดียวคุมลานกว้าง แล้วซูมอ่านรายละเอียดเฉพาะจุดที่ต้องการ");
  } else if (kind === "recorder") {
    canDo.push(`รองรับกล้องได้${ch ? ` ${ch} ตัว` : "ตามจำนวนช่องของรุ่น"} พร้อมบันทึกต่อเนื่อง 24 ชั่วโมง`);
    canDo.push("ค้นหาเหตุการณ์ย้อนหลังและส่งออกคลิปเป็นหลักฐานให้ประกันหรือเจ้าหน้าที่");
    canDo.push("แบ่งสิทธิ์ผู้ใช้ ให้พนักงานดูได้เฉพาะกล้องที่เกี่ยวข้อง");
  } else if (kind === "switch") {
    canDo.push(`เชื่อมกล้องได้${ports ? ` ถึง ${ports} ตัว` : "หลายตัว"} โดยไม่ต้องหาปลั๊กไฟที่จุดกล้อง`);
    canDo.push("รีสตาร์ตกล้องจากระยะไกลด้วยการตัด–จ่ายไฟที่พอร์ต (รุ่นที่จัดการได้)");
  } else if (kind === "storage") {
    canDo.push("เก็บวิดีโอย้อนหลังได้นานขึ้นตามความจุที่เลือก");
    canDo.push("ทนการเขียนต่อเนื่อง อายุใช้งานยาวกว่าฮาร์ดดิสก์คอมทั่วไปในงานกล้อง");
  } else if (kind === "monitor") {
    canDo.push("แสดงภาพหลายกล้องพร้อมกันในหน้าจอเดียว เหมาะกับจุดรปภ.หรือห้องควบคุม");
  } else if (kind === "alarm") {
    canDo.push("แจ้งเตือนทันทีเมื่อมีการบุกรุก ก่อนเกิดความเสียหาย");
    canDo.push("ตั้งโหมดอยู่บ้าน/ออกนอกบ้าน และสั่งงานผ่านแอปได้");
  } else {
    canDo.push("ช่วยให้การติดตั้งเรียบร้อย ทนหน้างาน และลดปัญหาระยะยาว");
  }

  const pairWithByKind: Record<CctvKind, string[]> = {
    camera: [
      "เครื่องบันทึก NVR ที่มีช่องเพียงพอและรองรับความละเอียดของกล้อง",
      "สวิตช์ PoE หรืออะแดปเตอร์จ่ายไฟ (ถ้าไม่ใช้ PoE)",
      "ฮาร์ดดิสก์สาย Surveillance สำหรับเก็บภาพย้อนหลัง",
      "สาย LAN CAT6 คุณภาพดี และ UPS เพื่อให้ระบบไม่ดับเวลาไฟตก",
    ],
    ptz: [
      "NVR ที่รองรับการควบคุม PTZ และแบนด์วิดท์ที่สูงขึ้น",
      "สวิตช์ PoE ที่จ่ายไฟได้พอ (กล้อง PTZ กินไฟมากกว่ากล้องนิ่ง มักต้อง PoE+/802.3at)",
      "กล้องนิ่งคุมจุดเข้า–ออกคู่กัน เพราะขณะ PTZ หันไปทางอื่นจะไม่มีภาพจุดนั้น",
      "เสาหรือขายึดที่แข็งแรงและมั่นคง",
    ],
    recorder: [
      "กล้อง IP ยี่ห้อ/โปรโตคอลที่รองรับ (แนะนำแบรนด์เดียวกันเพื่อใช้ฟีเจอร์ AI ได้เต็ม)",
      "ฮาร์ดดิสก์สาย Surveillance ตามจำนวนวันที่ต้องการเก็บ",
      "จอมอนิเตอร์และเมาส์สำหรับตั้งค่าหน้าเครื่อง",
      "เราเตอร์/อินเทอร์เน็ต หากต้องการดูผ่านมือถือ",
    ],
    switch: [
      "กล้อง IP ที่รองรับ PoE",
      "NVR หรือเราเตอร์สำหรับเชื่อมเข้าระบบ",
      "UPS เพื่อสำรองไฟให้กล้องทั้งชุดพร้อมกัน",
    ],
    storage: ["เครื่องบันทึก NVR/DVR ที่รองรับความจุระดับนี้", "ตรวจสอบจำนวนช่องใส่ฮาร์ดดิสก์ของเครื่องก่อนซื้อ"],
    monitor: ["เครื่องบันทึก NVR/DVR และสาย HDMI", "ขายึดจอสำหรับห้องควบคุม"],
    alarm: ["แผงควบคุม (Hub) รุ่นที่รองรับ", "กล้องในจุดเดียวกันเพื่อยืนยันเหตุการณ์", "แอปบนมือถือของแบรนด์"],
    accessory: ["อุปกรณ์หลักที่ระบุความเข้ากันได้ตามรุ่น"],
  };

  const choosing: string[] = [
    "เริ่มจากโจทย์ก่อน: ต้องการแค่ 'เห็นว่ามีคน' หรือ 'จำหน้า/อ่านทะเบียนได้' เพราะสองอย่างนี้ใช้กล้องคนละแบบ",
    "ระยะสำคัญกว่าจำนวนล้านพิกเซล — เลนส์กว้างเห็นพื้นที่มากแต่หน้าคนเล็ก เลนส์แคบเห็นชัดแต่มุมมองน้อย",
    "วางแผนจำนวนวันที่ต้องเก็บย้อนหลัง (ปกติ 7–30 วัน) แล้วคำนวณความจุฮาร์ดดิสก์ให้พอตั้งแต่แรก",
    "เผื่อช่องกล้องของ NVR และงบไฟ PoE ไว้อย่างน้อย 20–30% สำหรับการขยายในอนาคต",
    "ควรใช้กล้องและเครื่องบันทึกแบรนด์เดียวกัน เพื่อให้ฟีเจอร์ AI และการแจ้งเตือนทำงานได้ครบ",
  ];
  if (kind === "camera" || kind === "ptz") {
    choosing.push("ติดตั้งภายนอกต้องเลือกรุ่นมาตรฐาน IP66/IP67 และหลีกเลี่ยงการเล็งย้อนแสงแดดหรือไฟหน้ารถ");
    choosing.push("ความสูงที่เหมาะกับการจำหน้าคือ 2.5–3.5 เมตร ก้มลงราว 10–15 องศา — ยิ่งติดสูงยิ่งเห็นแต่หัว");
    if (spec?.ir) choosing.push(`ระยะ IR ${spec.ir} ม. คือระยะ 'เห็นความเคลื่อนไหว' ระยะจำหน้าจริงมักอยู่ราวครึ่งหนึ่ง`);
  }
  if (kind === "recorder") choosing.push("ตรวจสอบแบนด์วิดท์รวม (Mbps) ของเครื่อง ไม่ใช่แค่จำนวนช่อง — กล้อง 4K กินแบนด์วิดท์สูงกว่ามาก");

  const limits: string[] = [];
  if (kind === "camera" || kind === "ptz") {
    limits.push("กล้องตัวเดียวไม่สามารถทั้งเห็นภาพรวมและจำหน้าคนได้พร้อมกัน ควรออกแบบหลายตัวให้ทำหน้าที่ต่างกัน");
    limits.push("ต้องมีเครื่องบันทึกและฮาร์ดดิสก์ จึงจะเก็บภาพย้อนหลังได้ — ตัวกล้องเพียงอย่างเดียวไม่บันทึกระยะยาว");
    if (!spec?.colorNight) limits.push("กลางคืนภาพเป็นขาวดำ ไม่สามารถระบุสีเสื้อหรือสีรถได้ หากจำเป็นควรเลือกรุ่นภาพสีกลางคืน");
    if (spec?.ptz) limits.push("ขณะกล้องหันไปทิศอื่น จุดที่ไม่ได้หันไปจะไม่มีภาพบันทึก");
  }
  if (kind === "recorder") limits.push("ในกล่องส่วนใหญ่ไม่มีฮาร์ดดิสก์มาให้ ต้องสั่งเพิ่มแยกต่างหาก");
  if (kind === "switch") limits.push("ระยะสาย LAN จ่ายไฟได้สูงสุดราว 100 เมตร เกินกว่านั้นต้องใช้ตัวขยายหรือไฟเบอร์");
  if (kind === "storage") limits.push("ฮาร์ดดิสก์เป็นอะไหล่สิ้นเปลือง ควรตรวจสุขภาพประจำปีและสำรองคลิปสำคัญไว้ต่างหาก");
  limits.push("ระบบต้องมีอินเทอร์เน็ตที่เสถียรหากต้องการดูผ่านมือถือ และควรมี UPS กันไฟดับขณะเกิดเหตุ");
  limits.push("การตั้งค่าเริ่มต้นและตำแหน่งติดตั้งมีผลต่อคุณภาพหลักฐานมากกว่ารุ่นสินค้า — ส่วนนี้ทีมช่างเราช่วยออกแบบให้ได้");

  return {
    kind,
    kindLabel: kindLabel[kind],
    useLabel: useLabelOf(kind, spec),
    brief: briefByKind[kind],
    what: what[kind],
    howItWorks,
    canDo,
    pairWith: pairWithByKind[kind],
    choosing,
    limits,
    spec,
  };
}

function Body({ x }: { x: CctvExplain }) {
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
          <ScanEye className="h-4 w-4 text-emerald-700" /> ทำงานอย่างไร
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
          <Cctv className="h-4 w-4 text-emerald-700" /> สิ่งที่ต้องคำนึงในการเลือก
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
          ทีมช่างของเราสำรวจหน้างาน คำนวณมุมกล้อง–ระยะ–จำนวนกล้องตามหลัก DORI เดินสาย ติดตั้ง ตั้งค่าดูผ่านมือถือ
          พร้อมสอนใช้งานและมีบริการบำรุงรักษา (MA) — รองรับทั้ง HIKVISION และ DAHUA
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
export function CctvBrief({
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
  const x = explainCctv(category, name, description);
  if (!x) return null;

  return (
    <div className={`mt-1.5 ${className}`} onClick={(e) => e.stopPropagation()}>
      <div className="rounded-md bg-emerald-50 px-2 py-1.5 text-[11px] leading-snug text-emerald-900 ring-1 ring-emerald-100">
        <span className="mr-1 inline-flex items-center gap-1 font-semibold">
          <Cctv className="h-3 w-3" />
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
            <Info className="h-3 w-3" /> อุปกรณ์นี้คืออะไร เหมาะกับงานแบบไหน?
          </button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Cctv className="h-4 w-4 text-emerald-700" /> {name}
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
export function CctvExplainer({
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
  const x = explainCctv(category, name, description);
  if (!x) return null;
  const s = x.spec;

  return (
    <section
      className={`mt-6 rounded-lg border border-emerald-200 bg-white p-4 ${className}`}
      aria-label="ทำความรู้จักอุปกรณ์ CCTV รุ่นนี้"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white">
          <Cctv className="h-3.5 w-3.5" /> {x.kindLabel}
        </span>
        <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
          {x.useLabel}
        </span>
        {s?.mp && (
          <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            {s.mp}MP
          </span>
        )}
        {s?.fov && (
          <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            มุมมอง {s.fov}
          </span>
        )}
        {s?.colorNight && (
          <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            ภาพสีกลางคืน
          </span>
        )}
        {s?.ai && (
          <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            AI แยกคน/รถ
          </span>
        )}
      </div>
      <p className="mb-3 text-sm font-medium text-slate-800">{x.brief}</p>
      <Body x={x} />
    </section>
  );
}
