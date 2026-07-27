import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Phone, Mail, MessageCircle, PhoneCall } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/leads")({
  component: AdminLeads,
  head: () => ({
    meta: [
      { title: "ลีดลูกค้า — Admin ENT Group" },
      { name: "description", content: "คำขอใบเสนอราคาและคำขอติดต่อกลับด่วนจากลูกค้า" },
    ],
  }),
});

type QuoteRequest = {
  id: string;
  created_at: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  company_name: string | null;
  product_name: string | null;
  product_sku: string | null;
  selling_price: number | null;
  message: string | null;
  status: string | null;
};

type UrgentContact = {
  id: string;
  created_at: string;
  customer_name: string;
  contact_method: string;
  contact_value: string;
  cart_items: { sku?: string; name?: string; qty?: number }[];
  status: string;
  admin_note: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  new: "ใหม่",
  contacted: "ติดต่อแล้ว",
  closed: "ปิดงานแล้ว",
  pending: "ใหม่",
};
const STATUS_COLOR: Record<string, string> = {
  new: "bg-amber-100 text-amber-800",
  pending: "bg-amber-100 text-amber-800",
  contacted: "bg-blue-100 text-blue-800",
  closed: "bg-slate-100 text-slate-600",
};

function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? "new";
  return <Badge className={`${STATUS_COLOR[s] ?? "bg-slate-100 text-slate-600"} font-medium`}>{STATUS_LABEL[s] ?? s}</Badge>;
}

function AdminLeads() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-1 text-xl font-black text-[color:var(--brand-navy)]">ลีดลูกค้า</h1>
      <p className="mb-4 text-sm text-slate-500">คำขอใบเสนอราคาจากหน้าสินค้า/หมวดหมู่ และคำขอติดต่อกลับด่วนจากตะกร้า (สินค้า By Order)</p>
      <Tabs defaultValue="quote" className="w-full">
        <TabsList>
          <TabsTrigger value="quote">ขอใบเสนอราคา</TabsTrigger>
          <TabsTrigger value="urgent">ติดต่อด่วน</TabsTrigger>
        </TabsList>
        <TabsContent value="quote" className="mt-4">
          <QuoteRequestsTab />
        </TabsContent>
        <TabsContent value="urgent" className="mt-4">
          <UrgentContactsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QuoteRequestsTab() {
  const [rows, setRows] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("quote_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as QuoteRequest[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("quote_requests").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const visible = filter === "all" ? rows : rows.filter((r) => (r.status ?? "new") === filter);

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-slate-400" />;
  if (rows.length === 0) return <p className="text-sm text-slate-500">ยังไม่มีคำขอใบเสนอราคา</p>;

  return (
    <div className="space-y-3">
      <FilterBar filter={filter} setFilter={setFilter} />
      {visible.map((r) => (
        <div key={r.id} className="rounded-lg border bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="font-semibold">{r.customer_name}{r.company_name ? ` — ${r.company_name}` : ""}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {r.customer_phone}</span>
                {r.customer_email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {r.customer_email}</span>}
              </div>
            </div>
            <StatusBadge status={r.status} />
          </div>
          {r.product_name && (
            <div className="mt-2 rounded bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-500">สนใจสินค้า:</span> {r.product_name}
              {r.selling_price ? ` — ฿${Number(r.selling_price).toLocaleString("th-TH")}` : ""}
            </div>
          )}
          {r.message && <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{r.message}</p>}
          <div className="mt-2 text-xs text-slate-400">{r.created_at ? new Date(r.created_at).toLocaleString("th-TH") : ""}</div>
          <div className="mt-3 flex gap-2">
            {(r.status ?? "new") !== "contacted" && (
              <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "contacted")}>ทำเครื่องหมายว่าติดต่อแล้ว</Button>
            )}
            {r.status !== "closed" && (
              <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "closed")}>ปิดงาน</Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function UrgentContactsTab() {
  const [rows, setRows] = useState<UrgentContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("urgent_contact_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as unknown as UrgentContact[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("urgent_contact_requests").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const visible = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-slate-400" />;
  if (rows.length === 0) return <p className="text-sm text-slate-500">ยังไม่มีคำขอติดต่อกลับด่วน</p>;

  return (
    <div className="space-y-3">
      <FilterBar filter={filter} setFilter={setFilter} />
      {visible.map((r) => (
        <div key={r.id} className="rounded-lg border bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="font-semibold">{r.customer_name}</div>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                {r.contact_method === "line" ? <MessageCircle className="h-3 w-3" /> : <PhoneCall className="h-3 w-3" />}
                {r.contact_method === "line" ? "LINE" : "โทร"}: <span className="font-medium text-slate-700">{r.contact_value}</span>
              </div>
            </div>
            <StatusBadge status={r.status} />
          </div>
          {Array.isArray(r.cart_items) && r.cart_items.length > 0 && (
            <div className="mt-2 rounded bg-slate-50 px-3 py-2 text-sm">
              <div className="text-xs text-slate-500">สินค้าในตะกร้า:</div>
              <ul className="mt-1 list-disc pl-5">
                {r.cart_items.map((it, i) => (
                  <li key={i}>{it.name ?? it.sku ?? "—"} × {it.qty ?? 1}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-2 text-xs text-slate-400">{new Date(r.created_at).toLocaleString("th-TH")}</div>
          <div className="mt-3 flex gap-2">
            {r.status !== "contacted" && (
              <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "contacted")}>ทำเครื่องหมายว่าติดต่อแล้ว</Button>
            )}
            {r.status !== "closed" && (
              <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "closed")}>ปิดงาน</Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function FilterBar({ filter, setFilter }: { filter: string; setFilter: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      {["all", "new", "contacted", "closed"].map((s) => (
        <button
          key={s}
          onClick={() => setFilter(s)}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            filter === s ? "bg-[color:var(--brand-navy)] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {s === "all" ? "ทั้งหมด" : (STATUS_LABEL[s] ?? s)}
        </button>
      ))}
    </div>
  );
}
