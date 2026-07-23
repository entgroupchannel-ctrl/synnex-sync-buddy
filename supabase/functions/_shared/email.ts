// Shared helpers for edge functions: Resend + Supabase clients + PDF builder.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';
import fontkit from 'https://esm.sh/@pdf-lib/fontkit@1.1.1';

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const FROM_EMAIL = 'ENT Group IT Shop <noreply@entgroup.co.th>';
export const FALLBACK_FROM = 'ENT Group IT Shop <onboarding@resend.dev>';

export function admin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );
}

export function resendKey(): string {
  const k = Deno.env.get('RESEND_API_KEY_Synex') ?? Deno.env.get('RESEND_API_KEY');
  if (!k) throw new Error('Missing RESEND_API_KEY_Synex');
  return k;
}

export type ResendAttachment = { filename: string; content: string };

export async function sendResend(opts: {
  to: string;
  subject: string;
  html: string;
  attachments?: ResendAttachment[];
}) {
  const key = resendKey();
  const body = {
    from: FROM_EMAIL,
    to: [opts.to],
    subject: opts.subject,
    html: opts.html,
    attachments: opts.attachments,
  };
  let res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let data = await res.json();
  // Fallback to onboarding@resend.dev if domain unverified
  if (!res.ok && String(data?.message ?? '').toLowerCase().includes('domain')) {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, from: FALLBACK_FROM }),
    });
    data = await res.json();
  }
  return { ok: res.ok, data };
}

export async function logEmail(params: {
  order_id: string;
  email_type: string;
  recipient: string;
  subject: string;
  ok: boolean;
  data: { id?: string; message?: string } & Record<string, unknown>;
}) {
  await admin().from('email_logs').insert({
    order_id: params.order_id,
    email_type: params.email_type,
    recipient: params.recipient,
    subject: params.subject,
    status: params.ok ? 'sent' : 'failed',
    resend_message_id: params.data?.id ?? null,
    error_message: params.ok ? null : JSON.stringify(params.data),
  });
}

// -------- PDF helpers (Thai-safe via embedded Sarabun font) --------

