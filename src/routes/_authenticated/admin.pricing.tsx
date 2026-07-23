import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Plus, Calculator, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { applyPricing } from "@/lib/pricing.functions";

export const Route = createFileRoute("/_authenticated/admin/pricing")({
  head: () => ({ meta: [{ title: "จัดการราคา · ENT Group" }] }),
  component: PricingPage,
});

type Rule = {
  id: string;
  rule_name: string | null;
  rule_type: string | null;
  target: string | null;
  markup_percent: number | null;
  is_active: boolean | null;
};

function PricingPage() {
  const qc = useQueryClient();
  const run = useServerFn(applyPricing);
  const [progress, setProgress] = useState<{ updated: number; total: number } | null>(null);

  const rulesQ = useQuery({
    queryKey: ["pricing-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_rules")
        .select("*")
        .order("rule_type", { ascending: true })
        .order("target", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Rule[];
    },
  });

  const updateMut = useMutation({
    mutationFn: async (r: Partial<Rule> & { id: string }) => {
      const { error } = await supabase.from("pricing_rules").update(r).eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing-rules"] }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pricing_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("ลบกฎแล้ว");
      qc.invalidateQueries({ queryKey: ["pricing-rules"] });
    },
  });

  const applyMut = useMutation({
    mutationFn: async () => run(),
    onSuccess: (r) => {
      setProgress({ updated: r.updated, total: r.total });
      toast.success(`คำนวณราคาแล้ว ${r.updated.toLocaleString()}/${r.total.toLocaleString()} รายการ`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rules = rulesQ.data ?? [];
  const globals = rules.filter((r) => r.rule_type === "global");
  const categories = rules.filter((r) => r.rule_type === "category");
  const brands = rules.filter((r) => r.rule_type === "brand");

  return (
    <div className="min-h-screen bg-slate-50 font-sarabun">
      <Toaster richColors position="top-right" />
      <header className="border-b bg-[#1a237e] text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
          <h1 className="text-xl font-bold">จัดการราคา (Pricing Rules)</h1>
          <div className="ml-auto flex gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link to="/admin/pricing/products"><Package className="mr-1.5 h-4 w-4" />สินค้ารายชิ้น</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <Link to="/admin/sync">← กลับ Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {/* Apply pricing */}
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <div className="text-lg font-bold text-[#1a237e]">คำนวณราคาขาย</div>
              <div className="text-sm text-slate-600">
                ใช้กฎข้างล่างคำนวณ selling_price ให้ทุกสินค้า (ลำดับ: Override → Brand → Category → Global)
              </div>
            </div>
            <Button
              onClick={() => applyMut.mutate()}
              disabled={applyMut.isPending}
              className="ml-auto bg-[#1565c0] hover:bg-[#0d47a1]"
              size="lg"
            >
              <Calculator className="mr-2 h-5 w-5" />
              {applyMut.isPending ? "กำลังคำนวณ..." : "คำนวณราคาขายทั้งหมด"}
            </Button>
          </div>
          {progress && (
            <div className="mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">
              คำนวณแล้ว <b>{progress.updated.toLocaleString()}</b>/<b>{progress.total.toLocaleString()}</b> รายการ
            </div>
          )}
        </section>

        {/* Rules */}
        <RulesSection
          title="Global (ทั้งหมด)"
          rules={globals}
          type="global"
          onUpdate={(r) => updateMut.mutate(r)}
          onDelete={(id) => deleteMut.mutate(id)}
        />
        <RulesSection
          title="ตามหมวดหมู่ (Category)"
          rules={categories}
          type="category"
          onUpdate={(r) => updateMut.mutate(r)}
          onDelete={(id) => deleteMut.mutate(id)}
        />
        <RulesSection
          title="ตามแบรนด์ (Brand)"
          rules={brands}
          type="brand"
          onUpdate={(r) => updateMut.mutate(r)}
          onDelete={(id) => deleteMut.mutate(id)}
        />
      </main>
    </div>
  );
}

function RulesSection({
  title,
  rules,
  type,
  onUpdate,
  onDelete,
}: {
  title: string;
  rules: Rule[];
  type: "global" | "category" | "brand";
  onUpdate: (r: Partial<Rule> & { id: string }) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="rounded-lg border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-base font-bold text-[#1a237e]">{title}</h2>
        <AddRuleDialog defaultType={type} />
      </div>
      {rules.length === 0 ? (
        <div className="p-6 text-center text-sm text-slate-500">— ยังไม่มีกฎ —</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อ</TableHead>
              <TableHead>เป้าหมาย</TableHead>
              <TableHead className="w-32">Markup %</TableHead>
              <TableHead className="w-24">ใช้งาน</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Input
                    defaultValue={r.rule_name ?? ""}
                    onBlur={(e) => e.target.value !== r.rule_name && onUpdate({ id: r.id, rule_name: e.target.value })}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  {type === "global" ? (
                    <Badge variant="secondary">ทุกสินค้า</Badge>
                  ) : (
                    <Input
                      defaultValue={r.target ?? ""}
                      onBlur={(e) => e.target.value !== r.target && onUpdate({ id: r.id, target: e.target.value })}
                      className="h-8"
                      placeholder={type === "brand" ? "เช่น ASUS" : "เช่น Notebook"}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.5"
                      defaultValue={r.markup_percent ?? 0}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v !== Number(r.markup_percent)) onUpdate({ id: r.id, markup_percent: v });
                      }}
                      className="h-8 w-20"
                    />
                    <span className="text-slate-500">%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Switch checked={!!r.is_active} onCheckedChange={(v) => onUpdate({ id: r.id, is_active: v })} />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(r.id)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}

function AddRuleDialog({ defaultType }: { defaultType: "global" | "category" | "brand" }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"global" | "category" | "brand">(defaultType);
  const [target, setTarget] = useState("");
  const [markup, setMarkup] = useState(10);
  const [name, setName] = useState("");

  const mut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pricing_rules").insert({
        rule_name: name || `${type} ${target || "rule"}`,
        rule_type: type,
        target: type === "global" ? null : target,
        markup_percent: markup,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("เพิ่มกฎแล้ว");
      qc.invalidateQueries({ queryKey: ["pricing-rules"] });
      setOpen(false);
      setTarget("");
      setName("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="mr-1.5 h-4 w-4" />เพิ่มกฎ</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มกฎราคา</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">ประเภท</label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global (ทั้งหมด)</SelectItem>
                <SelectItem value="category">Category (หมวดหมู่)</SelectItem>
                <SelectItem value="brand">Brand (แบรนด์)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">ชื่อกฎ</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ตัวเลือก" />
          </div>
          {type !== "global" && (
            <div>
              <label className="mb-1 block text-sm font-medium">
                {type === "brand" ? "ชื่อแบรนด์" : "ชื่อหมวดหมู่"}
              </label>
              <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder={type === "brand" ? "ASUS" : "Notebook"} />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Markup %</label>
            <Input type="number" step="0.5" value={markup} onChange={(e) => setMarkup(Number(e.target.value))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>ยกเลิก</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending || (type !== "global" && !target)} className="bg-[#1565c0] hover:bg-[#0d47a1]">
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
