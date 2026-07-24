import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Loader2, ArrowLeft, Ticket } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/discount-codes")({
  ssr: false,
  component: AdminDiscountCodesPage,
  head: () => ({
    meta: [
      { title: "จัดการโค้ดส่วนลด — ENT Group Admin" },
      { name: "description", content: "สร้างและจัดการโค้ดส่วนลดของ ENT Group IT Shop" },
      { property: "og:title", content: "จัดการโค้ดส่วนลด — ENT Group Admin" },
      { property: "og:description", content: "ระบบจัดการโค้ดส่วนลด สำหรับผู้ดูแลระบบ" },
    ],
  }),
});

type Code = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "free_shipping" | "fixed" | "percent" | string;
  discount_value: number | null;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number | null;
  valid_from: string | null;
  valid_until: string | null;
  applies_to: string | null;
  is_active: boolean | null;
  created_at?: string | null;
};

const APPLIES = [
  { value: "all", label: "ทุกคน" },
  { value: "b2c", label: "สมาชิก B2C" },
  { value: "b2b", label: "องค์กร B2B" },
  { value: "member", label: "สมาชิกเท่านั้น" },
  { value: "new_customer", label: "ลูกค้าใหม่" },
];

function fmtDate(s?: string | null) {
  if (!s) return "-";
  return new Date(s).toLocaleDateString("th-TH");
}
function typeLabel(t: string) {
  return t === "free_shipping" ? "ส่งฟรี" : t === "fixed" ? "ลดเงิน" : t === "percent" ? "ลด %" : t;
}

function AdminDiscountCodesPage() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("discount_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setCodes((data as Code[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(c: Code) {
    const { error } = await supabase
      .from("discount_codes")
      .update({ is_active: !c.is_active })
      .eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(!c.is_active ? "เปิดใช้งานโค้ดแล้ว" : "ปิดโค้ดแล้ว");
    load();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Link to="/admin/orders" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[color:var(--brand-navy)]">
          <ArrowLeft className="h-4 w-4" /> กลับ Admin
        </Link>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[color:var(--brand-navy)]">
            <Ticket className="h-6 w-6" /> จัดการโค้ดส่วนลด
          </h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[color:var(--brand-orange)] hover:bg-[color:var(--brand-orange-dark)]">
                <Plus className="mr-1 h-4 w-4" /> สร้างโค้ดใหม่
              </Button>
            </DialogTrigger>
            <CreateCodeDialog onSaved={() => { setOpen(false); load(); }} />
          </Dialog>
        </div>

        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-2">โค้ด</th>
                <th className="px-4 py-2">ประเภท</th>
                <th className="px-4 py-2">ส่วนลด</th>
                <th className="px-4 py-2">ยอดขั้นต่ำ</th>
                <th className="px-4 py-2">ใช้แล้ว/จำกัด</th>
                <th className="px-4 py-2">หมดอายุ</th>
                <th className="px-4 py-2">กลุ่ม</th>
                <th className="px-4 py-2">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td></tr>
              )}
              {!loading && codes.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">ยังไม่มีโค้ด</td></tr>
              )}
              {codes.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-2 font-mono font-semibold">{c.code}</td>
                  <td className="px-4 py-2">{typeLabel(c.discount_type)}</td>
                  <td className="px-4 py-2">
                    {c.discount_type === "percent" && `${c.discount_value}%`}
                    {c.discount_type === "fixed" && `฿${Number(c.discount_value ?? 0).toLocaleString()}`}
                    {c.discount_type === "free_shipping" && "ส่งฟรี"}
                  </td>
                  <td className="px-4 py-2">฿{Number(c.min_order_amount ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-2">{c.used_count ?? 0}/{c.usage_limit ?? "∞"}</td>
                  <td className="px-4 py-2">{fmtDate(c.valid_until)}</td>
                  <td className="px-4 py-2">{APPLIES.find((a) => a.value === c.applies_to)?.label ?? c.applies_to}</td>
                  <td className="px-4 py-2">
                    <Switch checked={!!c.is_active} onCheckedChange={() => toggleActive(c)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CreateCodeDialog({ onSaved }: { onSaved: () => void }) {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"free_shipping" | "fixed" | "percent">("fixed");
  const [value, setValue] = useState<string>("100");
  const [minOrder, setMinOrder] = useState("0");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [appliesTo, setAppliesTo] = useState("all");
  const [saving, setSaving] = useState(false);

  async function save() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return toast.error("กรุณากรอกโค้ด");
    if (type !== "free_shipping" && !Number(value)) return toast.error("กรุณากรอกจำนวนส่วนลด");
    setSaving(true);
    const { error } = await supabase.from("discount_codes").insert({
      code: trimmed,
      description: description.trim() || null,
      discount_type: type,
      discount_value: type === "free_shipping" ? 0 : Number(value),
      min_order_amount: Number(minOrder) || 0,
      max_discount_amount: maxDiscount ? Number(maxDiscount) : null,
      usage_limit: usageLimit ? Number(usageLimit) : null,
      used_count: 0,
      valid_until: validUntil ? new Date(validUntil).toISOString() : null,
      applies_to: appliesTo,
      is_active: true,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("สร้างโค้ดสำเร็จ");
    onSaved();
  }

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>สร้างโค้ดส่วนลดใหม่</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>โค้ด *</Label>
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="เช่น SAVE200" maxLength={40} />
        </div>
        <div>
          <Label>คำอธิบาย</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="เช่น ส่งฟรีเมื่อซื้อครบ ฿1,000" maxLength={200} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>ประเภท</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="free_shipping">ส่งฟรี</SelectItem>
                <SelectItem value="fixed">ลดเงิน (฿)</SelectItem>
                <SelectItem value="percent">ลด %</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {type !== "free_shipping" && (
            <div>
              <Label>ส่วนลด {type === "percent" ? "(%)" : "(฿)"}</Label>
              <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>ยอดขั้นต่ำ (฿)</Label>
            <Input type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
          </div>
          {type === "percent" && (
            <div>
              <Label>ส่วนลดสูงสุด (฿)</Label>
              <Input type="number" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} placeholder="ไม่จำกัด" />
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>จำกัดจำนวนครั้ง</Label>
            <Input type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="ว่าง = ไม่จำกัด" />
          </div>
          <div>
            <Label>วันหมดอายุ</Label>
            <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>ใช้ได้กับ</Label>
          <Select value={appliesTo} onValueChange={setAppliesTo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {APPLIES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={save} disabled={saving} className="bg-[color:var(--brand-orange)] hover:bg-[color:var(--brand-orange-dark)]">
          {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
          บันทึกโค้ด
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
