import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  filter: fallback(z.string(), "all").default("all"),
  page: fallback(z.number().int(), 1).default(1),
});

export const Route = createFileRoute("/_authenticated/admin/pricing/products")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({ meta: [{ title: "ราคาสินค้ารายชิ้น · ENT Group" }] }),
  component: PricingProductsPage,
});

const PAGE_SIZE = 25;
const priceFmt = new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

type Product = {
  id: string;
  sku: string;
  name: string | null;
  brand: string | null;
  category: string | null;
  image_url: string | null;
  cost_price: number | null;
  price: number | null;
  selling_price: number | null;
  markup_override: number | null;
  price_approved: boolean | null;
};

function PricingProductsPage() {
  const search = Route.useSearch();
  const nav = Route.useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState(search.q);

  const productsQ = useQuery({
    queryKey: ["pricing-products", search],
    queryFn: async () => {
      const from = (search.page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let query = supabase
        .from("synnex_products")
        .select("id, sku, name, brand, category, image_url, cost_price, price, selling_price, markup_override, price_approved", { count: "exact" })
        .order("sku", { ascending: true })
        .range(from, to);
      const s = search.q.trim().replace(/[%,]/g, "");
      if (s) query = query.or(`sku.ilike.%${s}%,name.ilike.%${s}%`);
      if (search.filter === "unapproved") query = query.eq("price_approved", false);
      else if (search.filter === "zero") query = query.or("selling_price.is.null,selling_price.eq.0");
      else if (search.filter === "override") query = query.not("markup_override", "is", null);
      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: (data ?? []) as Product[], count: count ?? 0 };
    },
  });

  const updateMut = useMutation({
    mutationFn: async (p: { id: string; patch: Partial<Product> }) => {
      const { error } = await supabase.from("synnex_products").update(p.patch).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing-products"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const totalPages = Math.max(1, Math.ceil((productsQ.data?.count ?? 0) / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-slate-50 font-sarabun">
      <Toaster richColors position="top-right" />
      <header className="border-b bg-[#1a237e] text-white">
        <div className="mx-auto flex max-w-[100rem] items-center gap-4 px-4 py-4">
          <h1 className="text-xl font-bold">ราคาสินค้ารายชิ้น</h1>
          <div className="ml-auto flex gap-2">
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <Link to="/admin/pricing">← กฎราคา</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[100rem] space-y-4 px-4 py-6">
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white p-3">
          <form
            className="relative flex-1 min-w-[240px]"
            onSubmit={(e) => {
              e.preventDefault();
              nav({ search: (s: { q: string; filter: string; page: number }) => ({ ...s, q, page: 1 }) });
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา SKU หรือชื่อ..." className="pl-9" />
          </form>
          <Select value={search.filter} onValueChange={(v) => nav({ search: (s: { q: string; filter: string; page: number }) => ({ ...s, filter: v, page: 1 }) })}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="unapproved">ยังไม่ approve</SelectItem>
              <SelectItem value="zero">ราคา ฿0 / ว่าง</SelectItem>
              <SelectItem value="override">มี override</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-slate-600">
            พบ <b>{(productsQ.data?.count ?? 0).toLocaleString()}</b> รายการ
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">รูป</TableHead>
                <TableHead>ชื่อ / SKU</TableHead>
                <TableHead className="w-28">ต้นทุน</TableHead>
                <TableHead className="w-28">Markup %</TableHead>
                <TableHead className="w-32">ราคาขาย</TableHead>
                <TableHead className="w-24">Override</TableHead>
                <TableHead className="w-24">Approved</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsQ.isLoading ? (
                <TableRow><TableCell colSpan={7} className="p-8 text-center text-slate-400">กำลังโหลด...</TableCell></TableRow>
              ) : (productsQ.data?.rows.length ?? 0) === 0 ? (
                <TableRow><TableCell colSpan={7} className="p-8 text-center text-slate-400">ไม่พบสินค้า</TableCell></TableRow>
              ) : productsQ.data!.rows.map((p) => {
                const cost = Number(p.cost_price ?? p.price ?? 0);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="grid h-12 w-12 place-items-center rounded border bg-white">
                        {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-contain" loading="lazy" /> : <Package className="h-6 w-6 text-slate-300" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{p.name ?? p.sku}</div>
                      <div className="text-xs text-slate-500">
                        {p.sku}{p.brand && <> · <Badge variant="outline" className="ml-1 text-[10px]">{p.brand}</Badge></>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">฿{priceFmt.format(cost)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.5"
                        defaultValue={p.markup_override ?? ""}
                        placeholder="—"
                        onBlur={(e) => {
                          const v = e.target.value === "" ? null : Number(e.target.value);
                          if (v !== p.markup_override) updateMut.mutate({ id: p.id, patch: { markup_override: v } });
                        }}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        defaultValue={p.selling_price ?? ""}
                        placeholder="—"
                        onBlur={(e) => {
                          const v = e.target.value === "" ? null : Number(e.target.value);
                          if (v !== p.selling_price) updateMut.mutate({ id: p.id, patch: { selling_price: v } });
                        }}
                        className="h-8 font-semibold"
                      />
                    </TableCell>
                    <TableCell>
                      {p.markup_override != null && <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">✓</Badge>}
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={!!p.price_approved}
                        onCheckedChange={(v) => updateMut.mutate({ id: p.id, patch: { price_approved: !!v } })}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={search.page <= 1} onClick={() => nav({ search: (s: { q: string; filter: string; page: number }) => ({ ...s, page: s.page - 1 }) })}>← ก่อนหน้า</Button>
            <span className="text-sm">หน้า {search.page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={search.page >= totalPages} onClick={() => nav({ search: (s: { q: string; filter: string; page: number }) => ({ ...s, page: s.page + 1 }) })}>ถัดไป →</Button>
          </div>
        )}
      </main>
    </div>
  );
}
