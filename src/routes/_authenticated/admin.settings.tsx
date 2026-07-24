import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const searchSchema = z.object({
  tab: fallback(z.enum(["store", "payment", "shipping", "email"]), "store").default("store"),
});

export const Route = createFileRoute("/_authenticated/admin/settings")({
  validateSearch: zodValidator(searchSchema),
  component: SettingsPage,
  head: () => ({ meta: [{ title: "ตั้งค่า — Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
});

function SettingsPage() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-black text-slate-900">ตั้งค่า</h1>
      <p className="mt-1 text-sm text-slate-500">
        การตั้งค่าร้าน · การชำระเงิน · การจัดส่ง · อีเมล
      </p>

      <Tabs
        value={tab}
        onValueChange={(v) => navigate({ search: { tab: v as any }, replace: true })}
        className="mt-5"
      >
        <TabsList>
          <TabsTrigger value="store">ข้อมูลร้าน</TabsTrigger>
          <TabsTrigger value="payment">การชำระเงิน</TabsTrigger>
          <TabsTrigger value="shipping">การจัดส่ง</TabsTrigger>
          <TabsTrigger value="email">อีเมล</TabsTrigger>
        </TabsList>

        <TabsContent value="store">
          <StoreInfo />
        </TabsContent>
        <TabsContent value="payment">
          <PaymentInfo />
        </TabsContent>
        <TabsContent value="shipping">
          <ShippingInfo />
        </TabsContent>
        <TabsContent value="email">
          <EmailInfo />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">{children}</div>;
}
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[180px_1fr] sm:items-center">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      <Input defaultValue={value} readOnly className="bg-slate-50" />
    </div>
  );
}

function StoreInfo() {
  return (
    <Card>
      <Field label="ชื่อร้าน" value="ENT Group IT Shop" />
      <Field label="Tagline" value="Authorized Dealer — Synnex & VST ECS" />
      <Field label="โทร" value="02-045-6104, 095-739-1053, 084-046-1315" />
      <Field label="Fax" value="02-045-6105" />
      <Field label="อีเมล" value="Sales@entgroup.co.th" />
      <Field label="Tax ID" value="0135558013167" />
      <div className="grid gap-1 sm:grid-cols-[180px_1fr]">
        <label className="text-xs font-semibold text-slate-600">ที่อยู่</label>
        <textarea
          readOnly
          rows={3}
          className="rounded-md border bg-slate-50 px-3 py-2 text-sm"
          defaultValue={`70/5 หมู่ 4 เมทโทร บิซทาวน์ แจ้งวัฒนะ 2
ตำบลคลองพระอุดม อำเภอปากเกร็ด
นนทบุรี 11120`}
        />
      </div>
      <p className="text-[11px] text-slate-500">* บันทึกลงฐานข้อมูล — เร็วๆ นี้</p>
    </Card>
  );
}

function PaymentInfo() {
  const [cod, setCod] = useState(true);
  const [transfer, setTransfer] = useState(true);
  const [card, setCard] = useState(false);
  return (
    <div className="space-y-4">
      <Card>
        <div className="text-sm font-bold text-slate-900">บัญชีธนาคาร</div>
        <Field label="KBank" value="841-2-05851-9 สาขาบางเดื่อ" />
        <Field label="SCB" value="406-817747-1 สาขาบางเดื่อ" />
      </Card>
      <Card>
        <div className="text-sm font-bold text-slate-900">วิธีชำระเงิน</div>
        <ToggleRow label="โอนเงินผ่านธนาคาร" checked={transfer} onChange={setTransfer} />
        <ToggleRow label="เก็บเงินปลายทาง (COD)" checked={cod} onChange={setCod} />
        <ToggleRow label="บัตรเครดิต/เดบิต (เร็วๆ นี้)" checked={card} onChange={setCard} disabled />
        <div className="grid gap-1 pt-2 sm:grid-cols-[180px_1fr] sm:items-center">
          <label className="text-xs font-semibold text-slate-600">ค่า COD (บาท)</label>
          <Input type="number" defaultValue={50} />
        </div>
      </Card>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center justify-between rounded-md border px-3 py-2">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </label>
  );
}

function ShippingInfo() {
  return (
    <Card>
      <div className="text-sm font-bold text-slate-900">วิธีการจัดส่ง</div>
      <p className="text-xs text-slate-500">แก้ไขได้ในตาราง shipping_methods — UI เต็มเร็วๆ นี้</p>
    </Card>
  );
}

function EmailInfo() {
  const [email, setEmail] = useState("");
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-slate-900">Resend</div>
        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
          ✓ Connected
        </span>
      </div>
      <Field label="From" value="noreply@entgroup.co.th" />
      <div className="grid gap-2 pt-2 sm:grid-cols-[180px_1fr_auto] sm:items-center">
        <label className="text-xs font-semibold text-slate-600">ทดสอบส่ง</label>
        <Input
          placeholder="กรอกอีเมล"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button onClick={() => toast.info("ฟีเจอร์ทดสอบส่งอีเมล — เร็วๆ นี้")}>
          ส่งทดสอบ
        </Button>
      </div>
    </Card>
  );
}
