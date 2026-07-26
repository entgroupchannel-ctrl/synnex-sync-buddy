import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toggleWishlist, isWishlisted } from "@/lib/wishlist";
import { toast } from "sonner";

/** ปุ่มหัวใจบันทึกสินค้าเข้า Wishlist — วางลอยมุมรูปสินค้า */
export function WishlistButton({
  productId,
  productName,
  className = "",
  size = "md",
}: {
  productId?: string | null;
  productName?: string | null;
  className?: string;
  size?: "sm" | "md";
}) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (productId) setOn(isWishlisted(productId));
  }, [productId]);

  if (!productId) return null;

  const box = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <button
      type="button"
      aria-label={on ? "นำออกจากรายการโปรด" : "บันทึกลงรายการโปรด"}
      aria-pressed={on}
      title={on ? "นำออกจากรายการโปรด" : "บันทึกลงรายการโปรด"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggleWishlist(productId);
        setOn(added);
        toast[added ? "success" : "message"](
          added ? "บันทึกลงรายการโปรดแล้ว" : "นำออกจากรายการโปรดแล้ว",
          { description: productName ?? undefined },
        );
      }}
      className={`grid ${box} place-items-center rounded-full bg-white/90 shadow-sm ring-1 ring-slate-200 backdrop-blur transition hover:bg-white hover:ring-red-300 ${className}`}
    >
      <Heart
        className={`${icon} transition-colors ${on ? "fill-red-500 text-red-500" : "text-slate-400"}`}
      />
    </button>
  );
}