let cachedFont: Uint8Array | null = null;
async function sarabunTtf(): Promise<Uint8Array> {
  if (cachedFont) return cachedFont;
  // Google Fonts static: Sarabun Regular TTF
  const url = 'https://github.com/google/fonts/raw/main/ofl/sarabun/Sarabun-Regular.ttf';
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Font fetch failed: ${r.status}`);
  cachedFont = new Uint8Array(await r.arrayBuffer());
  return cachedFont;
}

export type PdfItem = {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

export type PdfDoc = {
  title: string;              // e.g. "ใบเสนอราคา / QUOTATION"
  docNumber: string;          // e.g. "QT-ENT-..."
  dateLabel: string;          // "วันที่ 2026-07-23"
  expiryLabel?: string;       // "ยืนยันภายใน 7 วัน"
  customer: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    company_name?: string | null;
    tax_id?: string | null;
  };
  seller: {
    name: string;
    address: string;
    phone: string;
    email: string;
    tax_id: string;
  };
  items: PdfItem[];
  showVat: boolean;           // if true, include VAT 7% breakdown
  footerNote?: string;
};

export async function buildPdf(doc: PdfDoc): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(await sarabunTtf(), { subset: true });
  const bold = font; // Sarabun regular; keep single font to reduce size

  const page = pdf.addPage([595.28, 841.89]); // A4
  const { width } = page.getSize();
  const marginX = 40;
  let y = 800;

  const drawText = (t: string, x: number, yy: number, size = 11, color = rgb(0.1, 0.1, 0.2)) => {
    page.drawText(t, { x, y: yy, size, font, color });
  };

  // Header — seller left, title right
  drawText(doc.seller.name, marginX, y, 14);
  drawText(doc.seller.address, marginX, y - 16, 9, rgb(0.35, 0.35, 0.45));
  drawText(`โทร ${doc.seller.phone}  ·  ${doc.seller.email}`, marginX, y - 30, 9, rgb(0.35, 0.35, 0.45));
  drawText(`เลขผู้เสียภาษี: ${doc.seller.tax_id}`, marginX, y - 44, 9, rgb(0.35, 0.35, 0.45));

  drawText(doc.title, width - 240, y, 16);
  drawText(`เลขที่: ${doc.docNumber}`, width - 240, y - 20, 10);
  drawText(doc.dateLabel, width - 240, y - 34, 10);
  if (doc.expiryLabel) drawText(doc.expiryLabel, width - 240, y - 48, 10, rgb(0.6, 0.2, 0.2));

  y -= 80;
  page.drawLine({ start: { x: marginX, y }, end: { x: width - marginX, y }, thickness: 1, color: rgb(0.8, 0.8, 0.85) });
  y -= 20;

  // Customer block
  drawText('ลูกค้า:', marginX, y, 11, rgb(0.35, 0.35, 0.45));
  drawText(doc.customer.company_name || doc.customer.name, marginX + 55, y, 11);
  y -= 14;
  if (doc.customer.tax_id) {
    drawText('เลขผู้เสียภาษี:', marginX, y, 10, rgb(0.35, 0.35, 0.45));
    drawText(doc.customer.tax_id, marginX + 80, y, 10);
    y -= 14;
  }
  if (doc.customer.address) {
    drawText('ที่อยู่:', marginX, y, 10, rgb(0.35, 0.35, 0.45));
    // wrap manually at ~80 chars
    const addr = doc.customer.address;
    const lines = addr.match(/.{1,80}/g) ?? [addr];
    for (const line of lines) { drawText(line, marginX + 45, y, 10); y -= 12; }
  }
  if (doc.customer.phone) { drawText(`โทร ${doc.customer.phone}`, marginX, y, 10, rgb(0.35, 0.35, 0.45)); y -= 14; }
  y -= 8;

  // Items table
  const colX = { idx: marginX, name: marginX + 30, qty: marginX + 300, price: marginX + 350, total: marginX + 440 };
  page.drawRectangle({ x: marginX, y: y - 4, width: width - marginX * 2, height: 20, color: rgb(0.94, 0.96, 1) });
  drawText('ลำดับ', colX.idx + 2, y + 4, 10, rgb(0.15, 0.2, 0.4));
  drawText('รายการ', colX.name, y + 4, 10, rgb(0.15, 0.2, 0.4));
  drawText('จำนวน', colX.qty, y + 4, 10, rgb(0.15, 0.2, 0.4));
  drawText('ราคา/หน่วย', colX.price, y + 4, 10, rgb(0.15, 0.2, 0.4));
  drawText('รวม', colX.total, y + 4, 10, rgb(0.15, 0.2, 0.4));
  y -= 20;

  let subtotal = 0;
  doc.items.forEach((it, i) => {
    drawText(String(i + 1), colX.idx + 2, y, 10);
    // clip name to ~40 chars
    const name = it.product_name.length > 40 ? it.product_name.slice(0, 40) + '…' : it.product_name;
    drawText(name, colX.name, y, 10);
    drawText(String(it.quantity), colX.qty, y, 10);
    drawText(Number(it.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 }), colX.price, y, 10);
    drawText(Number(it.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 }), colX.total, y, 10);
    subtotal += Number(it.subtotal);
    y -= 16;
  });

  y -= 8;
  page.drawLine({ start: { x: marginX, y }, end: { x: width - marginX, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.85) });
  y -= 20;

  // Totals
  const rightLabel = (label: string, val: string, size = 11, boldRow = false) => {
    drawText(label, width - 240, y, size, rgb(0.35, 0.35, 0.45));
    drawText(val, width - 120, y, size, boldRow ? rgb(0.1, 0.15, 0.35) : rgb(0.1, 0.1, 0.2));
    y -= 16;
  };
  const money = (n: number) => `฿ ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  if (doc.showVat) {
    const base = subtotal / 1.07;
    const vat = subtotal - base;
    rightLabel('ราคาก่อน VAT', money(base));
    rightLabel('ภาษีมูลค่าเพิ่ม 7%', money(vat));
    rightLabel('รวมทั้งสิ้น', money(subtotal), 13, true);
  } else {
    rightLabel('รวมทั้งสิ้น', money(subtotal), 13, true);
  }

  y -= 30;
  drawText(doc.footerNote ?? '', marginX, y, 9, rgb(0.4, 0.4, 0.5));
  y -= 40;
  drawText('_______________________________', width - 240, y, 10, rgb(0.5, 0.5, 0.6));
  drawText('ผู้มีอำนาจลงนาม / Authorized Signature', width - 240, y - 14, 9, rgb(0.5, 0.5, 0.6));

  return await pdf.save();
}

export const SELLER = {
  name: 'บริษัท อี เอ็น ที กรุ๊ป จำกัด (ENT Group)',
  address: 'สำนักงานใหญ่ กรุงเทพมหานคร',
  phone: '02-045-6104',
  email: 'info@entgroup.co.th',
  tax_id: '0-1055-00000-00-0',
};

export function u8ToBase64(bytes: Uint8Array): string {
  let s = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(s);
}
