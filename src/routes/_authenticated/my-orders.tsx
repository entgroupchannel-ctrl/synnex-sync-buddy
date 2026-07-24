import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { ProductImage } from "@/components/product-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search, Package, Loader2, MessageCircle, ChevronDown, ShoppingBag,
  Truck, CheckCircle2, XCircle, Clock, AlertTriangle,
} from "lucide-react";
import { useSupabaseUser } from "@/lib/auth-sheet";
import { priceFmt, useCart } from "@/lib/cart";

export const Route = createFileRoute("/_authenticated/my-orders")({
  ssr: false,
  component: MyOrdersPage,
  head: () => ({
    meta: [
      { title: "คำสั่งซื้อของฉัน — ENT Group IT Shop" },
      { name: "description", content: "ประวัติและสถานะคำสั่งซื้อของคุณกับ ENT Group IT Shop" },
      { property: "og:title", content: "คำสั่งซื้อของฉัน — ENT Group IT Shop" },
      { property: "og:description", content: "ติดตามคำสั่งซื้อ ชำระเงิน และซื้อซ้ำได้ในหน้าเดียว" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type OrderItem = {
  id?: string;
  product_sku: string | null;
  product_name: string | null;
  product_image_url: string | null;
  unit_price: number | null;
  quantity: number | null;
  subtotal: number | null;
};

type Order = {
  id: string;
  order_number: string | null;
  status: string | null;
  payment_status: string | null;
  total: number | null;
  subtotal?: number | null;
  created_at: string | null;
  delivered_at?: string | null;
  customer_email?: string | null;
  customer_name?: string | null;
  tracking_number?: string | null;
  order_items: OrderItem[];
};

type TabKey = "all" | "pending" | "shipping" | "receiving" | "completed" | "cancelled";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "pending", label: "ที่ต้องชำระ" },
  { key: "shipping", label: "ที่ต้องจัดส่ง" },
  { key: "receiving", label: "ที่ต้องได้รับ" },
  { key: "completed", label: "สำเร็จแล้ว" },
  { key: "cancelled", label: "ยกเลิก" },
];

function statusBucket(o: Order): TabKey {
  const s = (o.status ?? "").toLowerCase();
  const p = (o.payment_status ?? "").toLowerCase();
  if (s === "cancelled") return "cancelled";
  if (s === "completed" || s === "delivered") return "completed";
  if (s === "shipped") return "receiving";
  if (s === "confirmed" || s === "ordered_from_distributor") return "shipping";
  if (s === "pending" || p === "pending" || !s) return "pending";
  return "all";
}

function StatusBadge({ order }: { order: Order }) {
  const bucket = statusBucket(order);
  const map: Record<TabKey, { label: string; cls: string; icon: React.ReactNode }> = {
    pending:    { label: "รอชำระเงิน",         cls: "bg-orange-100 text-orange-700 border-orange-200", icon: <Clock className="h-3.5 w-3.5" /> },
    shipping:   { label: "กำลังเตรียมสินค้า",  cls: "bg-purple-100 text-purple-700 border-purple-200", icon: <Package className="h-3.5 w-3.5" /> },
    receiving:  { label: "กำลังจัดส่ง",         cls: "bg-teal-100 text-teal-700 border-teal-200",       icon: <Truck className="h-3.5 w-3.5" /> },
    completed:  { label: "ส่งสำเร็จแล้ว",       cls: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    cancelled:  { label: "ยกเลิกแล้ว",          cls: "bg-slate-100 text-slate-600 border-slate-200",   icon: <XCircle className="h-3.5 w-3.5" /> },
    all:        { label: "รอดำเนินการ",         cls: "bg-slate-100 text-slate-600 border-slate-200",   icon: <Clock className="h-3.5 w-3.5" /> },
  };
  const s = (order.status ?? "").toLowerCase();
  if (s === "confirmed") {
    return (
      <Badge variant="outline" className="gap-1 border-blue-200 bg-blue-100 text-blue-700">
        <Package className="h-3.5 w-3.5" /> ยืนยันแล้ว
      </Badge>
    );
  }
  const info = map[bucket];
  return (
    <Badge variant="outline" className={`gap-1 ${info.cls}`}>
      {info.icon} {info.label}
    </Badge>
  );
}

function fmtDate(s: string | null | undefined) {
  if (!s) return "";
  return new Date(s).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function MyOrdersPage() {
  const { user } = useSupabaseUser();
  const navigate = useNavigate();
  const cart = useCart();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("all");
  const [q, setQ] = useState("");

  const [confirmReceiveId, setConfirmReceiveId] = useState<string | null>(null);
  const [reorderResult, setReorderResult] = useState<null | {
    added: number;
    skipped: number;
    currentTotal: number;
    lastTotal: number;
  }>(null);

  async function load() {
    if (!user) return;
    setLoading(true);
    const filter = user.email
      ? `user_id.eq.${user.id},customer_email.eq.${user.email}`
      : `user_id.eq.${user.id}`;
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, payment_status, total, subtotal, created_at, delivered_at,
        customer_email, customer_name, tracking_number,
        order_items ( id, product_sku, product_name, product_image_url, unit_price, quantity, subtotal )
      `)
      .or(filter)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setOrders((data as unknown as Order[]) ?? []);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id, user?.email]);

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = { all: 0, pending: 0, shipping: 0, receiving: 0, completed: 0, cancelled: 0 };
    for (const o of orders) {
      c.all++;
      const b = statusBucket(o);
      c[b]++;
    }
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return orders.filter((o) => {
      if (tab !== "all" && statusBucket(o) !== tab) return false;
      if (!query) return true;
      if ((o.order_number ?? "").toLowerCase().includes(query)) return true;
      return (o.order_items ?? []).some((it) => (it.product_name ?? "").toLowerCase().includes(query));
    });
  }, [orders, tab, q]);

  async function handleReorder(order: Order) {
    const items = order.order_items ?? [];
    if (items.length === 0) return toast.error("ไม่พบสินค้าในคำสั่งซื้อนี้");
    const skus = items.map((i) => i.product_sku).filter(Boolean) as string[];
    const { data: products, error } = await supabase
      .from("synnex_products")
      .select("sku, slug, name, image_url, distributor, selling_price, member_price, b2b_price, price_approved, stock_status")
      .in("sku", skus);
    if (error) return toast.error(error.message);

    let added = 0;
    let skipped = 0;
    let currentTotal = 0;

    for (const it of items) {
      const p = (products ?? []).find((x: { sku: string }) => x.sku === it.product_sku);
      if (!p || !p.price_approved) { skipped++; continue; }
      const price = Number(p.selling_price ?? it.unit_price ?? 0);
      const qty = it.quantity ?? 1;
      cart.add({
        id: p.sku,
        sku: p.sku,
        slug: p.slug ?? null,
        name: p.name ?? it.product_name ?? "",
        image_url: p.image_url ?? null,
        distributor: p.distributor ?? null,
        price,
      }, qty);
      added += qty;
      currentTotal += price * qty;
    }


    const lastTotal = items.reduce((s, i) => s + (Number(i.subtotal) || Number(i.unit_price ?? 0) * (i.quantity ?? 1)), 0);
    setReorderResult({ added, skipped, currentTotal, lastTotal });
  }

  async function confirmReceive(orderId: string) {
    const { error } = await supabase
      .from("orders")
      .update({ status: "completed", delivered_at: new Date().toISOString() })
      .eq("id", orderId);
    setConfirmReceiveId(null);
    if (error) return toast.error(error.message);
    toast.success("ขอบคุณที่ซื้อสินค้ากับ ENT Group!");
    load();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      {/* Sticky tabs */}
      <div className="sticky top-16 z-30 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-2 sm:px-4">
          <div className="scrollbar-none flex gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const active = tab === t.key;
              const count = counts[t.key];
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition sm:px-4 ${
                    active
                      ? "border-[color:var(--brand-orange)] text-[color:var(--brand-orange)]"
                      : "border-transparent text-slate-600 hover:text-[color:var(--brand-navy)]"
                  }`}
                >
                  {t.label}
                  {count > 0 && t.key !== "all" && (
                    <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาโดยใช้ชื่อผู้ขาย หมายเลขคำสั่งซื้อ หรือชื่อสินค้า"
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> กำลังโหลด...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onReorder={() => handleReorder(order)}
                onConfirmReceive={() => setConfirmReceiveId(order.id)}
                onTrack={() => navigate({ to: "/track/$orderNumber", params: { orderNumber: order.order_number ?? "" } })}
                onPay={() => navigate({ to: "/order/$orderNumber", params: { orderNumber: order.order_number ?? "" } })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirm receive */}
      <AlertDialog open={!!confirmReceiveId} onOpenChange={(o) => !o && setConfirmReceiveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันว่าได้รับสินค้าแล้ว?</AlertDialogTitle>
            <AlertDialogDescription>
              เมื่อยืนยันแล้วจะไม่สามารถขอคืนเงินได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmReceiveId && confirmReceive(confirmReceiveId)}>
              ยืนยัน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reorder result */}
      <Dialog open={!!reorderResult} onOpenChange={(o) => !o && setReorderResult(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>ผลการซื้ออีกครั้ง</DialogTitle>
          </DialogHeader>
          {reorderResult && (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-emerald-50 p-3 text-emerald-800">
                ✅ เพิ่มลงตะกร้าแล้ว {reorderResult.added} รายการ
              </div>
              {reorderResult.skipped > 0 && (
                <div className="rounded-lg bg-amber-50 p-3 text-amber-800">
                  ⚠️ สินค้าหมดหรือยังไม่พร้อม {reorderResult.skipped} รายการ
                </div>
              )}
              <div className="space-y-1 border-t pt-3">
                <div className="flex justify-between"><span className="text-slate-600">ราคาปัจจุบัน</span><span className="font-semibold">{priceFmt.format(reorderResult.currentTotal)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">ครั้งที่แล้ว</span><span>{priceFmt.format(reorderResult.lastTotal)}</span></div>
                {reorderResult.currentTotal !== reorderResult.lastTotal && (
                  <div className={`flex justify-between font-semibold ${reorderResult.currentTotal > reorderResult.lastTotal ? "text-red-600" : "text-emerald-600"}`}>
                    <span>{reorderResult.currentTotal > reorderResult.lastTotal ? "↑ ราคาขึ้น" : "↓ ราคาลง"}</span>
                    <span>{priceFmt.format(Math.abs(reorderResult.currentTotal - reorderResult.lastTotal))}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => setReorderResult(null)}>ซื้อต่อ</Button>
            <Button
              className="bg-[color:var(--brand-orange)] hover:bg-[color:var(--brand-orange-dark)]"
              onClick={() => { setReorderResult(null); navigate({ to: "/cart" }); }}
            >
              ไปที่ตะกร้า
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderCard({
  order, onReorder, onConfirmReceive, onTrack, onPay,
}: {
  order: Order;
  onReorder: () => void;
  onConfirmReceive: () => void;
  onTrack: () => void;
  onPay: () => void;
}) {
  const bucket = statusBucket(order);
  const s = (order.status ?? "").toLowerCase();
  const items = order.order_items ?? [];

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      {/* Header */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b bg-slate-50 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <ShoppingBag className="h-4 w-4 shrink-0 text-[color:var(--brand-navy)]" />
          <span className="truncate text-sm font-semibold text-[color:var(--brand-navy)]">ENT Group IT Shop</span>
          <a
            href="https://line.me/R/ti/p/@entgroup"
            target="_blank"
            rel="noreferrer"
            className="hidden shrink-0 items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700 sm:inline-flex"
          >
            <MessageCircle className="h-3 w-3" /> พูดคุย
          </a>
        </div>
        <StatusBadge order={order} />
      </div>

      {/* Items */}
      <Link
        to="/order/$orderNumber"
        params={{ orderNumber: order.order_number ?? "" }}
        className="block divide-y hover:bg-slate-50/50"
      >
        {items.slice(0, 3).map((it, idx) => (
          <div key={it.id ?? idx} className="grid grid-cols-[64px_minmax(0,1fr)_auto] gap-3 px-4 py-3 sm:grid-cols-[80px_minmax(0,1fr)_auto]">
            <ProductImage
              src={it.product_image_url ?? ""}
              alt={it.product_name ?? ""}
              className="h-16 w-16 rounded border object-cover sm:h-20 sm:w-20"
            />
            <div className="min-w-0">
              <div className="line-clamp-2 text-sm text-slate-800">{it.product_name ?? "สินค้า"}</div>
              <div className="mt-0.5 text-xs text-slate-500">{it.product_sku}</div>
            </div>
            <div className="shrink-0 text-right text-sm">
              <div className="text-slate-500">x{it.quantity ?? 1}</div>
              <div className="font-semibold text-slate-800">
                {priceFmt.format(Number(it.subtotal ?? (Number(it.unit_price ?? 0) * (it.quantity ?? 1))))}
              </div>
            </div>
          </div>
        ))}
        {items.length > 3 && (
          <div className="px-4 py-2 text-center text-xs text-slate-500">+ อีก {items.length - 3} รายการ</div>
        )}
      </Link>

      {/* Total */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-white px-4 py-2.5">
        <div className="text-xs text-slate-500">
          #{order.order_number} · {fmtDate(order.created_at)}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-slate-500">รวมการสั่งซื้อ:</span>
          <span className="text-lg font-black text-[color:var(--brand-orange)]">
            {priceFmt.format(Number(order.total ?? 0))}
          </span>
        </div>
      </div>

      {/* Review promo */}
      {bucket === "completed" && (
        <div className="border-t bg-emerald-50/50 px-4 py-2 text-xs text-emerald-800">
          รีวิวเลยตอนนี้ เพื่อรับ ENT Points
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap justify-end gap-2 border-t bg-white px-4 py-3">
        {bucket === "pending" && (
          <>
            <Button size="sm" variant="outline">ยกเลิกคำสั่งซื้อ</Button>
            <Button size="sm" className="bg-[color:var(--brand-orange)] hover:bg-[color:var(--brand-orange-dark)]" onClick={onPay}>
              ชำระเงิน
            </Button>
          </>
        )}
        {(s === "confirmed" || s === "ordered_from_distributor") && (
          <Button size="sm" variant="outline" asChild>
            <a href="https://line.me/R/ti/p/@entgroup" target="_blank" rel="noreferrer">ติดต่อร้านค้า</a>
          </Button>
        )}
        {bucket === "receiving" && (
          <>
            <Button size="sm" variant="outline" onClick={onTrack}>
              <Truck className="mr-1 h-4 w-4" /> ติดตามพัสดุ
            </Button>
            <Button size="sm" className="bg-[color:var(--brand-orange)] hover:bg-[color:var(--brand-orange-dark)]" onClick={onConfirmReceive}>
              ยืนยันการได้รับสินค้า
            </Button>
          </>
        )}
        {bucket === "completed" && (
          <>
            <Button size="sm" variant="outline" disabled>ให้คะแนน</Button>
            <Button size="sm" variant="outline" onClick={onReorder}>ซื้ออีกครั้ง</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  เพิ่มเติม <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <AlertTriangle className="mr-2 h-4 w-4" /> ขอคืนเงิน
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://line.me/R/ti/p/@entgroup" target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" /> ติดต่อร้านค้า
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
        {bucket === "cancelled" && (
          <Button size="sm" variant="outline" onClick={onReorder}>ซื้ออีกครั้ง</Button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: TabKey }) {
  const msg: Record<TabKey, { icon: React.ReactNode; text: string }> = {
    all:        { icon: <ShoppingBag className="h-16 w-16" />, text: "ยังไม่มีคำสั่งซื้อ" },
    pending:    { icon: <CheckCircle2 className="h-16 w-16" />, text: "ไม่มีรายการที่ต้องชำระ" },
    shipping:   { icon: <Package className="h-16 w-16" />, text: "ไม่มีรายการที่รอจัดส่ง" },
    receiving:  { icon: <Truck className="h-16 w-16" />, text: "ไม่มีรายการที่รอรับสินค้า" },
    completed:  { icon: <CheckCircle2 className="h-16 w-16" />, text: "ยังไม่มีคำสั่งซื้อที่สำเร็จ" },
    cancelled:  { icon: <XCircle className="h-16 w-16" />, text: "ไม่มีคำสั่งซื้อที่ยกเลิก" },
  };
  const m = msg[tab];
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      {m.icon}
      <div className="mt-4 text-base text-slate-600">{m.text}</div>
      <Button asChild className="mt-6 bg-[color:var(--brand-orange)] hover:bg-[color:var(--brand-orange-dark)]">
        <Link to="/">เลือกซื้อสินค้า</Link>
      </Button>
    </div>
  );
}
