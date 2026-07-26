import { LineQrDialog } from "@/components/line-qr-dialog";
import { useState } from "react";
import { MemoryStick, Gamepad2, Briefcase, Video, Cpu, Monitor, Router, Server, Building2, BatteryCharging, Cctv, HardDrive, Network, Siren, Sun, Cable, ChevronDown, Phone, Wrench, Info } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { MouseEvent as ReactMouseEvent } from "react";

export type UsageProfile = {
  key: string;
  label: string;
  hint: string;
  cls: string;
  icon: "game" | "office" | "creator" | "workstation" | "basic" | "router" | "server" | "building" | "battery" | "ram" | "cctv" | "recorder" | "network" | "alarm" | "solar" | "cable";
  /** Longer explainer bullets shown when the user clicks "ดูเพิ่มเติม". */
  detail?: string[];
  /** Show the "หาช่างติดตั้งให้" call-to-action. */
  installer?: boolean;
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
    detail: [
      "เหมาะกับระยะนั่งห่างจอ 0.5–1 เมตร ใช้คนเดียวหน้าคอมพิวเตอร์",
      "เลือกความละเอียด 1080p ขึ้นไป ถ้าต้องไลฟ์/บันทึกวิดีโอควรมองหา 60fps",
      "ห้องที่แสงน้อยหรือมีหน้าต่างด้านหลัง ให้เลือกรุ่นที่มี HDR / Auto Light Correction",
      "ไมค์ในตัวพอสำหรับคนเดียว แต่ถ้าต้องการเสียงชัดมากขึ้นแนะนำเสริมหูฟัง/เฮดเซ็ต",
      "ติดตั้งง่าย เสียบ USB ใช้ได้ทันที ไม่ต้องใช้ช่าง",
    ],
  },
  cam_huddle: {
    key: "cam_huddle",
    label: "ห้องประชุมเล็ก 2-6 คน",
    hint: "กล้อง+ไมค์+ลำโพงในตัว ตั้งบนโต๊ะ เก็บเสียงรอบทิศ เหมาะกับห้อง Huddle Room",
    cls: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    icon: "office",
    installer: true,
    detail: [
      "เหมาะกับห้องกว้างไม่เกินราว 3x4 เมตร ผู้ร่วมประชุม 2–6 คน",
      "เลือกรุ่นออลอินวัน (กล้อง+ไมค์+ลำโพงในเครื่องเดียว) เดินสายน้อย ติดตั้งเร็ว",
      "มุมมองภาพควรกว้าง 90–120° เพื่อเก็บคนทั้งโต๊ะโดยไม่ต้องเบียดกัน",
      "ไมค์ควรรับเสียงได้รอบทิศในระยะ 2–3 เมตร และมีระบบตัดเสียงก้อง (AEC)",
      "ตรวจว่ารองรับ Zoom / Teams แบบ Certified เพื่อลดปัญหาเสียง-ภาพไม่ตรงกัน",
      "แนะนำติดตั้งใต้จอ ระดับสายตา และเก็บสายให้เรียบร้อยเพื่อความปลอดภัย",
    ],
  },
  cam_medium: {
    key: "cam_medium",
    label: "ห้องประชุมกลาง 6-12 คน",
    hint: "มุมกว้าง ซูมได้ พร้อมไมค์แยก/รีโมท เหมาะกับห้องประชุมมาตรฐานขององค์กร",
    cls: "bg-indigo-100 text-indigo-700 ring-indigo-200",
    icon: "building",
    installer: true,
    detail: [
      "เหมาะกับห้องราว 4x6 เมตร โต๊ะยาว ผู้ร่วมประชุม 6–12 คน",
      "ควรเลือกกล้องที่ซูมได้ 3–5 เท่า และมี Auto Framing จับกลุ่มคนอัตโนมัติ",
      "ระยะไกลเกิน 3 เมตร ควรเสริมไมค์แยก (Expansion Mic) วางกลางโต๊ะ",
      "ถ้าห้องมีเสียงก้อง ควรวางแผนตำแหน่งลำโพง/ไมค์ตั้งแต่ตอนสำรวจหน้างาน",
      "มองหาการรองรับรีโมท พรีเซ็ตมุมกล้อง และการอัปเดตเฟิร์มแวร์ผ่านซอฟต์แวร์จัดการ",
      "แนะนำติดตั้งโดยช่าง เพื่อเดินสายในผนัง/ฝ้า และเซ็ตค่าเสียงให้เหมาะกับห้อง",
    ],
  },
  cam_large: {
    key: "cam_large",
    label: "ห้องประชุมใหญ่/ห้องอบรม",
    hint: "กล้อง PTZ หรือชุด Room System ซูมไกล หมุน-ก้ม-เงยได้ รองรับผู้เข้าประชุมจำนวนมาก",
    cls: "bg-rose-100 text-rose-700 ring-rose-200",
    icon: "server",
    installer: true,
    detail: [
      "เหมาะกับห้องอบรม ห้องบอร์ด หรือออดิทอเรียม ผู้เข้าร่วม 12 คนขึ้นไป",
      "กล้อง PTZ ซูมออปติคอล 12–20 เท่า จับภาพผู้พูดที่อยู่ไกลได้ชัด",
      "ตั้งพรีเซ็ตมุมกล้องล่วงหน้า (เวที / ผู้ฟัง / โต๊ะประธาน) สลับได้ด้วยรีโมท",
      "ควรใช้ไมค์เพดานหรือไมค์ประชุมหลายตัว ร่วมกับตัวประมวลผลเสียง (DSP)",
      "ถ้าต้องถ่ายทอดสด/บันทึกการอบรม ให้เผื่อช่องต่อ HDMI/SDI และ NDI",
      "งานระดับนี้ต้องออกแบบทั้งระบบ — แนะนำให้ทีมช่างเข้าสำรวจก่อนเสมอ",
    ],
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


const CCTV_PROFILES: Record<string, UsageProfile> = {
  cctv_indoor: {
    key: "cctv_indoor",
    label: "กล้องในบ้าน/ในร้าน",
    hint: "กล้องโดม/ทรงกลม ติดเพดานในอาคาร มุมมองกว้าง เหมาะกับบ้าน ร้านค้า ออฟฟิศ",
    cls: "bg-sky-100 text-sky-700 ring-sky-200",
    icon: "cctv",
    detail: [
      "ทรงโดมกลมกลืนกับฝ้า ไม่เกะกะสายตา และเดาทิศทางการหันกล้องได้ยากกว่าแบบกระบอก",
      "หลักการติดตั้ง: ติดสูงจากพื้น 2.5–3 เมตร ก้มลงประมาณ 10–15 องศา เพื่อให้เห็นใบหน้าคน ไม่ใช่แค่ศีรษะ",
      "เลนส์ 2.8 มม. มุมกว้าง ~100–110° ครอบคลุมห้องกว้าง 6–8 เมตร เหมาะกับห้องนั่งเล่น เคาน์เตอร์ ร้านค้าเล็ก",
      "เลี่ยงหันกล้องย้อนหน้าต่างหรือประตูกระจก เพราะแสงย้อนทำให้ใบหน้าดำ (เลือกรุ่นมี WDR ช่วยได้)",
      "จุดคุ้มค่าที่สุดในบ้าน: ประตูหน้า–หลัง, ตู้เซฟ/เคาน์เตอร์เงินสด, ทางขึ้นบันได",
    ],
    installer: true,
  },
  cctv_outdoor: {
    key: "cctv_outdoor",
    label: "กล้องนอกอาคาร กันน้ำ",
    hint: "กล้องกระบอก (Bullet) มาตรฐานกันน้ำ IP67 มองไกล เหมาะกับรั้ว ลานจอดรถ หน้าร้าน",
    cls: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    icon: "cctv",
    detail: [
      "ตัวถังกันน้ำกันฝุ่น IP66/IP67 ทนแดดฝนไทยได้ตลอดปี ควรมีชายคาหรือกล่องกันน้ำที่จุดต่อสาย",
      "เลือกเลนส์ตามระยะ: 2.8 มม. เห็นภาพรวม 0–10 ม. / 4 มม. จับใบหน้าชัดถึง ~12–15 ม. / 6 มม.ขึ้นไป ใช้กับทางยาวหรือรั้วลึก 20 ม.+",
      "ติดสูง 3–4 เมตร จะพ้นมือคนงัด แต่ไม่ควรเกิน 4.5 ม. เพราะจะเห็นแต่ศีรษะ จับใบหน้าไม่ได้",
      "วางกล้องขวางทางเดิน (ตัดขวาง) ดีกว่าหันตรงเข้าหาคนเดิน เพราะได้ทั้งใบหน้าและรูปพรรณ",
      "กลางคืนพึ่ง IR: ระยะ IR ที่ระบุคือระยะ 'เห็นความเคลื่อนไหว' ระยะที่จับหน้าได้จริงมักราวครึ่งหนึ่งของตัวเลขนั้น",
    ],
    installer: true,
  },
  cctv_night_color: {
    key: "cctv_night_color",
    label: "กลางคืนเห็นภาพสี",
    hint: "ColorVu / WizColor มีไฟส่องสว่างในตัว กลางคืนได้ภาพสีชัด เห็นสีเสื้อ สีรถ ป้ายทะเบียน",
    cls: "bg-amber-100 text-amber-700 ring-amber-200",
    icon: "cctv",
    detail: [
      "เซ็นเซอร์รูรับแสงกว้าง (F1.0) + ไฟ LED ในตัว ให้ภาพสีตอนกลางคืน แทนภาพขาวดำแบบ IR",
      "ประโยชน์จริงเวลาเกิดเหตุ: ตำรวจและประกันต้องการ 'สีเสื้อ สีรถ' ซึ่งภาพขาวดำให้ไม่ได้",
      "เหมาะกับหน้าร้าน ลานจอดรถ ทางเข้า–ออกโครงการ ที่พอมีแสงไฟถนนอยู่บ้าง",
      "ถ้าไม่อยากให้เห็นแสงไฟขาวตลอดคืน เลือกรุ่น Dual-Light ที่สลับ IR ↔ ไฟขาวอัตโนมัติเมื่อจับความเคลื่อนไหว",
      "ระยะแนะนำ: ให้เป้าหมายอยู่ในช่วง 3–12 เมตร จะได้ภาพสีคมและ noise ต่ำที่สุด",
    ],
    installer: true,
  },
  cctv_smart: {
    key: "cctv_smart",
    label: "แจ้งเตือนอัจฉริยะ/ซูมได้",
    hint: "AcuSense / WizSense แยกคน-รถออกจากสัตว์และใบไม้ ลดแจ้งเตือนหลอก บางรุ่นปรับซูมได้",
    cls: "bg-indigo-100 text-indigo-700 ring-indigo-200",
    icon: "cctv",
    detail: [
      "AI ในกล้องแยก 'คน' และ 'ยานพาหนะ' ออกจากแมว ใบไม้ไหว เงาแสง ลดการแจ้งเตือนหลอกได้มาก",
      "ตั้งเส้นกันล้ำ (Line Crossing) และพื้นที่หวงห้าม (Intrusion) ให้เตือนเข้ามือถือเฉพาะเหตุที่สำคัญจริง",
      "รุ่นเลนส์ปรับได้ (Varifocal 2.8–12 มม.) ปรับมุมภาพหน้างานได้ ไม่ต้องเสี่ยงเลือกผิดระยะ",
      "รุ่น PTZ หมุน–ก้ม–ซูมได้ เหมาะกับลานกว้าง โรงงาน คลังสินค้า แต่ควรมีกล้องนิ่งคุมจุดสำคัญคู่กันเสมอ",
      "ค้นย้อนหลังเร็วขึ้นมาก เพราะกรองดูเฉพาะเหตุการณ์ที่เป็นคน/รถ ไม่ต้องไล่ดูทั้งวัน",
    ],
    installer: true,
  },
  cctv_nvr_small: {
    key: "cctv_nvr_small",
    label: "เครื่องบันทึก 4-8 กล้อง",
    hint: "สำหรับบ้านหรือร้านขนาดเล็ก ติดกล้องราว 4-8 ตัว ดูย้อนหลังผ่านมือถือได้",
    cls: "bg-violet-100 text-violet-700 ring-violet-200",
    icon: "recorder",
    detail: [
      "เลือกจำนวนช่องเผื่ออนาคตอย่างน้อย 1–2 ช่อง เพราะบ้านและร้านมักเพิ่มกล้องภายหลังเสมอ",
      "คำนวณฮาร์ดดิสก์คร่าว ๆ: กล้อง 4MP หนึ่งตัว ≈ 15–20 GB/วัน — 4 ตัว เก็บย้อนหลัง 30 วัน ควรใช้ HDD 2–4 TB",
      "ใช้ HDD สำหรับกล้องวงจรปิดโดยเฉพาะ (Surveillance/Purple) ที่ออกแบบให้เขียนต่อเนื่อง 24 ชม.",
      "รุ่น NVR มี PoE ในตัว จ่ายไฟกล้องผ่านสาย LAN ได้เลย ประหยัดค่าเดินปลั๊กและติดตั้งง่ายกว่า",
      "ตั้งค่าบันทึกแบบ Event ผสมกับ Continuous ความละเอียดต่ำ เพื่อประหยัดพื้นที่แต่ไม่พลาดเหตุ",
    ],
    installer: true,
  },
  cctv_nvr_large: {
    key: "cctv_nvr_large",
    label: "เครื่องบันทึก 16 กล้องขึ้นไป",
    hint: "สำหรับอาคาร โรงงาน หรือหลายสาขา รองรับกล้องจำนวนมากและฮาร์ดดิสก์หลายลูก",
    cls: "bg-rose-100 text-rose-700 ring-rose-200",
    icon: "recorder",
    detail: [
      "ดูค่า Incoming Bandwidth ของเครื่องให้พอกับผลรวมบิตเรตกล้องทุกตัว ไม่ใช่ดูแค่จำนวนช่อง",
      "ใส่ HDD ได้หลายลูก บางรุ่นรองรับ RAID — สำคัญมากกับงานที่ห้ามภาพหาย",
      "โรงงาน/อาคารควรแยก VLAN ของกล้องออกจากเน็ตเวิร์กสำนักงาน เพื่อความปลอดภัยและไม่แย่งแบนด์วิดท์",
      "หลายสาขาเชื่อมเข้าศูนย์กลางผ่าน HikCentral / DSS ดูรวมทุกสาขาในจอเดียวได้",
      "ควรมี UPS สำรองไฟให้ NVR และสวิตช์ PoE เพราะไฟดับระหว่างเขียนไฟล์ทำให้ข้อมูลเสียหาย",
    ],
    installer: true,
  },
  cctv_switch: {
    key: "cctv_switch",
    label: "สวิตช์ PoE จ่ายไฟให้กล้อง",
    hint: "ต่อกล้อง IP ได้หลายตัวด้วยสาย LAN เส้นเดียว จ่ายทั้งไฟและสัญญาณ ไม่ต้องเดินปลั๊กที่กล้อง",
    cls: "bg-teal-100 text-teal-700 ring-teal-200",
    icon: "network",
    detail: [
      "งบพลังงาน (PoE Budget) ควรมากกว่าผลรวมกำลังไฟกล้องราว 20–30% — กล้องนิ่งกินราว 6–12W, PTZ 20–30W",
      "สาย UTP CAT5e/CAT6 ส่งได้ไกล 100 เมตร ถ้าไกลกว่านั้นใช้โหมด Extend (ราว 250 ม. ที่ความเร็วลดลง) หรือแปลงไฟเบอร์",
      "เลือกสายทองแดงแท้เท่านั้น สาย CCA ทำให้กล้องรีสตาร์ทเองตอนกลางคืนเมื่อไฟ IR ทำงาน",
      "รุ่นมี Surge Protection ช่วยลดความเสียหายจากฟ้าผ่าสำหรับกล้องนอกอาคาร",
    ],
    installer: true,
  },
  cctv_monitor: {
    key: "cctv_monitor",
    label: "จอ/อุปกรณ์ห้องมอนิเตอร์",
    hint: "จอแสดงภาพหรืออุปกรณ์ควบคุมสำหรับห้อง Control Room เปิดดูต่อเนื่อง 24 ชั่วโมง",
    cls: "bg-slate-100 text-slate-700 ring-slate-200",
    icon: "basic",
    detail: [
      "จอสำหรับ CCTV ออกแบบให้เปิด 24/7 ต่างจากจอคอมทั่วไปที่ประกันไม่ครอบคลุมการใช้งานต่อเนื่อง",
      "จอ 4K ดูภาพ 9–16 ช่องพร้อมกันได้โดยยังเห็นรายละเอียดใบหน้า",
      "ระยะนั่งดูที่เหมาะสม ≈ 1.5–2 เท่าของความสูงจอ เพื่อกวาดสายตาได้ครบทุกช่อง",
    ],
    installer: true,
  },
  cctv_alarm: {
    key: "cctv_alarm",
    label: "อุปกรณ์แจ้งเตือน/กันขโมย",
    hint: "ไซเรน เซ็นเซอร์ หรืออุปกรณ์เสริมระบบรักษาความปลอดภัย แจ้งเตือนเมื่อมีผู้บุกรุก",
    cls: "bg-orange-100 text-orange-700 ring-orange-200",
    icon: "alarm",
    detail: [
      "กล้องคือ 'หลักฐาน' ส่วนไซเรน/เซ็นเซอร์คือ 'การป้องปราม' — ใช้คู่กันได้ผลดีที่สุด",
      "เซ็นเซอร์ตรวจจับความเคลื่อนไหวควรติดสูง 2–2.2 ม. และเลี่ยงหันเข้าหาแอร์ หน้าต่าง หรือแดดตรง",
      "ผูกกับกล้อง AcuSense/WizSense ให้เปิดไฟและเสียงเตือนอัตโนมัติเมื่อพบคนในเวลาห้ามเข้า",
    ],
    installer: true,
  },
};

function getCctvProfile(t: string): UsageProfile {
  if (/siren|ไซเรน|alarm|sensor|detector|กันขโมย/.test(t)) return CCTV_PROFILES.cctv_alarm;
  if (/\bnvr\b|\bdvr\b|\bxvr\b|digital video recorder|network video recorder|ds-7\d|ids-7\d/.test(t)) {
    const ch = Number(t.match(/(\d{1,2})\s*ch/)?.[1] ?? t.match(/-7(\d)(\d\d)/)?.[0]?.slice(2, 4) ?? 0);
    return ch >= 16 ? CCTV_PROFILES.cctv_nvr_large : CCTV_PROFILES.cctv_nvr_small;
  }
  if (/\bpoe\b.*(switch|สวิตช์)|switch.*\bpoe\b|ds-3e1|-8gt-|-4et2gt/.test(t)) return CCTV_PROFILES.cctv_switch;
  if (/monitor|display|จอ\s|ds-d\d|video wall|decoder/.test(t)) return CCTV_PROFILES.cctv_monitor;
  if (/colorvu|wizcolor|dual-?light|white light|full-?color/.test(t)) return CCTV_PROFILES.cctv_night_color;
  if (/acusense|wizsense|ptz|izs|varifocal|2\.8-12/.test(t)) return CCTV_PROFILES.cctv_smart;
  if (/bullet|hfw|กระบอก|ip67|outdoor/.test(t)) return CCTV_PROFILES.cctv_outdoor;
  return CCTV_PROFILES.cctv_indoor;
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
  cctv: Cctv,
  recorder: HardDrive,
  network: Network,
  alarm: Siren,
  solar: Sun,
  cable: Cable,
};

const SOLAR_PROFILES: Record<string, UsageProfile> = {
  solar_inv_small: {
    key: "solar_inv_small",
    label: "อินเวอร์เตอร์ บ้านขนาดเล็ก (3-5kW)",
    hint: "บ้านพักอาศัย ไฟบ้าน 1 เฟส ค่าไฟราว 2,000-4,000 บาท/เดือน",
    cls: "bg-amber-100 text-amber-700 ring-amber-200",
    icon: "solar",
    installer: true,
    detail: [
      "อินเวอร์เตอร์คือหัวใจของระบบ ทำหน้าที่แปลงไฟ DC จากแผงโซลาร์เป็นไฟ AC 220V ที่ใช้ในบ้าน",
      "ขนาด 3-5kW เหมาะกับบ้าน 1 เฟส (ไฟบ้านทั่วไป) ใช้แผงราว 6-10 แผง (แผงละ ~550W)",
      "รุ่น Hybrid ต่อแบตเตอรี่เพิ่มภายหลังได้ ทำให้มีไฟใช้ตอนกลางคืนหรือตอนไฟดับ",
      "ช่วยลดค่าไฟช่วงกลางวันได้มาก เหมาะกับบ้านที่มีคนอยู่กลางวัน เปิดแอร์/ตู้เย็น/ปั๊มน้ำ",
    ],
  },
  solar_inv_medium: {
    key: "solar_inv_medium",
    label: "อินเวอร์เตอร์ บ้านใหญ่/ร้านค้า (10kW)",
    hint: "บ้านหลังใหญ่ ทาวน์โฮมหลายชั้น หรือร้านค้า ใช้ไฟกลางวันเยอะ",
    cls: "bg-orange-100 text-orange-700 ring-orange-200",
    icon: "solar",
    installer: true,
    detail: [
      "ขนาด 10kW รองรับแผงราว 16-20 แผง เหมาะกับบ้านใหญ่ที่มีแอร์หลายตัว หรือร้านค้า/คลินิก",
      "มีทั้งรุ่น 1 เฟส และ 3 เฟส — ต้องเลือกให้ตรงกับระบบไฟที่การไฟฟ้าติดตั้งให้บ้านคุณ",
      "เหมาะกับบ้านที่ค่าไฟเดือนละ 5,000-10,000 บาทขึ้นไป คืนทุนเร็วกว่าระบบเล็ก",
      "รองรับการต่อแบตเตอรี่ (Hybrid) เพื่อสำรองไฟและใช้ไฟที่เก็บไว้ตอนกลางคืน",
    ],
  },
  solar_inv_large: {
    key: "solar_inv_large",
    label: "อินเวอร์เตอร์ โรงงาน/อาคาร (15kW+)",
    hint: "ระบบ 3 เฟสขนาดใหญ่ สำหรับโรงงาน อาคารสำนักงาน โกดัง",
    cls: "bg-rose-100 text-rose-700 ring-rose-200",
    icon: "solar",
    installer: true,
    detail: [
      "ขนาด 15-50kW เป็นระบบ 3 เฟสสำหรับอาคารพาณิชย์ โรงงาน หรือฟาร์ม",
      "ช่วยลดค่าไฟช่วง Peak ได้มาก เพราะโรงงานใช้ไฟหนักในเวลากลางวันพอดีกับที่แผงผลิตได้",
      "งานระดับนี้ต้องมีวิศวกรออกแบบ ขออนุญาตการไฟฟ้า (PEA/MEA) และยื่นเรื่อง กกพ.",
      "เราช่วยประเมินขนาดระบบ จัดหาช่าง และดูแลเอกสารขออนุญาตให้ได้",
    ],
  },
  solar_battery: {
    key: "solar_battery",
    label: "แบตเตอรี่เก็บไฟ ใช้ตอนกลางคืน/ไฟดับ",
    hint: "เก็บไฟที่ผลิตเกินตอนกลางวัน ไว้ใช้ตอนเย็นหรือตอนไฟดับ",
    cls: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    icon: "battery",
    installer: true,
    detail: [
      "แบตเตอรี่ลิเธียม (LFP) เก็บไฟส่วนเกินจากกลางวัน ไว้ใช้ตอนกลางคืนที่ไม่มีแดด",
      "ความจุ ~7 kWh ใช้กับโหลดพื้นฐาน (ตู้เย็น ไฟ พัดลม ทีวี Wi-Fi) ได้ประมาณ 1 คืน หรือแอร์ 1 ตัวราว 2-3 ชม.",
      "ต้องใช้คู่กับอินเวอร์เตอร์รุ่น Hybrid ยี่ห้อเดียวกันเท่านั้น จึงจะทำงานร่วมกันได้",
      "ขยายเพิ่มโมดูลภายหลังได้ ถ้าต้องการสำรองไฟนานขึ้น",
    ],
  },
  solar_panel_big: {
    key: "solar_panel_big",
    label: "แผงโซลาร์ ผลิตไฟให้บ้าน",
    hint: "แผงติดหลังคา ยิ่งจำนวนแผงมาก ยิ่งผลิตไฟได้มาก",
    cls: "bg-yellow-100 text-yellow-700 ring-yellow-200",
    icon: "solar",
    installer: true,
    detail: [
      "แผงโซลาร์แปลงแสงแดดเป็นไฟฟ้า ยิ่งวัตต์สูง ยิ่งผลิตไฟได้มากต่อพื้นที่หลังคา",
      "ประมาณคร่าว ๆ: แผง 1 kW ผลิตไฟได้ราว 4 หน่วย (kWh) ต่อวันในเมืองไทย",
      "ควรติดฝั่งหลังคาที่รับแดดเต็ม ไม่มีเงาต้นไม้หรืออาคารบัง",
      "ต้องเลือกจำนวนแผงให้พอดีกับขนาดอินเวอร์เตอร์ — เราช่วยคำนวณให้ได้",
    ],
  },
  solar_panel_small: {
    key: "solar_panel_small",
    label: "แผงเล็ก สำหรับกล้อง/อุปกรณ์ IoT",
    hint: "ใช้ชาร์จกล้องวงจรปิดไร้สายหรือเซ็นเซอร์ ไม่ต้องเดินสายไฟ",
    cls: "bg-sky-100 text-sky-700 ring-sky-200",
    icon: "solar",
    detail: [
      "แผงขนาดเล็ก (2-90W) ออกแบบมาชาร์จกล้องไร้สายหรืออุปกรณ์ IoT โดยเฉพาะ",
      "ติดจุดที่ไม่มีปลั๊กไฟ เช่น รั้ว เสาไฟ สวน โรงจอดรถ",
      "ไม่ได้ใช้ผลิตไฟเข้าบ้าน และต่อกับอินเวอร์เตอร์บ้านไม่ได้",
      "ควรเลือกแผงที่รองรับรุ่นกล้องของคุณ (หัวต่อ/แรงดันต้องตรงกัน)",
    ],
  },
  solar_cable: {
    key: "solar_cable",
    label: "สายไฟ/อุปกรณ์ติดตั้งระบบโซลาร์",
    hint: "สาย PV ทนแดดทนความร้อน สำหรับเดินสายจากแผงถึงอินเวอร์เตอร์",
    cls: "bg-slate-100 text-slate-700 ring-slate-200",
    icon: "cable",
    installer: true,
    detail: [
      "สาย PV (Solar Cable) ออกแบบมาทน UV ความร้อน และแรงดัน DC สูงโดยเฉพาะ ห้ามใช้สายไฟบ้านแทน",
      "ขนาด 4 mm² เป็นมาตรฐานที่ใช้กันทั่วไปสำหรับระบบบ้านพักอาศัย",
      "นิยมใช้สีแดง (+) และสีดำ (−) เพื่อไม่ให้ต่อขั้วสลับกัน",
      "การเดินสาย DC ควรให้ช่างที่มีประสบการณ์ทำ เพราะเสี่ยงเกิดอาร์ก/ไฟไหม้ถ้าต่อไม่แน่น",
    ],
  },
};

function getSolarProfile(t: string): UsageProfile {
  if (/cable|สายไฟ|connector|mc4|rail|ราง/.test(t)) return SOLAR_PROFILES.solar_cable;
  if (/battery|แบตเตอรี่|luna2000|kwh/.test(t)) return SOLAR_PROFILES.solar_battery;
  if (/inverter|อินเวอร์เตอร์|sun2000|sun-2000|controller/.test(t)) {
    const kw = Number(t.match(/(\d{1,3})\s*k(?:w|tl)/)?.[1] ?? 0);
    if (kw >= 15) return SOLAR_PROFILES.solar_inv_large;
    if (kw >= 8) return SOLAR_PROFILES.solar_inv_medium;
    return SOLAR_PROFILES.solar_inv_small;
  }
  if (/panel|แผง/.test(t)) {
    const w = Number(t.match(/(\d{1,4}(?:\.\d)?)\s*w\b/)?.[1] ?? 0);
    return w > 0 && w < 150 ? SOLAR_PROFILES.solar_panel_small : SOLAR_PROFILES.solar_panel_big;
  }
  return SOLAR_PROFILES.solar_panel_big;
}



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
  if (c.includes("cctv") || c.includes("security")) {
    return getCctvProfile(`${input.name ?? ""} ${input.description ?? ""}`.toLowerCase());
  }
  if (c.includes("webcam") || c.includes("conference")) {
    return getCamProfile(`${input.name ?? ""} ${input.description ?? ""}`.toLowerCase());
  }
  if (c.includes("solar") || c.includes("energy")) {
    return getSolarProfile(`${input.name ?? ""} ${input.description ?? ""}`.toLowerCase());
  }


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

/** เนื้อหาอธิบายแบบยาว + ปุ่มติดต่อช่าง (ใช้ร่วมกันทั้ง dialog และ info box) */
function ProfileDetail({ p }: { p: UsageProfile }) {
  return (
    <div className="space-y-2 text-[13px] text-slate-600">
      <ul className="list-disc space-y-1 pl-4">
        {p.detail?.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
      {p.installer && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-slate-700">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
            <Wrench className="h-4 w-4" />
            ต้องการช่างติดตั้ง? เราจัดการให้
          </div>
          <p className="mt-1">
            ENT Group เป็นสะพานเชื่อมระหว่างคุณกับทีมช่างที่มีประสบการณ์ — ช่วยประเมินขนาดระบบให้เหมาะกับค่าไฟบ้านคุณ
            จัดหาช่าง นัดหมายวันเข้าสำรวจหน้างานและติดตั้ง รวมถึงแนะนำเรื่องเอกสารขออนุญาตการไฟฟ้า
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href="tel:020456104"
              className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-[12px] font-semibold text-white hover:bg-emerald-700"
            >
              <Phone className="h-3.5 w-3.5" />
              โทรปรึกษา 02-045-6104
            </a>
            <a
              href="mailto:sales@entgroup.co.th"
              className="inline-flex items-center rounded border border-emerald-300 bg-white px-2.5 py-1 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              sales@entgroup.co.th
            </a>
            <LineQrDialog>
              <button
                type="button"
                className="inline-flex items-center rounded border border-emerald-300 bg-white px-2.5 py-1 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                LINE @entgroup
              </button>
            </LineQrDialog>
          </div>
        </div>
      )}
    </div>
  );
}

/** Small badge for product cards. คลิกได้เมื่อมีคำอธิบายเพิ่มเติม */
export function UsageBadge(props: {
  category?: string | null;
  name?: string | null;
  description?: string | null;
  price?: number | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const p = getUsageProfile(props);
  if (!p) return null;
  const Icon = ICON[p.icon];
  const cls = `mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${p.cls} ${props.className ?? ""}`;

  if (!p.detail?.length) {
    return (
      <span title={p.hint} className={cls}>
        <Icon className="h-3 w-3" />
        {p.label}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        title={p.hint}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={`${cls} cursor-pointer hover:brightness-95`}
      >
        <Icon className="h-3 w-3" />
        {p.label}
        <Info className="h-3 w-3 opacity-70" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
          onClick={(e: ReactMouseEvent) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Icon className="h-4 w-4" />
              {p.label}
            </DialogTitle>
            <DialogDescription>{p.hint}</DialogDescription>
          </DialogHeader>
          <ProfileDetail p={p} />
        </DialogContent>
      </Dialog>
    </>
  );
}


/** Fuller explainer for the product detail page. */
export function UsageInfoBox(props: {
  category?: string | null;
  name?: string | null;
  description?: string | null;
  price?: number | null;
}) {
  const [open, setOpen] = useState(false);
  const p = getUsageProfile(props);
  if (!p) return null;
  const Icon = ICON[p.icon];
  return (
    <div className="mt-4 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-[13px]">
      <div className="mb-1 flex items-center gap-2 font-semibold text-slate-900">
        <Icon className="h-4 w-4" />
        เหมาะกับ: {p.label}
      </div>
      <div className="pl-6 text-slate-600">{p.hint}</div>

      {p.detail?.length ? (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="ml-6 mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-700 hover:underline"
          >
            {open ? "ย่อคำอธิบาย" : "ดูคำอธิบายเพิ่มเติม"}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div className="ml-6 mt-2 space-y-2 border-l-2 border-emerald-200 pl-3 text-slate-600">
              <ul className="list-disc space-y-1 pl-4">
                {p.detail.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>

              {p.installer && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-slate-700">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                    <Wrench className="h-4 w-4" />
                    ต้องการช่างติดตั้ง? เราจัดการให้
                  </div>
                  <p className="mt-1">
                    ENT Group เป็นสะพานเชื่อมระหว่างคุณกับทีมช่างโซลาร์ที่มีประสบการณ์ — ช่วยประเมินขนาดระบบให้เหมาะกับค่าไฟบ้านคุณ
                    จัดหาช่าง นัดหมายวันเข้าสำรวจหน้างานและติดตั้ง รวมถึงแนะนำเรื่องเอกสารขออนุญาตการไฟฟ้า
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a
                      href="tel:021147974"
                      className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-[12px] font-semibold text-white hover:bg-emerald-700"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      โทรปรึกษา 02-114-7974
                    </a>
                    <a
                      href="mailto:sales@entgroup.co.th"
                      className="inline-flex items-center rounded border border-emerald-300 bg-white px-2.5 py-1 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50"
                    >
                      sales@entgroup.co.th
                    </a>
                    <LineQrDialog>
                      <button
                        type="button"
                        className="inline-flex items-center rounded border border-emerald-300 bg-white px-2.5 py-1 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50"
                      >
                        LINE @entgroup
                      </button>
                    </LineQrDialog>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

