import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { PhoneCall } from "lucide-react";

type CartItemSnapshot = { sku: string; name: string; qty: number };

export function UrgentContactButton({ items, className = "" }: { items: CartItemSnapshot[]; className?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [method, setMethod] = useState<"phone" | "line">("phone");
  const [contactValue, setContactValue] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contactValue.trim()) {
      toast.error("กรุณากรอกชื่อและช่องทางติดต่อให้ครบ");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("urgent_contact_requests").insert({
      customer_name: name.trim(),
      contact_method: method,
      contact_value: contactValue.trim(),
      cart_items: items,
    });
    setBusy(false);
    if (error) {
      toast.error("ส่งคำขอไม่สำเร็จ กรุณาลองใหม่หรือโทร 02-045-6104");
      return;
    }
    toast.success("รับคำขอแล้ว ทีมงานจะติดต่อกลับโดยเร็วที่สุด");
    setOpen(false);
    setName("");
    setContactValue("");
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={`gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-50 ${className}`}
      >
        <PhoneCall className="h-3.5 w-3.5" /> ติดต่อกลับด่วน
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>ติดต่อกลับด่วน</DialogTitle>
            <DialogDescription>
              ฝากชื่อและช่องทางติดต่อไว้ ทีมขายจะติดต่อกลับเรื่องสินค้า By Order ในตะกร้าของคุณ ({items.length} รายการ)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="uc-name">ชื่อ *</Label>
              <Input id="uc-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
            </div>
            <div>
              <Label className="mb-2 block">ติดต่อผ่าน *</Label>
              <RadioGroup value={method} onValueChange={(v) => setMethod(v as "phone" | "line")} className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="phone" /> เบอร์โทร</label>
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="line" /> LINE ID</label>
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="uc-value">{method === "phone" ? "เบอร์โทรศัพท์ *" : "LINE ID *"}</Label>
              <Input
                id="uc-value"
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                required
                placeholder={method === "phone" ? "0812345678" : "line_id_ของคุณ"}
                maxLength={50}
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full bg-orange-600 hover:bg-orange-700">
              {busy ? "กำลังส่ง..." : "ส่งคำขอติดต่อกลับด่วน"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
