import { useEffect, useState } from "react";
import { Package } from "lucide-react";

type Props = {
  src?: string | null;
  alt?: string;
  className?: string;
  iconClassName?: string;
  fallbackLabel?: string;
  loading?: "eager" | "lazy";
  category?: string | null;
  productName?: string | null;
};

function pickEmoji(category?: string | null, name?: string | null): string {
  const hay = `${category ?? ""} ${name ?? ""}`.toLowerCase();
  if (/gpu|graphic|geforce|radeon|rtx|gtx|\brx ?\d/.test(hay)) return "🎮";
  if (/\bcpu\b|processor|ryzen|core i\d|threadripper/.test(hay)) return "🔲";
  if (/\bram\b|ddr\d|memory/.test(hay)) return "💾";
  if (/ssd|nvme|hdd|hard disk|storage/.test(hay)) return "💿";
  if (/motherboard|mainboard|mobo/.test(hay)) return "🟩";
  return "📦";
}

export function ProductImage({
  src,
  alt = "",
  className = "h-full w-full object-contain",
  iconClassName = "h-10 w-10 text-slate-300",
  fallbackLabel = "ไม่มีรูปสินค้า",
  loading = "lazy",
  category,
  productName,
}: Props) {
  const [error, setError] = useState(!src);

  useEffect(() => {
    setError(!src);
  }, [src]);

  if (error || !src) {
    const emoji = pickEmoji(category, productName ?? alt);
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-1 rounded-md bg-gradient-to-br from-slate-50 to-slate-100">
        {category || productName ? (
          <span className="text-4xl leading-none" aria-hidden>{emoji}</span>
        ) : (
          <Package className={iconClassName} strokeWidth={1.5} />
        )}
        <span className="text-[11px] text-slate-400">{fallbackLabel}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      onError={() => setError(true)}
      className={className}
    />
  );
}
