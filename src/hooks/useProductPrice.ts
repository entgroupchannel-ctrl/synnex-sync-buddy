import { useCustomerTier, type CustomerTier, type PricingProduct } from "@/lib/cart";

export interface PriceResult {
  displayPrice: number;
  originalPrice: number;
  savings: number;
  savingsPct: number;
  priceLabel: string;
  tierBadge: string | null;
  volumeDiscount: number;
  userType: "guest" | "b2c" | "b2b";
}

function tierBreakdown(tier: CustomerTier): {
  userType: "guest" | "b2c" | "b2b";
  loyaltyTier: "member" | "silver" | "gold" | "vip";
  b2bTier: "standard" | "silver" | "gold";
} {
  if (tier === "guest") return { userType: "guest", loyaltyTier: "member", b2bTier: "standard" };
  if (tier.startsWith("b2b")) {
    const t = tier === "b2b_gold" ? "gold" : tier === "b2b_silver" ? "silver" : "standard";
    return { userType: "b2b", loyaltyTier: "member", b2bTier: t };
  }
  const t =
    tier === "b2c_vip" ? "vip" :
    tier === "b2c_gold" ? "gold" :
    tier === "b2c_silver" ? "silver" : "member";
  return { userType: "b2c", loyaltyTier: t, b2bTier: "standard" };
}

export function volumeDiscountFor(qty: number): number {
  if (qty >= 10) return 0.07;
  if (qty >= 5) return 0.04;
  if (qty >= 3) return 0.02;
  return 0;
}

export function computeProductPrice(
  product: PricingProduct,
  tier: CustomerTier,
  qty: number = 1,
): PriceResult {
  const { userType, loyaltyTier, b2bTier } = tierBreakdown(tier);
  const selling = Number(product.selling_price ?? 0);
  const memberPrice = Number(product.member_price ?? 0) > 0 ? Number(product.member_price) : null;
  const b2bPrice = Number(product.b2b_price ?? 0) > 0 ? Number(product.b2b_price) : null;

  let basePrice = selling;
  let tierDiscount = 0;
  let priceLabel = "ราคาปกติ";
  let tierBadge: string | null = null;

  if (userType === "b2b" && b2bPrice) {
    basePrice = b2bPrice;
    priceLabel = "ราคาองค์กร";
    tierBadge = "B2B";
    tierDiscount = b2bTier === "gold" ? 0.05 : b2bTier === "silver" ? 0.02 : 0;
  } else if (userType === "b2c" && memberPrice) {
    basePrice = memberPrice;
    priceLabel = "ราคาสมาชิก";
    tierDiscount =
      loyaltyTier === "vip" ? 0.07 :
      loyaltyTier === "gold" ? 0.05 :
      loyaltyTier === "silver" ? 0.03 : 0;
    if (loyaltyTier !== "member") tierBadge = loyaltyTier.toUpperCase();
  }

  const volumeDiscount = volumeDiscountFor(qty);
  const finalPrice = Math.max(
    0,
    Math.round((basePrice * (1 - tierDiscount) * (1 - volumeDiscount)) / 10) * 10,
  );
  const savings = selling - finalPrice;
  const savingsPct = selling > 0 ? Math.round((savings / selling) * 100) : 0;

  return {
    displayPrice: finalPrice,
    originalPrice: selling,
    savings: Math.max(savings, 0),
    savingsPct: Math.max(savingsPct, 0),
    priceLabel,
    tierBadge,
    volumeDiscount,
    userType,
  };
}

export function useProductPrice(product: PricingProduct, qty: number = 1): PriceResult {
  const tier = useCustomerTier();
  return computeProductPrice(product, tier, qty);
}
