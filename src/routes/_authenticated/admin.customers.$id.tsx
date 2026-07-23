import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Building2, User, Check, X, Star, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/customers/$id")({
  head: () => ({
    meta: [
      { title: "รายละเอียดลูกค้า — Admin — ENT Group" },
      { name: "description", content: "รายละเอียดลูกค้า จัดการ tags และบันทึกภายใน" },
      { property: "og:title", content: "Admin — รายละเอียดลูกค้า" },
      { property: "og:description", content: "รายละเอียดลูกค้าและประวัติการสั่งซื้อ" },
    ],
  }),
  component: CustomerDetail,
});

const AVAILABLE_TAGS = ["VIP", "ลูกค้าประจำ", "รอติดตาม", "Blacklist"];

function CustomerDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const profileQ = useQuery({
    queryKey: ["admin-customer", id],
    queryFn: async () => {
      const { data } = await supabase.from("user_profiles").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });
  const p = profileQ.data;

  const addressesQ = useQuery({
    queryKey: ["admin-customer-addresses", id],
    queryFn: async () => {
      const { data } = await supabase.from("user_addresses").select("*").eq("user_id", id).order("is_default", { ascending: false });
      return data ?? [];
    },
  });

  const ordersQ = useQuery({
    queryKey: ["admin-customer-orders", id],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("id,order_number,created_at,status,payment_status,total").eq("user_id", id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const [notes, setNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (p) setNotes(p.admin_notes ?? "");
  }, [p]);

  useEffect(() => {
    if (!notesDirty || !p) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      await supabase.from("user_profiles").update({ admin_notes: notes }).eq("id", id);
      setNotesDirty(false);
      toast.success("บันทึกโน๊ตแล้ว", { duration: 1500 });
    }, 800);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [notes, notesDirty, id, p]);

  const setStatus = async (status: "active" | "rejected") => {
    const { error } = await supabase.from("user_profiles").update({ account_status: status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "active" ? "อนุมัติแล้ว" : "ปฏิเสธแล้ว");
    // Fire-and-forget email
    supabase.functions.invoke("send-b2b-status-email", { body: { user_id: id, status } }).catch(() => { /* email failure is non-blocking */ });
    qc.invalidateQueries({ queryKey: ["admin-customer", id] });
  };

  const toggleTag = async (tag: string) => {
    if (!p) return;
    const cur = new Set<string>(p.tags ?? []);
    if (cur.has(tag)) cur.delete(tag); else cur.add(tag);
    const { error } = await supabase.from("user_profiles").update({ tags: [...cur] }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin-customer", id] });
  };

  if (profileQ.isLoading) return <div className="p-8 text-center">กำลังโหลด...</div>;
  if (!p) return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-slate-500">ไม่พบลูกค้า</p>
        <Link to="/admin/customers" className="mt-3 inline-block text-sm text-[color:var(--brand-navy)] underline">← กลับ</Link>
      </div>
    </div>
  );

  const isB2B = p.user_type === "b2b";
  const tags: string[] = p.tags ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Link to="/admin/customers" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[color:var(--brand-navy)]">
          <ArrowLeft className="h-4 w-4" /> กลับไปหน้ารายชื่อ
        </Link>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr_300px]">
          {/* Left: Profile */}
          <div className="space-y-4">
            <div className="rounded-lg border bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--brand-navy)] text-white">
                  {(p.full_name ?? "?")[0]}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-bold">{p.full_name ?? "—"}</div>
                  <div className="text-xs text-slate-500">{p.phone ?? "—"}</div>
                </div>
              </div>
              <div className="mb-2 flex flex-wrap gap-1">
                {isB2B ? (
                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100"><Building2 className="mr-1 h-3 w-3" />B2B</Badge>
                ) : (
                  <Badge variant="outline"><User className="mr-1 h-3 w-3" />B2C</Badge>
                )}
                {p.account_status === "pending_approval" && <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">รอยืนยัน</Badge>}
                {p.account_status === "active" && <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>}
                {p.account_status === "rejected" && <Badge className="bg-red-100 text-red-800 hover:bg-red-100">ปฏิเสธ</Badge>}
              </div>
              <div className="text-xs text-slate-500">สมัคร: {p.created_at ? new Date(p.created_at).toLocaleDateString("th-TH") : "—"}</div>
            </div>

            {isB2B && (
              <div className="rounded-lg border bg-white p-5">
                <h3 className="mb-2 text-sm font-bold text-[color:var(--brand-navy)]">ข้อมูลบริษัท</h3>
                <div className="space-y-1 text-sm">
                  <div><span className="text-slate-500">บริษัท:</span> {p.company_name ?? "—"}</div>
                  <div><span className="text-slate-500">เลขภาษี:</span> <span className="font-mono">{p.tax_id ?? "—"}</span></div>
                  <div><span className="text-slate-500">ตำแหน่ง:</span> {p.position ?? "—"}</div>
                  <div className="whitespace-pre-wrap"><span className="text-slate-500">ที่อยู่:</span> {p.company_address ?? "—"}</div>
                </div>
              </div>
            )}

            <div className="rounded-lg border bg-white p-5">
              <h3 className="mb-2 text-sm font-bold text-[color:var(--brand-navy)]">ที่อยู่จัดส่ง</h3>
              {(addressesQ.data ?? []).length === 0 ? (
                <p className="text-xs text-slate-500">ยังไม่มีที่อยู่</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {(addressesQ.data ?? []).map((a) => (
                    <div key={a.id} className="rounded border p-2">
                      <div className="font-semibold">{a.label ?? "บ้าน"} {a.is_default && <span className="ml-1 rounded bg-green-100 px-1 text-green-800">ค่าเริ่มต้น</span>}</div>
                      <div>{a.recipient} · {a.phone}</div>
                      <div className="text-slate-600">{[a.address_line, a.district, a.province, a.postcode].filter(Boolean).join(" ")}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center: Orders */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-white p-4">
                <div className="text-xs text-slate-500">จำนวน Orders</div>
                <div className="text-2xl font-black text-[color:var(--brand-navy)]">{p.total_orders ?? 0}</div>
              </div>
              <div className="rounded-lg border bg-white p-4">
                <div className="text-xs text-slate-500">ยอดสั่งซื้อรวม</div>
                <div className="text-2xl font-black text-[color:var(--brand-orange)]">฿{Number(p.total_spent ?? 0).toLocaleString()}</div>
              </div>
            </div>

            <div className="rounded-lg border bg-white">
              <div className="border-b p-4 text-sm font-bold text-[color:var(--brand-navy)]">ประวัติการสั่งซื้อ</div>
              {(ordersQ.data ?? []).length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">ยังไม่มีคำสั่งซื้อ</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Order</th>
                      <th className="px-4 py-2">วันที่</th>
                      <th className="px-4 py-2">สถานะ</th>
                      <th className="px-4 py-2">ชำระเงิน</th>
                      <th className="px-4 py-2 text-right">ยอด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ordersQ.data ?? []).map((o) => (
                      <tr key={o.id} className="border-t">
                        <td className="px-4 py-2 font-mono text-xs">
                          <Link to="/admin/orders/$id" params={{ id: o.id }} className="text-[color:var(--brand-navy)] hover:underline">{o.order_number}</Link>
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-500">{o.created_at ? new Date(o.created_at).toLocaleDateString("th-TH") : "—"}</td>
                        <td className="px-4 py-2 text-xs">{o.status ?? "—"}</td>
                        <td className="px-4 py-2 text-xs">{o.payment_status}</td>
                        <td className="px-4 py-2 text-right font-bold text-[color:var(--brand-orange)]">฿{Number(o.total ?? 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="space-y-4">
            {p.account_status === "pending_approval" && isB2B && (
              <div className="rounded-lg border bg-yellow-50 p-4">
                <h3 className="mb-2 text-sm font-bold text-yellow-900">รอการอนุมัติบัญชี B2B</h3>
                <p className="mb-3 text-xs text-yellow-800">ระบบจะส่งอีเมลแจ้งลูกค้าโดยอัตโนมัติ</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => setStatus("active")} className="bg-[color:var(--brand-green)] hover:opacity-90">
                    <Check className="mr-1 h-4 w-4" /> อนุมัติ
                  </Button>
                  <Button onClick={() => setStatus("rejected")} variant="outline" className="text-red-600">
                    <X className="mr-1 h-4 w-4" /> ปฏิเสธ
                  </Button>
                </div>
              </div>
            )}

            <div className="rounded-lg border bg-white p-4">
              <h3 className="mb-3 text-sm font-bold text-[color:var(--brand-navy)]">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((t) => {
                  const active = tags.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleTag(t)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition ${active ? "bg-purple-600 text-white" : "border bg-white hover:bg-slate-100"}`}
                    >
                      {t === "VIP" && <Star className="h-3 w-3" />}
                      {active ? t : <><Plus className="h-3 w-3" />{t}</>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <h3 className="mb-2 text-sm font-bold text-[color:var(--brand-navy)]">บันทึกภายใน (Admin)</h3>
              <Textarea
                rows={6}
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setNotesDirty(true); }}
                placeholder="โน๊ตส่วนตัวของทีมงาน..."
                maxLength={2000}
              />
              <div className="mt-1 text-xs text-slate-400">{notesDirty ? "กำลังบันทึก..." : "บันทึกอัตโนมัติ"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
