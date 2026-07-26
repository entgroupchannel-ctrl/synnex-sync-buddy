import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_PUBLIC_COLUMNS } from "@/lib/product-columns";
import { ProductImage } from "@/components/product-image";
import { WarrantyBadge } from "@/components/warranty-badge";
import { parseSpec } from "@/lib/parse-spec";
import { displayPrice, useCustomerTier, type PricingProduct } from "@/lib/cart";
import { useCompare } from "@/lib/compare-store";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/compare")({
  component: ComparePage,
  head: () => ({
    meta: [
      { title: "เปรียบเทียบสินค้า | ENT Group IT Retail Shop" },
      {
        name: "description",
        content: "เปรียบเทียบสเปก ราคา และการรับประกันของสินค้าไอทีในหมวดเดียวกันได้สูงสุด 4 รายการ",
      },
      { property: "og:title", content: "เปรียบเทียบสินค้า | ENT Group IT Retail Shop" },
      {
        property: "og:description",
        content: "เปรียบเทียบสเปก ราคา และการรับประกันของสินค้าไอทีในหมวดเดียวกัน",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type Row = Record<string, unknown>;

function ComparePage() {
  const { items, remove, clear } = useCompare();
  const tier = useCustomerTier();
  const ids = items.map((it) => it.id);

  const q = useQuery({
    queryKey: ["compare-products", ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("synnex_products")
        .select(PRODUCT_PUBLIC_COLUMNS)
        .in("id", ids);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  // เรียงตามลำดับที่ผู้ใช้เลือกไว้ ไม่ใช่ลำดับที่ DB ส่งกลับมา
  const rows = ids
    .map((id) => q.data?.find((r) => (r.id as string) === id))
    .filter(Boolean) as Row[];

  const specRows = (() => {
    const keys = new Set<string>();
    const perProduct = rows.map((p) => {
      const specs = parseSpec(p.description as string | null);
      const map: Record<string, string> = {};
      for (const s of specs) {
        map[s.label] = s.value;
        keys.add(s.label);
      }
      return map;
    });
    return Array.from(keys).map((label) => ({
      label,
      values: perProduct.map((m) => m[label] ?? "—"),
    }));
  })();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-900">เปรียบเทียบสินค้า</h1>
          {items.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="text-sm font-medium text-slate-500 underline hover:text-slate-700"
            >
              ล้างทั้งหมด
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
            ยังไม่มีสินค้าที่เลือกไว้ — กด &quot;เทียบ&quot;
            ที่การ์ดสินค้าในหน้ารวมสินค้าเพื่อเริ่มเปรียบเทียบ (เลือกได้ภายในหมวดเดียวกันเท่านั้น
            สูงสุด 4 รายการ)
            <div className="mt-5">
              <Link
                to="/"
                className="inline-flex rounded-lg bg-[color:var(--brand-navy)] px-5 py-2.5 text-sm font-semibold text-white"
              >
                ไปเลือกสินค้า
              </Link>
            </div>
          </div>
        ) : items.length === 1 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
            เลือกสินค้าอย่างน้อย 2 รายการในหมวดเดียวกันเพื่อเริ่มเปรียบเทียบ
          </div>
        ) : q.isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {items.map((it) => (
              <div key={it.id} className="h-64 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 align-top">
                  <th className="w-32 p-3 text-left text-xs font-medium text-slate-500">รายการ</th>
                  {rows.map((p) => (
                    <th key={p.id as string} className="p-3 text-left">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => remove(p.id as string)}
                          aria-label="เอาออกจากการเปรียบเทียบ"
                          className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <Link
                          to="/product/$slug"
                          params={{ slug: (p.slug as string) ?? (p.sku as string) }}
                          className="block"
                        >
                          <div className="mx-auto h-28 w-28 overflow-hidden rounded-lg border border-slate-100 bg-white p-1">
                            <ProductImage
                              src={p.image_url as string | null}
                              alt={(p.name as string) ?? (p.sku as string)}
                              category={p.category as string | null}
                              productName={(p.name as string) ?? (p.sku as string)}
                              distributor={p.distributor as string | null}
                            />
                          </div>
                          <div className="mt-2 line-clamp-3 text-xs font-medium text-slate-800">
                            {(p.name as string) ?? (p.sku as string)}
                          </div>
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="p-3 text-xs font-medium text-slate-500">แบรนด์</td>
                  {rows.map((p) => (
                    <td key={p.id as string} className="p-3 text-slate-700">
                      {(p.brand as string) ?? "—"}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="p-3 text-xs font-medium text-slate-500">ราคา</td>
                  {rows.map((p) => (
                    <td
                      key={p.id as string}
                      className="p-3 font-semibold text-[color:var(--brand-navy)]"
                    >
                      {p.price_approved
                        ? displayPrice(p as unknown as PricingProduct, tier)
                        : "ติดต่อสอบถาม"}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="p-3 text-xs font-medium text-slate-500">สถานะสต๊อก</td>
                  {rows.map((p) => (
                    <td key={p.id as string} className="p-3 text-slate-700">
                      {(p.stock_status as string) ?? "—"}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="p-3 text-xs font-medium text-slate-500">ประกัน</td>
                  {rows.map((p) => (
                    <td key={p.id as string} className="p-3">
                      <WarrantyBadge
                        category={p.category as string | null}
                        name={p.name as string | null}
                      />
                    </td>
                  ))}
                </tr>
                {specRows.map((row) => (
                  <tr key={row.label} className="border-b border-slate-100 last:border-0">
                    <td className="p-3 text-xs font-medium text-slate-500">{row.label}</td>
                    {row.values.map((v, i) => (
                      <td key={`${row.label}-${i}`} className="p-3 text-slate-700">
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
