import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, RefreshCw, ShoppingBag, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/ginee")({
  component: AdminGinee,
  head: () => ({
    meta: [
      { title: "Ginee Integration — Admin ENT Group" },
      {
        name: "description",
        content: "เชื่อมต่อ Ginee เพื่อ sync สินค้าไปหลาย marketplace ในที่เดียว",
      },
    ],
  }),
});

type ShopRow = {
  ginee_shop_id: string;
  shop_name: string | null;
  channel: string | null;
  connected_at: string;
};
type CategoryMapRow = {
  id: string;
  our_category: string;
  our_subcategory: string | null;
  ginee_full_category_id: string[];
  notes: string | null;
};
type LogRow = {
  id: string;
  action: string;
  status: string;
  detail: unknown;
  created_at: string;
};

function AdminGinee() {
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [catMaps, setCatMaps] = useState<CategoryMapRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  const [newCat, setNewCat] = useState("");
  const [newSubcat, setNewSubcat] = useState("");
  const [newCatIds, setNewCatIds] = useState("");

  const [testSku, setTestSku] = useState("");
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: c }, { data: l }] = await Promise.all([
      supabase
        .from("ginee_shop_connections")
        .select("ginee_shop_id, shop_name, channel, connected_at")
        .order("connected_at", { ascending: false }),
      supabase
        .from("ginee_category_map")
        .select("id, our_category, our_subcategory, ginee_full_category_id, notes")
        .order("our_category"),
      supabase
        .from("ginee_sync_log")
        .select("id, action, status, detail, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    setShops((s as ShopRow[]) ?? []);
    setCatMaps((c as unknown as CategoryMapRow[]) ?? []);
    setLogs((l as LogRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const testConnection = async () => {
    setTesting(true);
    const { data, error } = await supabase.functions.invoke("ginee-list-shops");
    setTesting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data?.connected) {
      toast.success(`เชื่อมต่อสำเร็จ พบร้าน ${data.shops?.length ?? 0} ร้าน`);
    } else {
      toast.error(
        data?.message ??
          "เชื่อมต่อไม่สำเร็จ — เช็คว่าตั้งค่า GINEE_ACCESS_KEY/GINEE_SECRET_KEY แล้วหรือยัง",
      );
    }
    load();
  };

  const addCategoryMap = async () => {
    if (!newCat.trim() || !newCatIds.trim()) {
      toast.error("กรอกหมวดหมู่และ Ginee Category ID ให้ครบ");
      return;
    }
    const ids = newCatIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const { error } = await supabase.from("ginee_category_map").insert({
      our_category: newCat.trim(),
      our_subcategory: newSubcat.trim() || null,
      ginee_full_category_id: ids,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("เพิ่ม category map แล้ว");
    setNewCat("");
    setNewSubcat("");
    setNewCatIds("");
    load();
  };

  const testSyncOne = async () => {
    if (!testSku.trim()) {
      toast.error("กรอก SKU ที่จะทดสอบ");
      return;
    }
    setSyncing(true);
    const { data: prod } = await supabase
      .from("synnex_products")
      .select("id")
      .eq("sku", testSku.trim().toUpperCase())
      .maybeSingle();
    if (!prod) {
      toast.error("ไม่พบสินค้า SKU นี้");
      setSyncing(false);
      return;
    }
    const { data, error } = await supabase.functions.invoke("ginee-sync-products", {
      body: { product_id: prod.id },
    });
    setSyncing(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const r = data?.results?.[0];
    if (r?.ok) toast.success("ผลักสินค้าเข้า Ginee สำเร็จ");
    else toast.error(`ไม่สำเร็จ: ${r?.reason ?? "unknown"}`);
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <ShoppingBag className="h-6 w-6 text-primary" />
        Ginee Integration
      </h1>
      <p className="text-sm text-muted-foreground">
        เชื่อมต่อผ่าน Ginee เพื่อ sync แคตตาล็อกไปหลาย marketplace (Shopee ฯลฯ) โดยไม่ต้องขอ Shopee
        Partner API ตรง
      </p>

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <div className="space-y-6">
          {/* Connection status */}
          <section className="rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">ร้านที่เชื่อมต่อผ่าน Ginee</h2>
                <p className="text-sm text-muted-foreground">
                  {shops.length === 0
                    ? "ยังไม่พบร้านที่เชื่อมต่อ — กดทดสอบการเชื่อมต่อหลังตั้งค่า Access Key แล้ว"
                    : `พบ ${shops.length} ร้าน`}
                </p>
              </div>
              <Button onClick={testConnection} disabled={testing} variant="outline">
                {testing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                ทดสอบการเชื่อมต่อ
              </Button>
            </div>
            {shops.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {shops.map((s) => (
                  <div
                    key={s.ginee_shop_id}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <Badge variant="secondary">{s.channel ?? "?"}</Badge>
                    <span>{s.shop_name ?? s.ginee_shop_id}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Category mapping */}
          <section className="rounded-lg border bg-card p-4">
            <h2 className="font-semibold">แผนที่หมวดหมู่ (ของเรา → Ginee fullCategoryId)</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              ต้อง map ก่อน sync ได้ — ดู category id จาก Ginee ผ่าน ListCategories API หรือหน้า
              dashboard
            </p>
            <div className="mt-3 space-y-2">
              {catMaps.length === 0 ? (
                <p className="text-sm text-muted-foreground">ยังไม่มี mapping เลย</p>
              ) : (
                catMaps.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="font-medium">
                      {c.our_category}
                      {c.our_subcategory ? ` / ${c.our_subcategory}` : ""}
                    </span>
                    <span className="text-muted-foreground">
                      → [{(c.ginee_full_category_id ?? []).join(", ")}]
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              <Input
                placeholder="หมวดของเรา เช่น Solar & Energy"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
              />
              <Input
                placeholder="หมวดย่อย (ไม่ใส่ก็ได้)"
                value={newSubcat}
                onChange={(e) => setNewSubcat(e.target.value)}
              />
              <Input
                placeholder="Ginee ID คั่นด้วย , เช่น 100,1001,10012"
                value={newCatIds}
                onChange={(e) => setNewCatIds(e.target.value)}
              />
              <Button onClick={addCategoryMap}>
                <Plus className="mr-2 h-4 w-4" /> เพิ่ม
              </Button>
            </div>
          </section>

          {/* Test sync */}
          <section className="rounded-lg border bg-card p-4">
            <h2 className="font-semibold">ทดสอบผลักสินค้า 1 ตัว</h2>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <Label htmlFor="ginee-test-sku">SKU</Label>
                <Input
                  id="ginee-test-sku"
                  placeholder="SKU สินค้า"
                  value={testSku}
                  onChange={(e) => setTestSku(e.target.value)}
                />
              </div>
              <Button onClick={testSyncOne} disabled={syncing}>
                {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} ทดสอบ Sync
              </Button>
            </div>
          </section>

          {/* Log */}
          <section className="rounded-lg border bg-card p-4">
            <h2 className="font-semibold">Log ล่าสุด</h2>
            {logs.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">ยังไม่มี log</p>
            ) : (
              <div className="mt-3 space-y-2">
                {logs.map((l) => (
                  <div key={l.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{l.action}</span>
                      <Badge variant={l.status === "success" ? "default" : "destructive"}>
                        {l.status}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(l.created_at).toLocaleString("th-TH")}
                    </div>
                    <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
                      {JSON.stringify(l.detail, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
