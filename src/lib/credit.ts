import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CreditAccount = {
  id: string;
  user_id: string | null;
  company_name: string;
  tax_id: string;
  credit_limit: number;
  credit_used: number;
  credit_available: number;
  payment_terms_days: number;
  is_active: boolean;
  suspended_reason: string | null;
  expires_at: string | null;
};

export const bahtFmt = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

export function creditIsUsable(acc: CreditAccount | null): boolean {
  if (!acc) return false;
  if (!acc.is_active) return false;
  if (acc.expires_at && new Date(acc.expires_at).getTime() < Date.now()) return false;
  return true;
}

export function dueDateFrom(days: number, from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

export function thaiDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Loads the signed-in user's credit account (null when none). */
export function useCreditAccount(userId: string | null | undefined) {
  const [account, setAccount] = useState<CreditAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setAccount(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("credit_accounts")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setAccount((data as CreditAccount | null) ?? null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { account, loading };
}
