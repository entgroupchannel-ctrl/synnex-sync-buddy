/**
 * ConferenceExplainer / ConferenceBrief — คำอธิบายสินค้าหมวด Webcam & Conference
 * "อุปกรณ์ตัวนี้คืออะไร ทำงานยังไง ใช้กับห้องแบบไหน ต้องใช้ร่วมกับอะไร ข้อจำกัดที่ควรรู้"
 */
import { useState } from "react";
import {
  Video,
  Info,
  Puzzle,
  CircleCheck,
  TriangleAlert,
  Sparkles,
  Phone,
  Users,
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

export const CONFERENCE_CATEGORIES = ["webcam & conference", "webcam", "conference"];

export type ConfKind =
  | "webcam"
  | "ptz"
  | "videobar"
  | "speakerphone"
  | "headset"
  | "mic"
  | "codec"
  | "display"
  | "accessory";

export type ConfSpec = {
  resolution: "4K" | "1080p" | "720p" | null;
  fov: number | null;
  zoom: number | null;
  autoFraming: boolean;
  poe: boolean;
  wireless: boolean;
  usb: boolean;
};

export type ConfExplain = {
  kind: ConfKind;
  kindLabel: string;
  roomLabel: string;
  brief: string;
  what: string;
  howItWorks: string[];
  canDo: string[];
  pairWith: string[];
  choosing: string[];
  limits: string[];
  spec: ConfSpec;
};

export function parseConferenceSpec(name?: string | null, description?: string | null): ConfSpec {
  const s = `${name ?? ""} ${description ?? ""}`;
  const fov = s.match(/(\d{2,3})\s*(?:°|องศา|degree|deg\b|FOV)/i);
  const zoom = s.match(/(\d{1,2})\s*x\s*(?:optical\s*)?zoom/i) ?? s.match(/zoom\s*(\d{1,2})\s*x/i);
  return {
    resolution: /\b(4k|uhd|2160p)\b/i.test(s) ? "4K" : /\b(1080p|fhd|full\s*hd)\b/i.test(s) ? "1080p" : /\b(720p|hd)\b/i.test(s) ? "720p" : null,
    fov: fov ? Number(fov[1]) : null,
    zoom: zoom ? Number(zoom[1]) : null,
    autoFraming: /(auto\s*framing|group\s*framing|smart\s*framing|speaker\s*track|ai\s*track)/i.test(s),
    poe: /\bpoe\b/i.test(s),
    wireless: /(wireless|bluetooth|wi-?fi)/i.test(s),
    usb: /\busb\b/i.test(s),
  };
}

function kindOf(name?: string | null, description?: string | null): ConfKind {
  const s = `${name ?? ""} ${description ?? ""}`.toLowerCase();
  if (/(video\s*bar|videobar|all[-\s]?in[-\s]?one|rally bar|cbar|meetup|studio bar)/.test(s)) return "videobar";
  if (/(ptz|pan\s*tilt|conference\s*cam|群|ptz-)/.test(s)) return "ptz";
  if (/(speakerphone|speaker\s*phone|conference\s*speaker|omni|sync\s*\d)/.test(s)) return "speakerphone";
  if (/(headset|หูฟัง)/.test(s)) return "headset";
  if (/(microphone|\bmic\b|ไมโครโฟน|mic\s*pod|expansion mic)/.test(s)) return "mic";
  if (/(codec|room\s*kit|controller|tap\s*ip|room\s*bar)/.test(s)) return "codec";
  if (/(monitor|display|จอ|tv)/.test(s)) return "display";
  if (/(mount|bracket|hub|cable|ขาตั้ง|สาย)/.test(s)) return "accessory";
  return "webcam";
}

function roomOf(kind: ConfKind, spec: ConfSpec): string {
  if (kind === "webcam") return "โต๊ะทำงานเดี่ยว / ห้องเล็ก 1–2 คน";
  if (kind === "headset") return "ผู้ใช้รายบุคคล / Call Center";
  if (kind === "speakerphone") return "ห้องประชุมเล็ก–กลาง 4–10 คน";
  if (kind === "videobar") return "ห้องประชุมเล็ก–กลาง 4–12 คน";
  if (kind === "ptz") return spec.zoom && spec.zoom >= 10 ? "ห้องประชุมใหญ่ / ห้องอบรม 15 คนขึ้นไป" : "ห้องประชุมกลาง 8–15 คน";
  if (kind === "codec") return "ห้องประชุมกลาง–ใหญ่ ที่ต้องการระบบถาวร";
  if (kind === "mic") return "ห้องประชุมยาว / โต๊ะหลายแถว";
  if (kind === "display") return "ห้องประชุมทุกขนาด";
  return "อุปกรณ์เสริมสำหรับห้องประชุม";
}

export function explainConference(
  category?: string | null,
  name?: string | null,
  description?: string | null,
): ConfExplain | null {
  const c = (category ?? "").toLowerCase();
  if (!CONFERENCE_CATEGORIES.some((k) => c.includes(k))) return null;

  const spec = parseConferenceSpec(name, description);
  const kind = kindOf(name, description);
  const res = spec.resolution ?? "HD";

  const kindLabel: Record<ConfKind, string> = {
    webcam: "กล้องเว็บแคมสำหรับโต๊ะทำงาน",
    ptz: "กล้องประชุม PTZ (หมุน-ก้ม-ซูมได้)",
    videobar: "Video Bar ออลอินวัน (กล้อง+ไมค์+ลำโพงในตัวเดียว)",
    speakerphone: "ลำโพง-ไมโครโฟนประชุม (Speakerphone)",
    headset: "ชุดหูฟังสำหรับประชุม/คอลเซ็นเตอร์",
    mic: "ไมโครโฟนห้องประชุม",
    codec: "ชุดควบคุมห้องประชุม (Room System/Codec)",
    display: "จอแสดงผลสำหรับห้องประชุม",
    accessory: "อุปกรณ์เสริมระบบห้องประชุม",
  };

  const briefByKind: Record<ConfKind, string> = {
    webcam: `กล้องเสียบ USB ความละเอียด ${res} ใช้กับ Zoom/Teams/Google Meet ได้ทันที เหมาะกับโต๊ะทำงานหรือห้องเล็ก`,
    ptz: `กล้องประชุมที่หมุนซ้าย-ขวา ก้ม-เงย และซูม${spec.zoom ? ` ${spec.zoom} เท่า` : ""}ได้ ใช้จับภาพผู้พูดในห้องประชุมขนาดกลางถึงใหญ่`,
    videobar: `อุปกรณ์ชิ้นเดียวรวมกล้อง ${res} ไมโครโฟน และลำโพงไว้ด้วยกัน ติดใต้จอแล้วเสียบ USB เส้นเดียวก็ประชุมได้`,
    speakerphone: `ลำโพงพร้อมไมค์รอบทิศสำหรับห้องประชุม ตัดเสียงสะท้อนและเสียงรบกวน ทำให้ปลายสายได้ยินชัด`,
    headset: `หูฟังพร้อมไมค์ตัดเสียงรบกวน สำหรับผู้ที่ประชุมออนไลน์หรือรับสายเป็นประจำ`,
    mic: `ไมโครโฟนเสริมสำหรับขยายพื้นที่รับเสียงในห้องประชุมที่ยาวหรือมีหลายแถว`,
    codec: `ชุดระบบห้องประชุมแบบติดตั้งถาวร ทำงานได้เองโดยไม่ต้องใช้โน้ตบุ๊ก เข้าห้องแล้วกดเริ่มประชุมได้เลย`,
    display: `จอแสดงผลสำหรับห้องประชุม ใช้แสดงภาพผู้ร่วมประชุมและงานนำเสนอ`,
    accessory: `อุปกรณ์เสริมที่ช่วยให้ระบบห้องประชุมติดตั้งเรียบร้อยและใช้งานได้เต็มประสิทธิภาพ`,
  };

  const what: Record<ConfKind, string> = {
    webcam: `เว็บแคมคือกล้องขนาดเล็กที่เสียบพอร์ต USB ของคอมพิวเตอร์ ระบบจะมองเห็นเป็นกล้องมาตรฐาน (UVC) ทันทีโดยไม่ต้องลงไดรเวอร์ ใช้ได้กับทุกแอปประชุม ให้ภาพคมกว่ากล้องในตัวโน้ตบุ๊กมาก และมักมีไมค์ในตัวสำหรับใช้งานคนเดียว`,
    ptz: `กล้อง PTZ (Pan-Tilt-Zoom) มีมอเตอร์ในตัวจึงหมุนและซูมได้ด้วยรีโมตหรือคำสั่งจากซอฟต์แวร์ ใช้เก็บภาพห้องประชุมทั้งห้องแล้วซูมไปที่ผู้พูดได้ ทำให้ปลายสายเห็นหน้าคนพูดชัดเจนแม้ห้องจะกว้าง`,
    videobar: `Video Bar คือการยุบกล้อง ไมโครโฟนอาเรย์ และลำโพงคุณภาพสูงไว้ในแท่งเดียว ติดตั้งใต้จอทีวี เดินสายน้อย ดูแลง่าย เป็นรูปแบบที่นิยมที่สุดสำหรับห้องประชุมยุคใหม่`,
    speakerphone: `Speakerphone คือลำโพงที่มีไมโครโฟนรอบทิศ (Omnidirectional) พร้อมชิปประมวลผลเสียงสำหรับตัดเสียงสะท้อน (AEC) และลดเสียงรบกวน วางกลางโต๊ะแล้วทุกคนพูดได้โดยไม่ต้องพิงไมค์`,
    headset: `ชุดหูฟังสำหรับงานสื่อสาร เน้นไมค์ที่ตัดเสียงรอบข้างและความสบายในการใส่นาน ๆ เหมาะกับผู้ที่ประชุมในพื้นที่เปิดหรืองานบริการลูกค้า`,
    mic: `ไมโครโฟนเสริมที่ต่อเพิ่มเข้ากับอุปกรณ์หลัก เพื่อขยายรัศมีรับเสียงให้ครอบคลุมผู้ร่วมประชุมที่นั่งไกลจากอุปกรณ์กลาง`,
    codec: `Room System คือคอมพิวเตอร์เฉพาะทางสำหรับห้องประชุม ทำงานร่วมกับจอสัมผัสควบคุม ล็อกอินบัญชีองค์กรไว้ล่วงหน้า จองห้องแล้วเข้าประชุมได้ด้วยปุ่มเดียว ไม่ต้องพึ่งเครื่องส่วนตัวของใคร`,
    display: `จอสำหรับห้องประชุมเน้นความสว่างและมุมมองกว้าง เพื่อให้ทุกคนในห้องมองเห็นเนื้อหาและผู้ร่วมประชุมได้ชัดจากทุกที่นั่ง`,
    accessory: `อุปกรณ์เสริมสำหรับยึด ต่อพ่วง หรือจ่ายไฟให้อุปกรณ์ห้องประชุม ช่วยให้การติดตั้งเป็นระเบียบและปลอดภัย`,
  };

  const howItWorks: string[] = [];
  if (kind === "webcam" || kind === "videobar" || kind === "speakerphone" || kind === "headset") {
    howItWorks.push("เสียบสาย USB เข้ากับคอมพิวเตอร์ ระบบตรวจพบอัตโนมัติ (Plug & Play) ไม่ต้องลงไดรเวอร์");
    howItWorks.push("เลือกอุปกรณ์นี้เป็นกล้อง/ไมค์/ลำโพงในหน้าตั้งค่าของ Zoom, Teams หรือ Google Meet");
  }
  if (kind === "ptz") {
    howItWorks.push("ต่อภาพผ่าน USB / HDMI / SDI หรือส่งผ่านเครือข่าย (IP) ไปยังเครื่องประชุมหรือ Room System");
    howItWorks.push("สั่งหมุน-ซูมด้วยรีโมต หรือบันทึกตำแหน่งล่วงหน้า (Preset) เพื่อกดเรียกจุดที่ใช้บ่อยได้ทันที");
  }
  if (kind === "codec") howItWorks.push("ระบบผูกกับบัญชีองค์กรและปฏิทินห้องประชุม เข้าห้องแล้วแตะเริ่มประชุมบนจอควบคุม");
  if (kind === "mic") howItWorks.push("ต่อพ่วงเข้ากับอุปกรณ์หลักด้วยสายเฉพาะรุ่น เสียงจะถูกรวมเป็นช่องเดียวก่อนส่งออก");
  if (spec.autoFraming) howItWorks.push("มีระบบ AI จัดเฟรมภาพอัตโนมัติ ปรับกรอบภาพตามจำนวนคนในห้องและผู้ที่กำลังพูด");
  if (spec.poe) howItWorks.push("รองรับ PoE จ่ายไฟผ่านสาย LAN เส้นเดียว ลดปลั๊กไฟและสายในห้อง");
  if (spec.wireless) howItWorks.push("เชื่อมต่อไร้สาย (Bluetooth/Wi-Fi) ได้ ลดความยุ่งยากเรื่องสาย");
  if (!howItWorks.length) howItWorks.push("ติดตั้งร่วมกับระบบห้องประชุมเดิม ทำงานเป็นส่วนหนึ่งของชุดกล้อง–เสียง–จอแสดงผล");

  const canDoByKind: Record<ConfKind, string[]> = {
    webcam: [
      `ประชุมออนไลน์ภาพคมระดับ ${res} ชัดกว่ากล้องในตัวโน้ตบุ๊ก`,
      "ไลฟ์สด สอนออนไลน์ อัดคลิป และสัมภาษณ์งานทางไกล",
      "ใช้เป็นกล้องสำรองสำหรับห้องเล็ก 1–2 คน",
    ],
    ptz: [
      "จับภาพผู้พูดในห้องประชุมกว้าง แล้วซูมเข้าใกล้ให้เห็นสีหน้าและเอกสาร",
      "ตั้ง Preset มุมกล้องประจำ เช่น มุมประธาน มุมจอนำเสนอ มุมทั้งห้อง",
      "ใช้ถ่ายทอดสดงานอบรม สัมมนา หรือห้องเรียนไฮบริดได้",
    ],
    videobar: [
      "เปลี่ยนห้องประชุมธรรมดาให้เป็นห้องประชุมออนไลน์ได้ในวันเดียว",
      "ให้เสียงและภาพครบในเครื่องเดียว ลดสายและจุดเสียหาย",
      "ใช้ร่วมกับโน้ตบุ๊กของผู้ใช้ หรืออัปเกรดเป็นระบบถาวรภายหลัง",
    ],
    speakerphone: [
      "ให้ผู้ร่วมประชุมรอบโต๊ะพูดได้ยินชัดโดยไม่ต้องพิงไมค์",
      "ตัดเสียงสะท้อนและเสียงแอร์/พัดลม ทำให้ปลายสายไม่ล้า",
      "พกพาไปใช้ห้องอื่นหรือประชุมนอกสถานที่ได้",
    ],
    headset: [
      "ประชุมและรับสายในพื้นที่เปิดโดยไม่รบกวนคนรอบข้าง",
      "ไมค์ตัดเสียงรบกวน ทำให้ปลายสายได้ยินเฉพาะเสียงคุณ",
      "เหมาะกับงานคอลเซ็นเตอร์ที่ต้องใส่ต่อเนื่องหลายชั่วโมง",
    ],
    mic: [
      "ขยายพื้นที่รับเสียงให้ครอบคลุมโต๊ะประชุมยาวหรือหลายแถว",
      "ลดปัญหาคนนั่งปลายโต๊ะพูดแล้วปลายสายไม่ได้ยิน",
    ],
    codec: [
      "เข้าประชุมด้วยปุ่มเดียวจากปฏิทินห้อง ไม่ต้องต่อโน้ตบุ๊ก",
      "บริหารจัดการอุปกรณ์ทุกห้องจากศูนย์กลาง ดูสถานะและอัปเดตได้",
      "รองรับการใช้งานทุกวันแบบองค์กร มีระบบความปลอดภัยตามมาตรฐาน",
    ],
    display: [
      "แสดงภาพผู้ร่วมประชุมและงานนำเสนอให้ทุกที่นั่งมองเห็นชัด",
      "ใช้เป็นจอหลักของชุด Video Bar หรือ Room System",
    ],
    accessory: [
      "ช่วยยึด ต่อพ่วง หรือจ่ายไฟให้อุปกรณ์ห้องประชุมอย่างเป็นระเบียบ",
      "ลดปัญหาสายหลุด สายพันกัน และอุปกรณ์ล้ม",
    ],
  };
  const canDo = [...canDoByKind[kind]];
  if (spec.fov) canDo.push(`มุมรับภาพกว้าง ${spec.fov}° ครอบคลุมผู้ร่วมประชุม${spec.fov >= 110 ? "ได้เกือบทั้งโต๊ะแม้ห้องแคบ" : "ในระยะปกติ"}`);

  const pairWithByKind: Record<ConfKind, string[]> = {
    webcam: [
      "คอมพิวเตอร์/โน้ตบุ๊กที่มีพอร์ต USB และแอปประชุม (Zoom, Teams, Meet)",
      "หูฟังหรือ Speakerphone หากมีคนร่วมประชุมมากกว่า 1 คน",
      "ขาตั้งหรือคลิปยึดจอ หากต้องการมุมกล้องที่เหมาะสม",
    ],
    ptz: [
      "อุปกรณ์รับภาพ: โน้ตบุ๊ก, Room System หรือการ์ดแคปเจอร์ ตามพอร์ตของกล้อง",
      "ระบบเสียงแยก เช่น Speakerphone หรือไมค์เพดาน (กล้อง PTZ ส่วนใหญ่ไม่มีไมค์ในตัว)",
      "ขายึดผนัง/เพดาน และสายสัญญาณความยาวเหมาะสม",
    ],
    videobar: [
      "จอทีวีหรือจอประชุมสำหรับติดตั้งอุปกรณ์ไว้ด้านล่างหรือด้านบน",
      "ขายึดจอ/ขายึดผนังตามรูปแบบห้อง",
      "จอควบคุม (Tap/Touch Controller) หากต้องการใช้แบบไม่ต่อโน้ตบุ๊ก",
    ],
    speakerphone: [
      "กล้องประชุม (Webcam/PTZ) เพื่อให้ครบทั้งภาพและเสียง",
      "สาย USB ยาวหรือฮับ หากวางกลางโต๊ะไกลจากเครื่อง",
      "ไมค์เสริม หากห้องยาวเกินระยะรับเสียงของตัวเครื่อง",
    ],
    headset: ["คอมพิวเตอร์หรือโทรศัพท์ที่รองรับ USB/Bluetooth", "ดองเกิล (Dongle) หรืออะแดปเตอร์ตามรุ่น หากใช้แบบไร้สาย"],
    mic: ["อุปกรณ์หลักรุ่นที่รองรับการต่อไมค์เสริมโดยเฉพาะ (ต้องตรวจสอบความเข้ากันได้)"],
    codec: ["จอแสดงผล 1–2 จอ", "กล้องและอุปกรณ์เสียงที่รองรับกับระบบ", "เครือข่ายองค์กรและบัญชี Teams/Zoom Rooms"],
    display: ["ชุดกล้อง–เสียง หรือ Video Bar", "ขายึดจอและสาย HDMI คุณภาพดี"],
    accessory: ["อุปกรณ์หลักที่ระบุความเข้ากันได้ตามรุ่น"],
  };

  const choosing = [
    "วัดขนาดห้องและระยะจากกล้องถึงคนที่นั่งไกลสุดก่อนเลือกรุ่น — ห้องเล็กเน้นมุมกว้าง ห้องใหญ่เน้นซูม",
    "แยกให้ชัดว่าต้องการ “ภาพ” อย่างเดียวหรือ “ภาพ+เสียง” ในตัว เพราะกล้อง PTZ ส่วนใหญ่ไม่มีไมค์",
    "เสียงสำคัญกว่าภาพเสมอ — งบจำกัดควรลงทุนกับไมค์/ลำโพงก่อนอัปเกรดความละเอียดกล้อง",
    "ตรวจสอบว่ารุ่นนี้ผ่านการรับรองกับแพลตฟอร์มที่องค์กรใช้ (Teams / Zoom) หรือไม่",
    "เผื่อวิธีเดินสายและตำแหน่งปลั๊กไฟ/LAN ตั้งแต่ตอนออกแบบ จะได้ห้องที่เรียบร้อยและใช้งานยาว",
  ];
  if (kind === "ptz" || kind === "videobar" || kind === "codec")
    choosing.push("ความสูงติดตั้งกล้องที่เหมาะสมคือระดับสายตาผู้นั่ง (~1.1–1.5 ม.) หรือใต้จอ เพื่อไม่ให้ภาพกดหน้า");

  const limits: string[] = [];
  if (kind === "webcam") limits.push("ไมค์ในตัวรับเสียงได้ราว 1–1.5 เมตร ไม่เหมาะกับห้องประชุมหลายคน");
  if (kind === "ptz") limits.push("ไม่มีลำโพง/ไมค์ในตัว ต้องจัดระบบเสียงเพิ่มเสมอ");
  if (kind === "videobar") limits.push("ระยะรับเสียงมีขีดจำกัดตามรุ่น ห้องยาวเกินสเปกควรเสริมไมค์หรือใช้รุ่นใหญ่ขึ้น");
  if (kind === "speakerphone") limits.push("ไม่มีกล้องในตัว ต้องใช้คู่กับเว็บแคมหรือกล้องประชุม");
  if (kind === "mic") limits.push("ต่อได้เฉพาะกับอุปกรณ์หลักรุ่นที่รองรับเท่านั้น ไม่ใช่ไมค์อเนกประสงค์");
  if (spec.resolution === "4K") limits.push("การใช้ 4K ต้องใช้เครื่องและอินเทอร์เน็ตที่แรงพอ หลายแพลตฟอร์มยังส่งภาพจริงที่ 1080p");
  limits.push("แสงจากหน้าต่างด้านหลังผู้พูดจะทำให้หน้ามืด ควรจัดตำแหน่งกล้องหรือเพิ่มแสงด้านหน้า");
  limits.push("ห้องที่เสียงก้อง (ผนังกระจก/พื้นแข็ง) จะทำให้คุณภาพเสียงลดลง แม้ใช้อุปกรณ์ระดับสูง");

  return {
    kind,
    kindLabel: kindLabel[kind],
    roomLabel: roomOf(kind, spec),
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

function Body({ x }: { x: ConfExplain }) {
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
          <Video className="h-4 w-4 text-emerald-700" /> ทำงานอย่างไร
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
          <Users className="h-4 w-4 text-emerald-700" /> สิ่งที่ต้องคำนึงในการเลือก
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
          <Sparkles className="h-4 w-4" /> เราสำรวจห้อง ติดตั้ง และสอนใช้งานให้
        </div>
        <p className="mt-1">
          ทีมช่างของเราช่วยเลือกรุ่นให้เหมาะกับขนาดห้อง เดินสาย ติดตั้ง ตั้งค่าเชื่อมกับ Teams/Zoom/Meet
          ทดสอบเสียงและภาพจริง พร้อมสอนทีมของคุณใช้งานจนประชุมได้ราบรื่น และมีบริการดูแลต่อเนื่อง (MA)
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
export function ConferenceBrief({
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
  const x = explainConference(category, name, description);
  if (!x) return null;

  return (
    <div className={`mt-1.5 ${className}`} onClick={(e) => e.stopPropagation()}>
      <div className="rounded-md bg-emerald-50 px-2 py-1.5 text-[11px] leading-snug text-emerald-900 ring-1 ring-emerald-100">
        <span className="mr-1 inline-flex items-center gap-1 font-semibold">
          <Video className="h-3 w-3" />
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
            <Info className="h-3 w-3" /> อุปกรณ์นี้คืออะไร ใช้กับห้องแบบไหน?
          </button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Video className="h-4 w-4 text-emerald-700" /> {name}
            </DialogTitle>
            <DialogDescription>
              {x.kindLabel} · {x.roomLabel}
            </DialogDescription>
          </DialogHeader>
          <Body x={x} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** เวอร์ชันเต็มบนหน้ารายละเอียดสินค้า */
export function ConferenceExplainer({
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
  const x = explainConference(category, name, description);
  if (!x) return null;

  return (
    <section
      className={`mt-6 rounded-lg border border-emerald-200 bg-white p-4 ${className}`}
      aria-label="ทำความรู้จักอุปกรณ์ประชุมรุ่นนี้"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white">
          <Video className="h-3.5 w-3.5" /> {x.kindLabel}
        </span>
        <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
          {x.roomLabel}
        </span>
        {x.spec.resolution && (
          <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            {x.spec.resolution}
          </span>
        )}
        {x.spec.zoom && (
          <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            ซูม {x.spec.zoom}x
          </span>
        )}
        {x.spec.fov && (
          <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            FOV {x.spec.fov}°
          </span>
        )}
        {x.spec.autoFraming && (
          <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            AI Auto Framing
          </span>
        )}
      </div>
      <p className="mb-3 text-sm font-medium text-slate-800">{x.brief}</p>
      <Body x={x} />
    </section>
  );
}
