export type BankAccount = {
  bank: string;
  account: string;
  name: string;
  branch: string;
  type: string;
};

export const BANK_ACCOUNTS: BankAccount[] = [
  {
    bank: "ธนาคารกสิกรไทย (KBank)",
    account: "841-2-05851-9",
    name: "บริษัท อี เอ็น ที กรุ๊ป จำกัด",
    branch: "สาขาบางเดื่อ ปทุมธานี",
    type: "ออมทรัพย์",
  },
  {
    bank: "ธนาคารไทยพาณิชย์ (SCB)",
    account: "406-817747-1",
    name: "บริษัท อี เอ็น ที กรุ๊ป จำกัด",
    branch: "สาขาบางเดื่อ (ปทุมธานี)",
    type: "ออมทรัพย์",
  },
];

// Back-compat alias — primary account
export const BANK_ACCOUNT = BANK_ACCOUNTS[0];

export const COMPANY_INFO = {
  name: "บริษัท อี เอ็น ที กรุ๊ป จำกัด",
  tax_id: "0135558013167",
  email: "accountant@entgroup.co.th",
  phone: "02-045-6104",
  purchase_phone: "082-249-7922",
} as const;

export const SUPPORT_PHONE = COMPANY_INFO.phone;

export const VAT_NOTES = [
  "อัตราค่าบริการยังไม่รวม VAT 7% (สำหรับนิติบุคคล)",
  "นิติบุคคลยอดตั้งแต่ 1,000 บ. ขึ้นไป สามารถหักภาษี ณ ที่จ่าย 3%",
  "ใบเสร็จ/ใบกำกับภาษีจะส่งหลังได้รับหนังสือหักฯ",
] as const;

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "ordered_from_distributor",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_META: Record<OrderStatus, { label: string; badge: string; dot: string }> = {
  pending:                  { label: "รอยืนยัน",       badge: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",   dot: "bg-slate-400" },
  confirmed:                { label: "ยืนยันแล้ว",     badge: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",       dot: "bg-blue-500" },
  ordered_from_distributor: { label: "สั่ง Distributor", badge: "bg-purple-50 text-purple-700 ring-1 ring-purple-200", dot: "bg-purple-500" },
  shipped:                  { label: "จัดส่งแล้ว",     badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",    dot: "bg-amber-500" },
  delivered:                { label: "ส่งถึงแล้ว",     badge: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",       dot: "bg-teal-500" },
  completed:                { label: "เสร็จสิ้น",       badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
  cancelled:                { label: "ยกเลิก",         badge: "bg-red-50 text-red-700 ring-1 ring-red-200",          dot: "bg-red-500" },
};

export const PROGRESS_STEPS: OrderStatus[] = [
  "pending", "confirmed", "ordered_from_distributor", "shipped", "delivered", "completed",
];

export type PaymentStatus = "pending" | "paid";
export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; badge: string }> = {
  pending: { label: "รอชำระ",    badge: "bg-slate-100 text-slate-700 ring-1 ring-slate-200" },
  paid:    { label: "ชำระแล้ว",  badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
};

export const DISTRIBUTOR_META: Record<string, {
  label: string; url: string; dot: string; text: string; bg: string; ring: string;
}> = {
  SYNNEX: { label: "SYNNEX", url: "https://www.synnex.co.th/Dealer",
    dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", ring: "ring-blue-200" },
  VSTECS: { label: "VSTECS", url: "https://online.vstecs.co.th",
    dot: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50", ring: "ring-orange-200" },
};

export function distMeta(d?: string | null) {
  const key = (d ?? "").toUpperCase();
  return DISTRIBUTOR_META[key] ?? { label: key || "อื่นๆ", url: "",
    dot: "bg-slate-400", text: "text-slate-700", bg: "bg-slate-100", ring: "ring-slate-200" };
}

export const bahtFmt = new Intl.NumberFormat("th-TH", {
  style: "currency", currency: "THB", maximumFractionDigits: 0,
});

export function isValidStatus(s: string | null | undefined): s is OrderStatus {
  return !!s && (ORDER_STATUSES as readonly string[]).includes(s);
}
