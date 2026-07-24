import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCart, getSellingPrice, priceFmt, useCustomerTier } from "@/lib/cart";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Row = {
  product_sku: string;
  product_name: string;
  product_image_url: string | null;
  unit_price: number;
  quantity: number;
};

type Summary = {
  added: number;
  outOfStock: number;
  notApproved: number;
  prevTotal: number;
  currTotal: number;
};

export function ReorderButton({ orderId, className }: { orderId: string; className?: string }) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const { add } = useCart();
  const tier = useCustomerTier();

  const run = async () => {
    setBusy(true);
    try {
      const { data: items } = await supabase
        .from("order_items")
        .select("product_sku,product_name,product_image_url,unit_price,quantity")
        .eq("order_id", orderId);
      const rows = (items ?? []) as Row[];
      if (rows.length === 0) {
        toast.error("ไม่พบสินค้าในคำสั่งซื้อนี้");
        setBusy(false);
        return;
      }
      const skus = rows.map((r) => r.product_sku);
      const { data: products } = await supabase
        .from("synnex_products")
        .select("id,sku,slug,name,image_url,selling_price,member_price,b2b_price,price_approved,stock_status,distributor")
        .in("sku", skus);
      const map = new Map((products ?? []).map((p) => [p.sku, p]));

      let added = 0, outOfStock = 0, notApproved = 0, prevTotal = 0, currTotal = 0;
      for (const r of rows) {
        prevTotal += Number(r.unit_price) * Number(r.quantity);
        const p = map.get(r.product_sku);
        if (!p) { outOfStock += 1; continue; }
        if (!p.price_approved) { notApproved += 1; continue; }
        if (p.stock_status && p.stock_status !== "พร้อมจัดส่ง") { outOfStock += 1; continue; }
        const price = getSellingPrice(p, tier) ?? 0;
        if (price <= 0) { notApproved += 1; continue; }
        add({
          id: p.id,
          sku: p.sku,
          slug: p.slug,
          name: p.name ?? p.sku,
          price,
          image_url: p.image_url,
          distributor: p.distributor,
        }, Number(r.quantity) || 1);
        added += 1;
        currTotal += price * (Number(r.quantity) || 1);
      }
      setSummary({ added, outOfStock, notApproved, prevTotal, currTotal });
      setOpen(true);
    } catch (e) {
      toast.error("ไม่สามารถสั่งซื้อซ้ำได้");
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={run} disabled={busy} className={className}>
        {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
        สั่งซื้ออีกครั้ง / Reorder
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>สั่งซื้ออีกครั้ง</DialogTitle>
          </DialogHeader>
          {summary && (
            <div className="space-y-3 text-sm">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-4 w-4" /> เพิ่มลงตะกร้า {summary.added} รายการ
                </div>
                {summary.outOfStock > 0 && (
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="h-4 w-4" /> สินค้าหมด {summary.outOfStock} รายการ (ข้ามไป)
                  </div>
                )}
                {summary.notApproved > 0 && (
                  <div className="flex items-center gap-2 text-red-700">
                    <XCircle className="h-4 w-4" /> ราคายังไม่พร้อม {summary.notApproved} รายการ
                  </div>
                )}
              </div>
              {summary.added > 0 && (
                <div className="rounded-md border bg-slate-50 p-3 text-slate-700">
                  <div className="text-xs text-slate-500">ราคาอาจเปลี่ยนจากครั้งที่แล้ว</div>
                  <div className="mt-1 flex justify-between"><span>ครั้งนี้:</span><span className="font-bold text-[color:var(--brand-orange)]">{priceFmt.format(summary.currTotal)}</span></div>
                  <div className="flex justify-between text-slate-500"><span>ครั้งก่อน:</span><span>{priceFmt.format(summary.prevTotal)}</span></div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>ซื้อต่อ</Button>
            <Button asChild className="bg-[color:var(--brand-navy)] hover:bg-[color:var(--brand-navy-2)]" disabled={!summary?.added}>
              <Link to="/cart">ไปที่ตะกร้า</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
