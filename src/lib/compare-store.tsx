import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

export const COMPARE_MAX_ITEMS = 4;
const STORAGE_KEY = "compareItems:v1";

export type CompareItem = {
  id: string;
  sku: string;
  slug: string | null;
  name: string | null;
  image_url: string | null;
  selling_price: number | null;
  category: string | null;
  brand: string | null;
};

type CompareContextValue = {
  items: CompareItem[];
  category: string | null;
  isSelected: (id: string) => boolean;
  toggle: (item: CompareItem) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CompareContext = createContext<CompareContextValue | null>(null);

function readStorage(): CompareItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);

  // โหลดจาก localStorage หลัง mount เท่านั้น (กัน hydration mismatch กับ SSR)
  useEffect(() => {
    setItems(readStorage());
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // เก็บไม่ได้ (เช่น private mode) ไม่ critical ข้ามไป
    }
  }, [items]);

  const category = items[0]?.category ?? null;

  const isSelected = useCallback((id: string) => items.some((it) => it.id === id), [items]);

  const toggle = useCallback((item: CompareItem) => {
    setItems((prev) => {
      const exists = prev.some((it) => it.id === item.id);
      if (exists) return prev.filter((it) => it.id !== item.id);

      if (prev.length > 0 && prev[0].category !== item.category) {
        toast.error(
          `เปรียบเทียบได้เฉพาะสินค้าในหมวดเดียวกัน (กำลังเทียบหมวด "${prev[0].category}")`,
        );
        return prev;
      }
      if (prev.length >= COMPARE_MAX_ITEMS) {
        toast.error(`เปรียบเทียบได้สูงสุด ${COMPARE_MAX_ITEMS} รายการ`);
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, category, isSelected, toggle, remove, clear }),
    [items, category, isSelected, toggle, remove, clear],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare ต้องถูกใช้ภายใน <CompareProvider>");
  return ctx;
}
