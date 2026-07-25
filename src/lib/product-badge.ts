import type { BadgeType } from "@/components/sale-badge";

export function getProductBadge(product: any, index: number): BadgeType | null {
  if (!product) return null;

  if (product.created_at) {
    const created = new Date(product.created_at).getTime();
    if (created > Date.now() - 7 * 24 * 60 * 60 * 1000) return "new";
  }

  const selling = Number(product.selling_price) || 0;
  const member = Number(product.member_price) || 0;
  if (member > 0 && selling > 0 && member < selling * 0.95) return "sale";

  if (selling > 0 && selling < 500) return "cheap";

  const rotation: (BadgeType | null)[] = [
    "hot",
    "popular",
    "best",
    "recommended",
    null,
    null,
    "hot",
    "popular",
    null,
    "best",
  ];
  return rotation[index % rotation.length];
}

/** Shuffle stable-per-hour with a section seed, keeping the 2 cheapest pinned first. */
export function shuffleWithSeed<T extends { id?: string | number }>(arr: T[], seed: number): T[] {
  const hourSeed = Math.floor(Date.now() / 3_600_000) + seed;
  return [...arr].sort((a, b) => {
    const ida = String(a.id ?? "");
    const idb = String(b.id ?? "");
    const ha = ((ida.charCodeAt(0) || 0) + hourSeed) % 10;
    const hb = ((idb.charCodeAt(0) || 0) + hourSeed) % 10;
    return ha - hb;
  });
}

export function cheapFirstShuffle<T extends { id?: string | number; selling_price?: number }>(
  arr: T[],
  seed: number,
  limit = 10,
): T[] {
  const sorted = [...arr]
    .filter((p) => (p.selling_price ?? 0) > 0)
    .sort((a, b) => (a.selling_price ?? 0) - (b.selling_price ?? 0))
    .slice(0, limit);
  if (sorted.length <= 2) return sorted;
  const head = sorted.slice(0, 2);
  const tail = shuffleWithSeed(sorted.slice(2), seed);
  return [...head, ...tail];
}
