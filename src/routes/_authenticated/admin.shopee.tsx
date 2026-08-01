import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, ExternalLink, RefreshCw, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/shopee")({
  component: AdminShopee,
  head: () => ({
    meta: [
      { title: "Shopee Integration — Admin ENT Group" },
      { name: "description", content: "เชื่อมต่อร้าน Shopee เพื่อ sync สินค้า ราคา และสต๊อก" },
    ],
  }),
});

type Connection = {
  shop_id: number;
  shop_name: string | null;
  is_sandbox: boolean;
  connected_at: string;
  access_token_expires_at: string;
};

type LogRow = {
  id: string;
  action: string;
  status: string;
  detail: unknown;
  created_at: string;
};

function AdminShopee() {
  const [conn, setConn] = useState<Connection | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: l }] = await Promise.all([
      supabase
        .from("shopee_shop_connections")
        .select("shop_id, shop_name, is_sandbox, connected_at, access_token_expires_at")
        .order("connected_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("shopee_sync_log")
        .select("id, action, status, detail, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    setConn((c as Connection) ?? null);
    setLogs((l as LogRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const connect = async () => {
    setConnecting(true);
    const { data, error } = await supabase.functions.invoke("shopee-oauth-authorize");
    setConnecting(false);
    if (error || !data?.authUrl) {
      toast.error(
        error?.message ??
          "สร้างลิงก์เชื่อมต่อไม่สำเร็จ — เช็คว่าตั้งค่า SHOPEE_PARTNER_ID/SHOPEE_PARTNER_KEY ใน Supabase secrets แล้วหรือยัง",
      );
      return;
    }
    window.open(data.authUrl as string, "_blank", "noopener,noreferrer");
    toast.info('เปิดหน้า Shopee ในแท็บใหม่แล้ว — กด "อนุญาต" แล้วกลับมากด "ทดสอบการเชื่อมต่อ"');
  };

  const testConnection = async () => {
    setTesting(true);
    const { data, error } = await supabase.functions.invoke("shopee-test-connection");
    setTesting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data?.connected) toast.success("เชื่อมต่อ Shopee ใช้งานได้ปกติ");
    else toast.error(data?.message ?? "เชื่อมต่อไม่สำเร็จ");
    load();
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-1 flex items-center gap-2 text-xl font-black text-[color:var(--brand-navy)]">
        <ShoppingBag className="h-5 w-5" /> Shopee Integration
      </h1>
      <p className="mb-4 text-sm text-slate-500">
        เชื่อมต่อร้าน Shopee เพื่อ sync แคตตาล็อกสินค้า/ราคา/สต๊อกไปขึ้นขาย
      </p>

      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      ) : (
        <>
          <div className="rounded-lg border bg-white p-4">
            {conn ? (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Shop ID: {conn.shop_id}</span>
                    <Badge className={conn.is_sandbox ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}>
                      {conn.is_sandbox ? "Sandbox (ทดสอบ)" : "Live (ใช้งานจริง)"}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    เชื่อมต่อเมื่อ {new Date(conn.connected_at).toLocaleString("th-TH")} · token หมดอายุ{" "}
                    {new Date(conn.access_token_expires_at).toLocaleString("th-TH")}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={testConnection} disabled={testing}>
                    {testing ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    ทดสอบการเชื่อมต่อ
                  </Button>
                  <Button size="sm" variant="outline" onClick={connect} disabled={connecting}>
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    เชื่อมต่อร้านใหม่ / เปลี่ยนร้าน
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">ยังไม่ได้เชื่อมต่อร้าน Shopee</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    ต้องมี Partner ID/Key ใน Supabase secrets ก่อน แล้วกดปุ่มนี้เพื่อ authorize ร้าน
                  </p>
                </div>
                <Button size="sm" onClick={connect} disabled={connecting}>
                  {connecting ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShoppingBag className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  เชื่อมต่อร้าน Shopee
                </Button>
              </div>
            )}
          </div>

          <h2 className="mt-6 mb-2 text-sm font-bold text-slate-700">Log ล่าสุด</h2>
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500">ยังไม่มี log</p>
          ) : (
            <div className="space-y-2">
              {logs.map((l) => (
                <div key={l.id} className="rounded-lg border bg-white p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{l.action}</span>
                    <Badge
                      className={
                        l.status === "success"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }
                    >
                      {l.status}
                    </Badge>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {new Date(l.created_at).toLocaleString("th-TH")}
                  </div>
                  <pre className="mt-2 max-h-40 overflow-auto rounded bg-slate-50 p-2 text-[11px] text-slate-600">
                    {JSON.stringify(l.detail, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
