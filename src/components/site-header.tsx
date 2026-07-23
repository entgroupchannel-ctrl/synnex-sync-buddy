import { Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";

export function SiteHeader() {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b bg-[#1a237e] text-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="text-xl font-bold tracking-tight">Synnex Store</div>
          <span className="hidden text-xs text-white/70 sm:inline">แคตตาล็อกสินค้าไอที</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            to="/"
            className="text-sm text-white/85 hover:text-white"
            activeOptions={{ exact: true }}
          >
            สินค้า
          </Link>
          <Link to="/cart" className="relative inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">
            <ShoppingCart className="h-4 w-4" />
            ตะกร้า
            {count > 0 && (
              <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#ff6f00] px-1.5 text-xs font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
