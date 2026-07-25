/**
 * src/components/order-status-timeline.tsx  (ไฟล์ใหม่)
 * Timeline ประวัติการเปลี่ยนสถานะ ดึงจาก order_status_history (RLS อนุญาต SELECT อยู่แล้ว)
 */
import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_META, isValidStatus } from "@/lib/order-helpers";

type HistoryRow = { id: string; status: string; note: string | null; created_at: string };

export function OrderStatusTimeline({ orderId }: { orderId: string }) {
  const q = useQuery({
    queryKey: ["order-status-history", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_status_history")
        .select("id, status, note, created_at")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as HistoryRow[];
    },
  });

  const rows = q.data ?? [];

  if (q.isLoading) return <div className="h-16 animate-pulse rounded-md bg-slate-100" />;
  if (rows.length === 0) {
    return <p className="text-sm text-slate-400">ยังไม่มีความเคลื่อนไหว</p>;
  }

  return (
    <div className="space-y-0">
      {rows.map((r, i) => {
        const meta = isValidStatus(r.status) ? STATUS_META[r.status] : null;
        const isLast = i === rows.length - 1;
        return (
          <div key={r.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${meta?.dot ?? "bg-slate-400"}`} />
              {!isLast && <span className="w-px flex-1 bg-slate-200" />}
            </div>
            <div className={isLast ? "pb-1" : "pb-4"}>
              <div className="text-sm font-medium text-slate-800">{meta?.label ?? r.status}</div>
              {r.note && <div className="text-xs text-slate-500">{r.note}</div>}
              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="h-3 w-3" />
                {new Date(r.created_at).toLocaleString("th-TH")}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
