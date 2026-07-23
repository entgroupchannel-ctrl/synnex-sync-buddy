import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Search, Package, LogOut, CheckCircle2, XCircle, ClipboardPaste } from "lucide-react";
import { getSyncStatus, listProducts, runSynnexSync } from "@/lib/synnex-sync.functions";
import { supabase } from "@/integrations/supabase/client";

interface ParsedProduct {
  sku: string;
  name: string | null;
  description: string | null;
  price: number | null;
  stock_qty: number | null;
  stock_status: string | null;
  image_url: string | null;
  product_url: string | null;
  brand: string | null;
}

const BASE_URL = "https://www.synnex.co.th/Dealer/";

function parseSynnexHtml(html: string): ParsedProduct[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const items = doc.querySelectorAll(".box-item-product");
  const out: ParsedProduct[] = [];
  const seen = new Set<string>();

  items.forEach((el) => {
    const skuInput = el.querySelector('input[id*="hdProductName"]') as HTMLInputElement | null;
    const sku = skuInput?.value?.trim() || "";
    if (!sku || seen.has(sku)) return;
    seen.add(sku);

    const name = el.querySelector(".product-name a.text-bold")?.textContent?.trim() || null;
    const description = el.querySelector(".product-name .text-cut-line-2")?.textContent?.trim() || null;

    const brandInput = el.querySelector('input[id*="hdItemBrand"]') as HTMLInputElement | null;
    const brand = brandInput?.value?.trim() || null;

    let price: number | null = null;
    const priceText = el.querySelector(".discount-price")?.textContent ?? "";
    const pm = priceText.replace(/[฿,\s]/g, "").match(/-?\d+(?:\.\d+)?/);
    if (pm) {
      const n = Number(pm[0]);
      if (Number.isFinite(n)) price = n;
    }

    let stock_qty: number | null = null;
    const stockText = el.querySelector(".product-onhand")?.textContent ?? "";
    const sm = stockText.match(/(\d+)/);
    if (sm) stock_qty = parseInt(sm[1], 10);

    const stock_status = el.querySelector(".statusReady") ? "พร้อมจัดส่ง" : "สินค้าหมด";

    const imgEl = el.querySelector(".product-img img.img-responsive") as HTMLImageElement | null;
    let image_url = imgEl?.getAttribute("src") || null;
    if (image_url && !/^https?:/i.test(image_url)) {
      try { image_url = new URL(image_url, BASE_URL).toString(); } catch { /* ignore */ }
    }

    const linkEl = el.querySelector(".product-img a") as HTMLAnchorElement | null;
    const href = linkEl?.getAttribute("href") || null;
    const product_url = href
      ? (/^https?:/i.test(href) ? href : BASE_URL + href.replace(/^\/+/, ""))
      : null;

    out.push({ sku, name, description, price, stock_qty, stock_status, image_url, product_url, brand });
  });

  return out;
}

export const Route = createFileRoute("/_authenticated/admin/sync")({
  head: () => ({
    meta: [
      { title: "Synnex Product Sync — Admin" },
      { name: "description", content: "Sync and browse the Synnex Thailand ASUS product catalog." },
      { property: "og:title", content: "Synnex Product Sync — Admin" },
      { property: "og:description", content: "Sync and browse the Synnex Thailand ASUS product catalog." },
    ],
  }),
  component: SyncPage,
});

