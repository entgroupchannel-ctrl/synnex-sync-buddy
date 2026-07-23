import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Copy, Package } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { priceFmt, type CartItem } from "@/lib/cart";
import { toast } from "sonner";

type OrderSnapshot = {
  id: string;
  payment: "transfer" | "cod";
  total: number;
  items: CartItem[];
  customer: { customer_name: string; customer_phone: string; customer_email: string; customer_address: string };
  created_at: string;
};

export const Route = createFileRoute("/order/$id")({
  ssr: false,
  component: OrderConfirm,
  head: ({ params }) => ({
    meta: [
      { title: `คำสั่งซื้อ #${params.id.slice(0, 8)} — IT Dealer` },
      { name: "description", content: "ยืนยันคำสั่งซื้อสำเร็จ" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const BANK = {
  name: "IT Dealer Co., Ltd.",
  bank: "ธนาคารกสิกรไทย (KBank)",
  account: "123-4-56789-0",
};

function OrderConfirm() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<OrderSnapshot | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`order-${id}`);
      if (raw) setOrder(JSON.parse(raw));
    } catch {}
  }, [id]);

  const copyAcct = () => {
    navigator.clipboard.writeText(BANK.account);
    toast.success("คัดลอกเลขบัญชีแล้ว");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border bg-white p-6 md:p-10 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-16 w-16 text-[color:var(--brand-green)]" />
          <h1 className="mt-4 text-2xl font-black text-[color:var(--brand-navy)] md:text-3xl">สั่งซื้อสำเร็จ</h1>
          <div className="mt-1 text-sm text-slate-500">
            เลขที่คำสั่งซื้อ · <span className="font-mono font-bold text-slate-800">#{id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="mt-3 rounded-lg bg-orange-50 p-3 text-sm text-[color:var(--brand-orange-dark)]">
            ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง เพื่อยืนยันรายละเอียดและค่าจัดส่ง
          </div>
        </div>

        {order && order.payment === "transfer" && (
          <div className="mt-4 rounded-2xl border bg-white p-6">
            <h2 className="mb-3 font-bold text-[color:var(--brand-navy)]">ข้อมูลการโอนเงิน</h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">ธนาคาร</span><span>{BANK.bank}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">ชื่อบัญชี</span><span>{BANK.name}</span></div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">เลขที่บัญชี</span>
                <button onClick={copyAcct} className="inline-flex items-center gap-1.5 font-mono font-bold text-[color:var(--brand-navy)] hover:text-[color:var(--brand-orange)]">
                  {BANK.account} <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>ยอดที่ต้องชำระ</span>
                <span className="text-[color:var(--brand-orange)]">{priceFmt.format(order.total)}</span>
              </div>
            </div>
          </div>
        )}

        {order && (
          <div className="mt-4 rounded-2xl border bg-white p-6">
            <h2 className="mb-3 font-bold text-[color:var(--brand-navy)]">รายการสั่งซื้อ</h2>
            <div className="space-y-2">
              {order.items.map((it) => (
                <div key={it.id} className="flex items-center gap-3 border-b pb-2 last:border-b-0 last:pb-0">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded bg-slate-50">
                    {it.image_url ? <img src={it.image_url} alt={it.name} className="h-full w-full object-contain" /> : <Package className="h-6 w-6 text-slate-300" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 text-sm font-medium">{it.name}</div>
                    <div className="text-xs text-slate-500">× {it.qty}</div>
                  </div>
                  <div className="text-sm font-semibold">{priceFmt.format(it.price * it.qty)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link to="/">เลือกซื้อสินค้าเพิ่มเติม</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
