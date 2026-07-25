/**
 * src/routes/_authenticated/admin.purchase-orders.$poId.tsx
 * หน้ารายละเอียด PO ใบเดียว — ดูรายการ, กดสร้าง/ดาวน์โหลด PDF ส่งให้ distributor
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, FileText, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { distMeta, PO_STATUS_META, vatBreakdown, type PoStatus } from "@/lib/order-helpers";

export const Route = createFileRoute("/_authenticated/admin/purchase-orders/$poId")({
  ssr: false,
  head: () => ({ meta: [{ title: "รายละเอียด PO — ENT Admin" }] }),
  component: PurchaseOrderDetailPage,
});

type PoItem = {
  id: string; product_sku: string; product_name: string | null;
  quantity: number; cost_price: number; subtotal: number;
  ship_to_name: string; ship_to_phone: string; ship_to_address: string;
  ship_to_district: string | null; ship_to_province: string | null; ship_to_postcode: string | null;
  order_number: string; fulfillment_status: string;
};
type Po = {
  id: string; po_number: string; distributor: string; status: string;
  total_cost: number; notes: string | null; pdf_url: string | null;
  created_at: string; purchase_order_items: PoItem[];
};

function PurchaseOrderDetailPage() {
  const { poId } = Route.useParams();
  const qc = useQueryClient();
  const [generating, setGenerating] = useState(false);

  const poQ = useQuery({
    queryKey: ["purchase-order", poId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*, purchase_order_items(*)")
        .eq("id", poId)
        .single();
      if (error) throw error;
      return data as Po;
    },
  });

  const generatePdf = useMutation({
    mutationFn: async () => {
      setGenerating(true);
      const { data, error } = await supabase.functions.invoke("generate-purchase-order", {
        body: { po_id: poId },
      });
      if (error) throw error;
      return data as { pdf_url: string; po_number: string };
    },
    onSuccess: (data) => {
      toast.success("สร้าง PDF สำเร็จ");
      qc.invalidateQueries({ queryKey: ["purchase-order", poId] });
      window.open(data.pdf_url, "_blank");
    },
    onError: (e: Error) => toast.error(e.message || "สร้าง PDF ไม่สำเร็จ"),
    onSettled: () => setGenerating(false),
  });

  const po = poQ.data;

  const [emailOpen, setEmailOpen] = useState(false);
  const [toEmail, setToEmail] = useState("");
  const [toName, setToName] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [sending, setSending] = useState(false);

  const contactQ = useQuery({
    queryKey: ["distributor-contact", poId],
    enabled: emailOpen,
    queryFn: async () => {
      const { data } = await supabase
        .from("distributor_contacts")
        .select("*")
        .eq("distributor", po?.distributor ?? "")
        .maybeSingle();
      return data as { contact_name: string | null; contact_email: string | null } | null;
    },
  });

  const openEmailDialog = () => {
    setToEmail(contactQ.data?.contact_email ?? "");
    setToName(contactQ.data?.contact_name ?? "");
    setSubject(`ใบสั่งซื้อ ${po?.po_number} — ENT Group`);
    setBodyHtml(
      `<p>เรียน ${contactQ.data?.contact_name ?? "ทีมงาน"},</p>
<p>ทางบริษัท อี เอ็น ที กรุ๊ป จำกัด ขอส่งใบสั่งซื้อเลขที่ <b>${po?.po_number}</b> รบกวนตรวจสอบและยืนยันกลับด้วยครับ/ค่ะ</p>`,
    );
    setEmailOpen(true);
  };

  const sendEmail = async () => {
    if (!toEmail) { toast.error("กรุณากรอกอีเมลผู้รับ"); return; }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-po-email", {
        body: { po_id: poId, to_email: toEmail, to_name: toName, subject, body_html: bodyHtml },
      });
      if (error) throw error;
      toast.success("ส่งอีเมลสำเร็จ");
      setEmailOpen(false);
      qc.invalidateQueries({ queryKey: ["purchase-order", poId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ส่งอีเมลไม่สำเร็จ");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (emailOpen && contactQ.data) {
      setToEmail((prev) => prev || contactQ.data?.contact_email || "");
      setToName((prev) => prev || contactQ.data?.contact_name || "");
    }
  }, [emailOpen, contactQ.data]);

  if (poQ.isLoading) return <div className="p-6 text-sm text-slate-500">กำลังโหลด...</div>;
  if (!po) return <div className="p-6 text-sm text-red-600">ไม่พบ PO นี้</div>;

  const dm = distMeta(po.distributor);
  const sm = PO_STATUS_META[(po.status as PoStatus) ?? "draft"] ?? PO_STATUS_META.draft;
  const vat = vatBreakdown(Number(po.total_cost));

  return (
    <div className="space-y-6 p-6">
      <Link
        to="/admin/purchase-orders"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> กลับไปใบสั่งซื้อทั้งหมด
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{po.po_number}</h1>
          <p className="text-sm text-slate-500">{new Date(po.created_at).toLocaleString("th-TH")}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${dm.bg} ${dm.text} ring-1 ${dm.ring}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dm.dot}`} />
              {dm.label}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${sm.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${sm.dot}`} />
              {sm.label}
            </span>
            {po.notes && <span className="text-slate-500">· {po.notes}</span>}
          </div>
        </div>

        <div className="flex gap-2">
          <Button disabled={generating} onClick={() => generatePdf.mutate()}>
            <FileText className="mr-1.5 h-4 w-4" />
            {generating ? "กำลังสร้าง..." : po.pdf_url ? "สร้าง PDF ใหม่" : "สร้าง PDF"}
          </Button>
          {po.pdf_url && (
            <Button variant="outline" onClick={() => window.open(po.pdf_url!, "_blank")}>
              <Download className="mr-1.5 h-4 w-4" /> เปิด PDF ล่าสุด
            </Button>
          )}
          <Button variant="outline" onClick={openEmailDialog}>
            <Mail className="mr-1.5 h-4 w-4" /> ส่งอีเมลถึง Supplier
          </Button>
        </div>
      </div>

      {/* สรุปยอด — แยก VAT ให้ชัดเจน */}
      <div className="max-w-sm rounded-lg border bg-slate-50/60 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">สรุปยอด (สำหรับบันทึกบัญชี)</h2>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">ราคาสินค้า (ก่อน VAT)</dt>
            <dd>฿{vat.exVat.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">ภาษีมูลค่าเพิ่ม 7%</dt>
            <dd>฿{vat.vat.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</dd>
          </div>
          <div className="border-t pt-1.5" />
          <div className="flex justify-between font-semibold">
            <dt>ยอดรวมสุทธิ</dt>
            <dd>฿{vat.total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-slate-400">
          * คำนวณจากยอดต้นทุนที่บันทึกไว้ สมมติว่าเป็นราคาก่อน VAT
        </p>
      </div>

      {/* เอกสารสำหรับส่ง Distributor */}
      <div className="rounded-lg border">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-700">เอกสารสำหรับส่ง Distributor (PDF)</h2>
          {po.pdf_url && (
            <Button size="sm" variant="outline" onClick={() => window.open(po.pdf_url!, "_blank")}>
              <Download className="mr-1.5 h-4 w-4" /> ดาวน์โหลด
            </Button>
          )}
        </div>
        {po.pdf_url ? (
          <iframe
            title={`PO ${po.po_number}`}
            src={po.pdf_url}
            className="h-[600px] w-full rounded-b-lg bg-slate-100"
          />
        ) : (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            ยังไม่ได้สร้างเอกสารสำหรับใบสั่งซื้อนี้ — กดปุ่ม "สร้าง PDF" ด้านบนเพื่อสร้างเอกสาร
          </div>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead className="text-right">จำนวน</TableHead>
            <TableHead className="text-right">ทุน/หน่วย</TableHead>
            <TableHead className="text-right">รวม</TableHead>
            <TableHead>จัดส่งถึง</TableHead>
            <TableHead>เลขออเดอร์</TableHead>
            <TableHead>สถานะจัดส่ง</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {po.purchase_order_items.map((it) => (
            <TableRow key={it.id}>
              <TableCell className="font-mono text-xs">{it.product_sku}</TableCell>
              <TableCell className="text-right">{it.quantity}</TableCell>
              <TableCell className="text-right">{it.cost_price.toLocaleString("th-TH")}</TableCell>
              <TableCell className="text-right">{it.subtotal.toLocaleString("th-TH")}</TableCell>
              <TableCell>
                <div className="font-medium">{it.ship_to_name}</div>
                <div className="text-xs text-slate-500">
                  {[it.ship_to_address, it.ship_to_district, it.ship_to_province, it.ship_to_postcode].filter(Boolean).join(" ")}
                </div>
                <div className="text-xs text-slate-500">โทร {it.ship_to_phone}</div>
              </TableCell>
              <TableCell>{it.order_number}</TableCell>
              <TableCell>{it.fulfillment_status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>ส่งอีเมลใบสั่งซื้อถึง Supplier</DialogTitle>
            <DialogDescription>
              ส่งถึงผู้ติดต่อของ {po.distributor} — แนบลิงก์ PDF ให้อัตโนมัติ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>อีเมลผู้รับ</Label>
              <Input
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="purchasing@distributor.com"
              />
              {!contactQ.data?.contact_email && (
                <p className="text-xs text-amber-600">
                  ยังไม่มีอีเมลบันทึกไว้สำหรับ {po.distributor} — กรอกที่นี่แล้วไปตั้งค่าถาวรที่ตาราง distributor_contacts ทีหลังได้
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>ชื่อผู้ติดต่อ (ถ้ามี)</Label>
              <Input value={toName} onChange={(e) => setToName(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>หัวข้ออีเมล</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>เนื้อหา (HTML)</Label>
              <Textarea rows={8} value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)}>ยกเลิก</Button>
            <Button disabled={sending} onClick={sendEmail}>{sending ? "กำลังส่ง..." : "ส่งอีเมล"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