function formatBaht(n: number | null) {
  if (n === null || n === undefined) return "—";
  return "฿" + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

function SyncPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const runSync = useServerFn(runSynnexSync);
  const fetchStatus = useServerFn(getSyncStatus);
  const fetchList = useServerFn(listProducts);

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState<"all" | "ready" | "out">("all");
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const [importHtml, setImportHtml] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => setPage(1), [debounced, status]);

  const statusQ = useQuery({
    queryKey: ["synnex", "status"],
    queryFn: () => fetchStatus(),
  });

  const listQ = useQuery({
    queryKey: ["synnex", "list", debounced, status, page],
    queryFn: () => fetchList({ data: { search: debounced, status, page } }),
  });

  const syncM = useMutation({
    mutationFn: () => runSync(),
    onSuccess: (res) => {
      if (res.status === "success") {
        toast.success(`ซิงค์สำเร็จ พบสินค้า ${res.productsFound} รายการ`);
      } else {
        toast.error(res.message || "ซิงค์ล้มเหลว");
      }
      qc.invalidateQueries({ queryKey: ["synnex"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : String(err));
      qc.invalidateQueries({ queryKey: ["synnex"] });
    },
  });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const total = statusQ.data?.total ?? 0;
  const latest = statusQ.data?.latest;
  const rows = listQ.data?.rows ?? [];
  const totalPages = Math.max(1, Math.ceil((listQ.data?.count ?? 0) / (listQ.data?.pageSize ?? 20)));

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Toaster richColors position="top-center" />
      <header className="bg-[#1a237e] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 md:px-8">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6" />
            <div>
              <h1 className="text-lg font-semibold md:text-xl">Synnex Product Sync</h1>
              <p className="text-xs text-white/70">Dealer Portal — ASUS Catalog</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={signOut}
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <LogOut className="mr-2 h-4 w-4" /> ออกจากระบบ
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        {/* Stats bar */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard label="สินค้าทั้งหมด" value={total.toLocaleString()} />
          <StatCard label="ซิงค์ล่าสุด" value={formatDate(latest?.finished_at ?? latest?.started_at)} />
          <StatCard
            label="สถานะ"
            value={
              latest ? (
                <span
                  className={
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium " +
                    (latest.status === "success"
                      ? "bg-green-100 text-green-700"
                      : latest.status === "error"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700")
                  }
                >
                  {latest.status === "success" ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : latest.status === "error" ? (
                    <XCircle className="h-3.5 w-3.5" />
                  ) : null}
                  {latest.status}
                </span>
              ) : (
                "—"
              )
            }
          />
          <div className="flex items-center justify-end">
            <Button
              disabled={syncM.isPending}
              onClick={() => syncM.mutate()}
              className="w-full bg-[#1565c0] text-white hover:bg-[#0d47a1] md:w-auto"
            >
              <RefreshCw className={"mr-2 h-4 w-4 " + (syncM.isPending ? "animate-spin" : "")} />
              {syncM.isPending ? "กำลังซิงค์…" : "🔄 Sync Now"}
            </Button>
          </div>
        </section>

        {latest?.status === "error" && latest.message ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {latest.message}
          </p>
        ) : null}

        {/* Filters */}
        <section className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="ค้นหาชื่อสินค้าหรือ SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="md:w-52">
              <SelectValue placeholder="สถานะทั้งหมด" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">สถานะทั้งหมด</SelectItem>
              <SelectItem value="ready">พร้อมจัดส่ง</SelectItem>
              <SelectItem value="out">สินค้าหมด</SelectItem>
            </SelectContent>
          </Select>
        </section>

        {/* Table */}
        <section className="mt-4 overflow-hidden rounded-lg border border-slate-200">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-20">รูป</TableHead>
                <TableHead>ชื่อสินค้า</TableHead>
                <TableHead className="w-40">SKU/Model</TableHead>
                <TableHead className="w-28 text-right">ราคา</TableHead>
                <TableHead className="w-20 text-right">สต็อก</TableHead>
                <TableHead className="w-32">สถานะ</TableHead>
                <TableHead className="w-40">อัปเดต</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQ.isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}>
                        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-500">
                    ไม่พบสินค้า กด "Sync Now" เพื่อดึงข้อมูล
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((p) => (
                  <TableRow key={p.id} className="hover:bg-slate-50">
                    <TableCell>
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name ?? p.sku}
                          className="h-[60px] w-[60px] rounded border border-slate-200 object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-[60px] w-[60px] rounded border border-dashed border-slate-200 bg-slate-50" />
                      )}
                    </TableCell>
                    <TableCell className="max-w-md">
                      {p.product_url ? (
                        <a
                          href={p.product_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-[#1565c0] hover:underline"
                        >
                          {p.name ?? "—"}
                        </a>
                      ) : (
                        <span className="font-medium">{p.name ?? "—"}</span>
                      )}
                      {p.description ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{p.description}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                    <TableCell className="text-right font-medium">{formatBaht(p.price)}</TableCell>
                    <TableCell className="text-right">{p.stock_qty ?? "—"}</TableCell>
                    <TableCell>
                      <span
                        className={
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium " +
                          (p.stock_status === "พร้อมจัดส่ง"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700")
                        }
                      >
                        {p.stock_status ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{formatDate(p.synced_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </section>

        {/* Pagination */}
        {rows.length > 0 ? (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>
              หน้า {page} / {totalPages} • ทั้งหมด {listQ.data?.count ?? 0} รายการ
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ก่อนหน้า
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                ถัดไป
              </Button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}
