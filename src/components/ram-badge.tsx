const TONE: Record<string, string> = {
  DDR5: "bg-violet-100 text-violet-700 ring-violet-200",
  DDR4: "bg-sky-100 text-sky-700 ring-sky-200",
  DDR3L: "bg-teal-100 text-teal-700 ring-teal-200",
  DDR3: "bg-slate-100 text-slate-600 ring-slate-200",
  DDR2: "bg-slate-100 text-slate-500 ring-slate-200",
};

export function RamBadge({
  generation,
  subcategory,
  className = "",
}: {
  generation?: string | null;
  subcategory?: string | null;
  className?: string;
}) {
  if (!generation) return null;
  const tone = TONE[generation] ?? TONE.DDR3;
  const isNb = subcategory === "RAM Notebook";
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ring-1 ${tone}`}>
        {generation}
      </span>
      {isNb && (
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
          โน้ตบุ๊ก
        </span>
      )}
    </span>
  );
}
