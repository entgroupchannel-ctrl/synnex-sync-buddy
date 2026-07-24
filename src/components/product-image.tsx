import { useEffect, useState } from "react";
import { Package } from "lucide-react";

type Props = {
  src?: string | null;
  alt?: string;
  className?: string;
  iconClassName?: string;
  fallbackLabel?: string;
  loading?: "eager" | "lazy";
};

export function ProductImage({
  src,
  alt = "",
  className = "h-full w-full object-contain",
  iconClassName = "h-10 w-10 text-slate-300",
  fallbackLabel = "ไม่มีรูปสินค้า",
  loading = "lazy",
}: Props) {
  const [error, setError] = useState(!src);

  useEffect(() => {
    setError(!src);
  }, [src]);

  if (error || !src) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-md bg-slate-100">
        <Package className={iconClassName} strokeWidth={1.5} />
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
