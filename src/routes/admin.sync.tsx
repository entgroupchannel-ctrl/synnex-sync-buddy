import { createFileRoute, useRouter } from "@tanstack/react-router";
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
import { RefreshCw, Search, Package } from "lucide-react";
import { getSyncStatus, listProducts, runSynnexSync } from "@/lib/synnex-sync.functions";

export const Route = createFileRoute("/admin/sync")({
  head: () => ({
    meta: [
      { title: "Synnex Product Sync — Admin" },
      { name: "description", content: "Sync and browse the Synnex Thailand dealer product catalog." },
      { property: "og:title", content: "Synnex Product Sync — Admin" },
      { property: "og:description", content: "Sync and browse the Synnex Thailand dealer product catalog." },
    ],
  }),
  component: SyncPage,
});

function formatBaht(n: number | null) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

function SyncPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const runSync = useServerFn(runSynnexSync);
  const fetchStatus = useServerFn(getSyncStatus);
  const fetchList = useServerFn(listProducts);

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced]);

  const statusQuery = useQuery({
    queryKey: ["synnex", "status"],
    queryFn: () => fetchStatus(),
  });

  const listQuery = useQuery({
    queryKey: ["synnex", "list", debounced, page],
    queryFn: () => fetchList({ data: { search: debounced, page } }),
  });

  const mutation = useMutation({
    mutationFn: () => runSync(),
    onSuccess: (res) => {
      if (res.status === "success") {
        toast.success(`Synced ${res.productsFound} products`);
      } else {
        toast.error(res.message || "Sync failed");
      }
      qc.invalidateQueries({ queryKey: ["synnex"] });
      router.invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Sync failed"),
  });

  const total = statusQuery.data?.total ?? 0;
  const latest = statusQuery.data?.latest;
  const rows = listQuery.data?.rows ?? [];
  const count = listQuery.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / 50));

  return (
    <div className="min-h-screen bg-white font-sans" style={{ color: "var(--color-navy)" }}>
      <Toaster richColors position="top-right" />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Synnex Product Sync</h1>
            <p className="mt-1 text-sm text-slate-500">
              Dealer catalog scraper — synnex.co.th
            </p>
          </div>
          <div className="flex flex-col items-start gap-1 text-sm text-slate-600 sm:items-end">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>
                <strong className="font-semibold">{total.toLocaleString()}</strong> products
              </span>
            </div>
            <div>Last sync: {formatDate(latest?.finished_at ?? latest?.started_at ?? null)}</div>
            {latest?.status === "error" && (
              <div className="text-xs text-red-600">Last run failed: {latest.message}</div>
            )}
          </div>
        </header>

        <section className="mt-6 flex flex-wrap items-center gap-3">
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="gap-2"
            style={{ backgroundColor: "var(--color-navy)" }}
          >
            <RefreshCw className={`h-4 w-4 ${mutation.isPending ? "animate-spin" : ""}`} />
            {mutation.isPending ? "Syncing…" : "Sync Now"}
          </Button>
          <div className="relative ml-auto w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SKU or name…"
              className="pl-9"
            />
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-[180px]">SKU</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead className="w-[120px] text-right">Price (฿)</TableHead>
                <TableHead className="w-[100px]">Stock</TableHead>
                <TableHead className="w-[160px]">Last Synced</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-slate-500">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-slate-500">
                    No products yet. Click <strong>Sync Now</strong> to fetch the catalog.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                    <TableCell className="max-w-md truncate">{p.name ?? "—"}</TableCell>
                    <TableCell className="text-right">{formatBaht(p.price as number | null)}</TableCell>
                    <TableCell>{p.stock ?? "—"}</TableCell>
                    <TableCell className="text-slate-500">{formatDate(p.synced_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </section>

        <section className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <div>
            Showing {rows.length === 0 ? 0 : (page - 1) * 50 + 1}–{(page - 1) * 50 + rows.length} of{" "}
            {count.toLocaleString()}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span>
              Page {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
