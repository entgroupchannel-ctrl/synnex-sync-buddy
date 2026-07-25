/**
 * src/routes/_authenticated/admin.purchase-orders.$poId.tsx  (ไฟล์ใหม่)
 * หน้ารายละเอียด PO ใบเดียว — ดูรายการ, กดสร้าง/ดาวน์โหลด PDF ส่งให้ distributor
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

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
  if (poQ.isLoading) return <div className="p-6 text-sm text-slate-500">กำลังโหลด...</div>;
  if (!po) return <div className="p-6 text-sm text-red-600">ไม่พบ PO นี้</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{po.po_number}</h1>
          <p className="text-sm text-slate-500">Distributor: {po.distributor} · สถานะ: {po.status}</p>
        </div>
        <div className="flex gap-2">
          <Button disabled={generating} onClick={() => generatePdf.mutate()}>
            {generating ? "กำลังสร้าง..." : po.pdf_url ? "สร้าง PDF ใหม่" : "สร้าง PDF"}
          </Button>
          {po.pdf_url && (
            <Button variant="outline" onClick={() => window.open(po.pdf_url!, "_blank")}>
              เปิด PDF ล่าสุด
            </Button>
          )}
        </div>
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
    </div>
  );
}
