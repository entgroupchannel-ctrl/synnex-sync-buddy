import type { ReactNode } from "react";
import { Monitor, Cpu, Zap, HardDrive, Package, FileText } from "lucide-react";
import { parseSpec } from "@/lib/parse-spec";

const ICONS: Record<string, ReactNode> = {
  Monitor: <Monitor className="h-3 w-3" />,
  Cpu: <Cpu className="h-3 w-3" />,
  Zap: <Zap className="h-3 w-3" />,
  HardDrive: <HardDrive className="h-3 w-3" />,
  Package: <Package className="h-3 w-3" />,
  FileText: <FileText className="h-3 w-3" />,
};

const ICONS_LG: Record<string, ReactNode> = {
  Monitor: <Monitor className="h-4 w-4" />,
  Cpu: <Cpu className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
  HardDrive: <HardDrive className="h-4 w-4" />,
  Package: <Package className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
};

/** COMPACT — for product listing cards (3 key specs) */
export function SpecTagsCompact({ description }: { description?: string | null }) {
  if (!description) return null;
  const specs = parseSpec(description)
    .filter((s) => ["CPU", "RAM", "Storage"].includes(s.label))
    .slice(0, 3);
  if (!specs.length) return null;

  return (
    <div className="flex flex-wrap gap-1 py-0.5">
      {specs.map((s, i) => (
        <span
          key={i}
          className="inline-flex max-w-full items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] leading-tight text-slate-600"
        >
          <span className="shrink-0 text-slate-400">{ICONS[s.icon]}</span>
          <span className="truncate">{s.value}</span>
        </span>
      ))}
    </div>
  );
}

/** FULL — for product detail page */
export function SpecTagsFull({ description }: { description?: string | null }) {
  if (!description) return null;
  const specs = parseSpec(description);
  if (!specs.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Cpu className="h-4 w-4 text-[color:var(--brand-navy)]" />
        ข้อมูลจำเพาะ
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {specs.map((s, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-2.5"
          >
            <div className="mt-0.5 shrink-0 rounded-md bg-slate-100 p-1.5 text-[color:var(--brand-navy)]">
              {ICONS_LG[s.icon]}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                {s.label}
              </div>
              <div className="text-xs font-medium leading-tight text-slate-800">{s.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
