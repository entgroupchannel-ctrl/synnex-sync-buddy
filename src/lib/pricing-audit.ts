import { supabase } from "@/integrations/supabase/client";

export type AuditAction = "approve" | "bulk_approve" | "reset" | "markup_change";

export type AuditEntry = {
  product_sku: string;
  product_name?: string | null;
  action: AuditAction;
  old_selling_price?: number | null;
  new_selling_price?: number | null;
  old_markup?: number | null;
  new_markup?: number | null;
  approved_by?: string | null;
  session_id?: string | null;
  notes?: string | null;
};

async function currentUserEmail(): Promise<string> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.email ?? "admin";
  } catch {
    return "admin";
  }
}

export async function logAudit(entry: AuditEntry) {
  const approved_by = entry.approved_by ?? (await currentUserEmail());
  const { error } = await supabase.from("price_audit_log").insert({ ...entry, approved_by });
  if (error) console.warn("[audit]", error.message);
}

export async function logAuditBulk(entries: AuditEntry[]) {
  if (entries.length === 0) return;
  const approved_by = await currentUserEmail();
  const rows = entries.map((e) => ({ ...e, approved_by: e.approved_by ?? approved_by }));
  const { error } = await supabase.from("price_audit_log").insert(rows);
  if (error) console.warn("[audit-bulk]", error.message);
}

export function newSessionId(): string {
  return (globalThis.crypto as Crypto | undefined)?.randomUUID?.() ?? `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
