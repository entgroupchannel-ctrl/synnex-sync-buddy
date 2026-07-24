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
};

export function ProductImage({
  src,
  alt = "",
  className = "h-full w-full object-contain",
  iconClassName = "h-10 w-10 text-slate-300",
  fallbackLabel = "ไม่มีรูปสินค้า",
  loading = "lazy",
  category,
}: Props) {
  const [error, setError] = useState(!src);

  useEffect(() => {
    setError(!src);
  }, [src]);

  const showEntBadge = category === "Computer Set";

  const badge = showEntBadge ? (
    <div
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        background: "#0a1628",
        color: "#fff",
        padding: "3px 8px",
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.05em",
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      ENT Group
    </div>
  ) : null;

  if (error || !src) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-2 rounded-md bg-slate-100">
        <Package className={iconClassName} strokeWidth={1.5} />
        <span className="text-[11px] text-slate-400">{fallbackLabel}</span>
        {badge}
      </div>
    );
  }

  if (showEntBadge) {
    return (
      <div className="relative h-full w-full">
        <img
          src={src}
          alt={alt}
          loading={loading}
          onError={() => setError(true)}
          className={className}
        />
        {badge}
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
