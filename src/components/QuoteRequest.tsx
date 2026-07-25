/**
 * ============================================================================
 * FEATURE: ราคาสินค้าเกิน ฿70,000 → แสดง "ขอใบเสนอราคา" แทนราคา
 * ============================================================================
 */

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// ---------------------------------------------------------------------------
// 1) CONFIG — ปรับ threshold ตรงนี้จุดเดียว ไม่ต้องแก้ที่อื่น
// ---------------------------------------------------------------------------
export const QUOTE_ONLY_THRESHOLD = 70000;

export function isQuoteOnly(sellingPrice: number | null | undefined): boolean {
  if (sellingPrice == null) return false;
  return sellingPrice > QUOTE_ONLY_THRESHOLD;
}

// ---------------------------------------------------------------------------
// 2) TYPES
// ---------------------------------------------------------------------------
interface ProductForQuote {
  id: string;
  sku: string;
  name: string;
  selling_price: number;
}

// ---------------------------------------------------------------------------
// 3) MODAL — ฟอร์มกรอกข้อมูลติดต่อ
// ---------------------------------------------------------------------------
function QuoteRequestModal({
  product,
  onClose,
}: {
  product: ProductForQuote;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("กรุณากรอกชื่อและเบอร์โทรศัพท์");
      return;
    }
    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from("quote_requests").insert({
      product_id: product.id,
      product_sku: product.sku,
      product_name: product.name,
      selling_price: product.selling_price,
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      customer_email: email.trim() || null,
      company_name: company.trim() || null,
      message: message.trim() || null,
    });

    setSubmitting(false);

    if (insertError) {
      setError("ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return;
    }
    setSubmitted(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div className="text-center py-6">
            <div className="text-2xl mb-2">✅</div>
            <h3 className="text-lg font-semibold mb-1">ส่งคำขอสำเร็จ</h3>
            <p className="text-sm text-gray-600 mb-4">
              ทีมงานจะติดต่อกลับพร้อมใบเสนอราคาภายใน 24 ชั่วโมง
            </p>
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-900 px-4 py-2 text-white text-sm"
            >
              ปิด
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold mb-1">ขอใบเสนอราคา</h3>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {product.name}
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-sm font-medium">ชื่อ-นามสกุล *</label>
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ชื่อ นามสกุล"
                />
              </div>
              <div>
                <label className="text-sm font-medium">เบอร์โทรศัพท์ *</label>
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08x-xxx-xxxx"
                />
              </div>
              <div>
                <label className="text-sm font-medium">อีเมล</label>
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">บริษัท (ถ้ามี)</label>
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="ชื่อบริษัท"
                />
              </div>
              <div>
                <label className="text-sm font-medium">ข้อความเพิ่มเติม</label>
                <textarea
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="จำนวนที่ต้องการ, ข้อกำหนดพิเศษ ฯลฯ"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border px-4 py-2 text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  {submitting ? "กำลังส่ง..." : "ส่งคำขอ"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4) PriceOrQuote — ใช้แทนที่จุดแสดงราคาเดิม
// ---------------------------------------------------------------------------
export function PriceOrQuote({ product }: { product: ProductForQuote }) {
  const [modalOpen, setModalOpen] = useState(false);

  if (isQuoteOnly(product.selling_price)) {
    return (
      <>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-gray-500">ราคา: กรุณาติดต่อสอบถาม</span>
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            ขอใบเสนอราคา
          </button>
        </div>
        {modalOpen && (
          <QuoteRequestModal product={product} onClose={() => setModalOpen(false)} />
        )}
      </>
    );
  }

  return (
    <span className="text-lg font-bold">
      ฿{product.selling_price.toLocaleString("th-TH")}
    </span>
  );
}
