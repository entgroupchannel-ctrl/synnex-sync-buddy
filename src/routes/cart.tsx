import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, Package, ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { priceFmt, useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  ssr: false,
  component: CartPage,
  head: () => ({ meta: [{ title: "ตะกร้าสินค้า — Synnex Store" }] }),
});

function CartPage() {
  const { items, setQty, remove, total } = useCart();

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "Sarabun, system-ui, sans-serif" }}>
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[#1a237e]">
          <ArrowLeft className="h-4 w-4" /> เลือกซื้อต่อ
        </Link>
        <h1 className="mb-6 text-2xl font-bold">ตะกร้าสินค้า</h1>

        {items.length === 0 ? (
          <div className="rounded-lg border bg-white p-12 text-center text-slate-500">
            ตะกร้าว่างเปล่า — <Link to="/" className="text-[#1565c0] underline">เลือกซื้อสินค้า</Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.id} className="flex gap-4 rounded-lg border bg-white p-4">
                  <div className="grid h-24 w-24 shrink-0 place-items-center rounded-md bg-slate-50">
                    {it.image_url ? (
                      <img src={it.image_url} alt={it.name} className="h-full w-full object-contain p-1" />
                    ) : (
                      <Package className="h-8 w-8 text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-slate-500">{it.sku}</div>
                    <Link
                      to="/product/$slug"
                      params={{ slug: it.slug || it.id }}
                      className="line-clamp-2 text-sm font-medium hover:text-[#1a237e]"
                    >
                      {it.name}
                    </Link>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="inline-flex items-center rounded-md border">
                        <button onClick={() => setQty(it.id, it.qty - 1)} className="px-2 py-1 hover:bg-slate-100">
                          <Minus className="h-3 w-3" />
                        </button>
                        <div className="w-8 text-center text-sm">{it.qty}</div>
                        <button onClick={() => setQty(it.id, it.qty + 1)} className="px-2 py-1 hover:bg-slate-100">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button onClick={() => remove(it.id)} className="text-slate-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#1a237e]">{priceFmt.format(it.price * it.qty)}</div>
                    <div className="text-xs text-slate-500">{priceFmt.format(it.price)} / ชิ้น</div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="h-fit rounded-lg border bg-white p-5">
              <h2 className="mb-3 font-semibold">สรุปคำสั่งซื้อ</h2>
              <div className="flex justify-between text-sm">
                <span>รวม</span>
                <span>{priceFmt.format(total)}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm text-slate-500">
                <span>ค่าจัดส่ง</span>
                <span>คำนวณตอนชำระเงิน</span>
              </div>
              <div className="my-4 h-px bg-slate-200" />
              <div className="flex justify-between text-lg font-bold text-[#1a237e]">
                <span>ยอดรวม</span>
                <span>{priceFmt.format(total)}</span>
              </div>
              <Button asChild className="mt-4 w-full bg-[#ff6f00] hover:bg-[#e65100]" size="lg">
                <Link to="/checkout">ดำเนินการชำระเงิน</Link>
              </Button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
