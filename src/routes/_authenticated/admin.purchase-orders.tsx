/**
 * src/routes/_authenticated/admin.purchase-orders.tsx  (ไฟล์ใหม่)
 * หน้า Admin: ดูสินค้าที่รอสั่งจาก distributor (จัดกลุ่มอัตโนมัติ) + กดสร้าง PO
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { distMeta, PO_STATUS_META, type PoStatus } from "@/lib/order-helpers";

import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import {
  getPendingItemsByDistributor,
  generatePurchaseOrder,
} from "@/lib/purchase-order.functions";

export const Route = createFileRoute("/_authenticated/admin/purchase-orders")({
  ssr: false,
  head: () => ({ meta: [{ title: "ใบสั่งซื้อ Distributor — ENT Admin" }] }),
  component: PurchaseOrdersPage,
});

type PoRow = {
  id: string; po_number: string; distributor: string; status: string;
  total_cost: number; total_items: number; created_at: string; pdf_url: string | null;
};

function PurchaseOrdersPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const getPending = useServerFn(getPendingItemsByDistributor);
  const generatePo = useServerFn(generatePurchaseOrder);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  const pendingQ = useQuery({
    queryKey: ["po-pending-by-distributor"],
    queryFn: () => getPending(),
    staleTime: 60_000,
  });

  const poListQ = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("id,po_number,distributor,status,total_cost,total_items,created_at,pdf_url")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as PoRow[];
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (distributor: string) => {
      setGeneratingFor(distributor);
      // ต้องดึง order_item_ids ของ distributor นี้ก่อนส่งไปสร้าง PO
      const { data: items, error } = await supabase
        .from("order_items")
        .select("id, distributor, orders!inner(payment_status, admin_status)")
        .is("po_item_id", null)
        .eq("distributor", distributor)
        .eq("orders.payment_status", "paid")
        .neq("orders.admin_status", "cancelled");
      if (error) throw error;
      const orderItemIds = (items ?? []).map((i: { id: string }) => i.id);
      return generatePo({ data: { distributor, orderItemIds } });
    },
    onSuccess: (res) => {
      toast.success(`สร้าง PO ${res.poNumber} สำเร็จ`);
      qc.invalidateQueries({ queryKey: ["po-pending-by-distributor"] });
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
    onError: (e: Error) => toast.error(e.message || "สร้าง PO ไม่สำเร็จ"),
    onSettled: () => setGeneratingFor(null),
  });

  const pending = pendingQ.data ?? [];
  const poList = poListQ.data ?? [];

  const statusLabel: Record<string, string> = {
    draft: "ร่าง", sent: "ส่งแล้ว", confirmed: "ยืนยันแล้ว",
    shipped: "จัดส่งแล้ว", partially_shipped: "จัดส่งบางส่วน",
    completed: "เสร็จสิ้น", cancelled: "ยกเลิก",
  };

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">ใบสั่งซื้อ Distributor (Drop-ship)</h1>
        <p className="text-sm text-slate-500">รวมสินค้าจากออเดอร์ลูกค้าที่จ่ายเงินแล้ว จัดกลุ่มตาม distributor เพื่อออก PO</p>
      </div>

      {/* ---- ตารางสินค้าที่รอสั่ง ---- */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">รอออก PO</h2>
        {pendingQ.isLoading ? (
          <p className="text-sm text-slate-500">กำลังโหลด...</p>
        ) : pending.length === 0 ? (
          <p className="text-sm text-slate-500">ไม่มีรายการรอสั่งขณะนี้</p>
        ) : (
          <div className="space-y-4">
            {pending.map((group) => (
              <div key={group.distributor} className="rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{group.distributor}</span>
                    <span className="ml-2 text-sm text-slate-500">
                      {group.itemCount} SKU · {group.totalQty} ชิ้น · ฿{group.totalCost.toLocaleString("th-TH")}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    disabled={generatingFor === group.distributor}
                    onClick={() => generateMutation.mutate(group.distributor)}
                  >
                    {generatingFor === group.distributor ? "กำลังสร้าง..." : "สร้าง PO"}
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>ชื่อสินค้า</TableHead>
                      <TableHead className="text-right">จำนวน</TableHead>
                      <TableHead className="text-right">ทุน/หน่วย</TableHead>
                      <TableHead className="text-right">รวม</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.items.map((it) => (
                      <TableRow key={it.sku}>
                        <TableCell className="font-mono text-xs">{it.sku}</TableCell>
                        <TableCell>{it.name}</TableCell>
                        <TableCell className="text-right">{it.qty}</TableCell>
                        <TableCell className="text-right">{it.costPrice.toLocaleString("th-TH")}</TableCell>
                        <TableCell className="text-right">{it.subtotal.toLocaleString("th-TH")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- ตาราง PO ที่สร้างไปแล้ว ---- */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">ประวัติ PO</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>เลขที่ PO</TableHead>
              <TableHead>Distributor</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">รายการ</TableHead>
              <TableHead className="text-right">ยอดรวม (ก่อน VAT)</TableHead>
              <TableHead>วันที่</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {poList.map((po) => {
              const dm = distMeta(po.distributor);
              const sm = PO_STATUS_META[(po.status as PoStatus) ?? "draft"] ?? PO_STATUS_META.draft;
              return (
                <TableRow
                  key={po.id}
                  onClick={() => navigate({ to: "/admin/purchase-orders/$poId", params: { poId: po.id } })}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <TableCell className="font-mono text-xs">{po.po_number}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${dm.bg} ${dm.text} ring-1 ${dm.ring}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${dm.dot}`} />
                      {dm.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${sm.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${sm.dot}`} />
                      {sm.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{po.total_items}</TableCell>
                  <TableCell className="text-right">฿{Number(po.total_cost).toLocaleString("th-TH")}</TableCell>
                  <TableCell>{new Date(po.created_at).toLocaleDateString("th-TH")}</TableCell>
                  <TableCell className="text-right">
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>

    </div>
  );
}
