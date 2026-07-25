/**
 * src/components/QuoteRequest.tsx  (ไฟล์ใหม่)
 * ราคาสินค้าเกิน ฿70,000 → ซ่อนราคา ให้กรอกฟอร์มขอใบเสนอราคาแทน
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileText } from "lucide-react";

export const QUOTE_ONLY_THRESHOLD = 70000;

/** true เมื่อราคาสินค้าสูงเกินเกณฑ์ที่ต้องขอใบเสนอราคาแทนการแสดงราคา/ซื้อออนไลน์ */
export function isQuoteOnly(sellingPrice: number | null | undefined): boolean {
  if (sellingPrice == null) return false;
  return Number(sellingPrice) > QUOTE_ONLY_THRESHOLD;
}

interface QuoteProduct {
  id: string;
  sku: string;
  name: string | null;
  selling_price: number | null;
}

export function QuoteRequestButton({ product }: { product: QuoteProduct }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("กรุณากรอกชื่อและเบอร์โทรศัพท์");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("quote_requests").insert({
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

    if (error) {
      toast.error("ส่งคำขอไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return;
    }
    toast.success("ส่งคำขอใบเสนอราคาแล้ว ทีมงานจะติดต่อกลับภายใน 24 ชม.");
    setOpen(false);
    setName(""); setPhone(""); setEmail(""); setCompany(""); setMessage("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full bg-[color:var(--brand-navy)] hover:bg-[color:var(--brand-navy-2)]"
      >
        <FileText className="mr-1.5 h-4 w-4" /> ขอใบเสนอราคา
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ขอใบเสนอราคา</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {product.name ?? product.sku}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="qr-name">ชื่อ-นามสกุล *</Label>
            <Input id="qr-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อ นามสกุล" />
          </div>
          <div>
            <Label htmlFor="qr-phone">เบอร์โทรศัพท์ *</Label>
            <Input id="qr-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08x-xxx-xxxx" />
          </div>
          <div>
            <Label htmlFor="qr-email">อีเมล</Label>
            <Input id="qr-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
          </div>
          <div>
            <Label htmlFor="qr-company">บริษัท (ถ้ามี)</Label>
            <Input id="qr-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="ชื่อบริษัท" />
          </div>
          <div>
            <Label htmlFor="qr-message">ข้อความเพิ่มเติม</Label>
            <Textarea id="qr-message" rows={2} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="จำนวนที่ต้องการ ฯลฯ" />
          </div>
          <Button type="submit" disabled={submitting} className="w-full bg-[color:var(--brand-navy)] hover:bg-[color:var(--brand-navy-2)]">
            {submitting ? "กำลังส่ง..." : "ส่งคำขอ"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
