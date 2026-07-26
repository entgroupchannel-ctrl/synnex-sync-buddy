import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useCompare } from "@/lib/compare-store";
import { ProductImage } from "@/components/product-image";

export function CompareBar() {
  const { items, remove, clear } = useCompare();

  if (items.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {items.map((it) => (
            <div
              key={it.id}
              className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-1"
            >
              <ProductImage
                src={it.image_url}
                alt={it.name ?? it.sku}
                category={it.category}
                productName={it.name ?? it.sku}
                iconClassName="h-5 w-5"
              />
              <button
                type="button"
                onClick={() => remove(it.id)}
                aria-label="เอาออกจากการเปรียบเทียบ"
                className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-slate-700 text-white hover:bg-slate-900"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-slate-500 sm:inline">
            {items.length} รายการ ({items[0]?.category ?? ""})
          </span>
          <button
            type="button"
            onClick={clear}
            className="text-xs font-medium text-slate-500 underline hover:text-slate-700"
          >
            ล้าง
          </button>
          {items.length >= 2 ? (
            <Link
              to="/compare"
              className="rounded-lg bg-[color:var(--brand-navy)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--brand-navy-2)]"
            >
              เปรียบเทียบ
            </Link>
          ) : (
            <span className="cursor-not-allowed rounded-lg bg-slate-300 px-4 py-2 text-sm font-semibold text-white">
              เปรียบเทียบ
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
