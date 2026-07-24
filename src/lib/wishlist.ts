import { useEffect, useState } from "react";

const WISHLIST_KEY = "ent_wishlist";
const EVENT = "ent_wishlist_change";

export function getWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function setWishlist(list: string[]) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function isWishlisted(productId: string): boolean {
  return getWishlist().includes(productId);
}

export function toggleWishlist(productId: string): boolean {
  const list = getWishlist();
  const exists = list.includes(productId);
  const next = exists ? list.filter((id) => id !== productId) : [...list, productId];
  setWishlist(next);
  return !exists;
}

export function useWishlistCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => setCount(getWishlist().length);
    update();
    window.addEventListener(EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return count;
}

export function useWishlist(): string[] {
  const [list, setList] = useState<string[]>([]);
  useEffect(() => {
    const update = () => setList(getWishlist());
    update();
    window.addEventListener(EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return list;
}
