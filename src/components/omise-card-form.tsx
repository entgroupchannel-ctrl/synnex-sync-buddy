/**
 * src/components/omise-card-form.tsx  (ไฟล์ใหม่)
 * ฟอร์มกรอกบัตรเครดิต/เดบิต — tokenize ผ่าน Omise.js ที่ฝั่ง browser เท่านั้น
 * เลขบัตร/CVV จริงไม่ผ่านเซิร์ฟเวอร์ของเราเลย ได้แค่ "token" (tok_xxx) ส่งต่อไปเซิร์ฟเวอร์
 *
 * ⚠️ ต้องตั้งค่า VITE_OMISE_PUBLIC_KEY ใน environment variables ของโปรเจกต์
 * (ใช้ public key คู่กับ OMISE_SECRET_KEY ที่ edge functions ใช้อยู่ — public key ปลอดภัยที่จะ expose ฝั่ง client)
 */
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

declare global {
  interface Window {
    Omise: {
      setPublicKey: (key: string) => void;
      createToken: (
        type: "card",
        card: {
          name: string;
          number: string;
          expiration_month: number;
          expiration_year: number;
          security_code: string;
        },
        cb: (statusCode: number, response: { id: string; message?: string }) => void
      ) => void;
    };
  }
}

let omiseScriptPromise: Promise<void> | null = null;
function loadOmiseScript(): Promise<void> {
  if (window.Omise) return Promise.resolve();
  if (omiseScriptPromise) return omiseScriptPromise;
  omiseScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.omise.co/omise.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("โหลด Omise.js ไม่สำเร็จ"));
    document.head.appendChild(script);
  });
  return omiseScriptPromise;
}

export function OmiseCardForm({
  onToken,
  showSaveOption = true,
  submitLabel = "บันทึกบัตร",
}: {
  onToken: (token: string, saveCard: boolean) => Promise<void> | void;
  showSaveOption?: boolean;
  submitLabel?: string;
}) {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState(""); // MM/YY
  const [cvv, setCvv] = useState("");
  const [saveCard, setSaveCard] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const ready = useRef(false);

  useEffect(() => {
    loadOmiseScript()
      .then(() => {
        const publicKey = import.meta.env.VITE_OMISE_PUBLIC_KEY as string | undefined;
        if (!publicKey) {
          toast.error("ยังไม่ได้ตั้งค่า VITE_OMISE_PUBLIC_KEY");
          return;
        }
        window.Omise.setPublicKey(publicKey);
        ready.current = true;
      })
      .catch(() => toast.error("ไม่สามารถโหลดระบบชำระเงินได้ กรุณาลองใหม่"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready.current) {
      toast.error("ระบบชำระเงินยังไม่พร้อม กรุณารอสักครู่แล้วลองใหม่");
      return;
    }
    const [mm, yy] = expiry.split("/").map((s) => s.trim());
    if (!name || number.replace(/\s/g, "").length < 12 || !mm || !yy || cvv.length < 3) {
      toast.error("กรุณากรอกข้อมูลบัตรให้ครบถ้วน");
      return;
    }
    setSubmitting(true);
    window.Omise.createToken(
      "card",
      {
        name,
        number: number.replace(/\s/g, ""),
        expiration_month: Number(mm),
        expiration_year: 2000 + Number(yy.length === 2 ? yy : yy.slice(-2)),
        security_code: cvv,
      },
      async (statusCode, response) => {
        if (statusCode !== 200) {
          toast.error(response.message ?? "ข้อมูลบัตรไม่ถูกต้อง");
          setSubmitting(false);
          return;
        }
        try {
          await onToken(response.id, saveCard);
        } finally {
          setSubmitting(false);
        }
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="card-name">ชื่อบนบัตร</Label>
        <Input id="card-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อ-นามสกุล ตามบัตร" autoComplete="cc-name" />
      </div>
      <div>
        <Label htmlFor="card-number">หมายเลขบัตร</Label>
        <Input
          id="card-number"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="1234 5678 9012 3456"
          autoComplete="cc-number"
          inputMode="numeric"
          maxLength={19}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="card-expiry">วันหมดอายุ (MM/YY)</Label>
          <Input id="card-expiry" value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="12/29" autoComplete="cc-exp" maxLength={5} />
        </div>
        <div>
          <Label htmlFor="card-cvv">CVV</Label>
          <Input id="card-cvv" value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="123" autoComplete="cc-csc" inputMode="numeric" maxLength={4} type="password" />
        </div>
      </div>
      {showSaveOption && (
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <Checkbox checked={saveCard} onCheckedChange={(v) => setSaveCard(v === true)} />
          บันทึกบัตรนี้ไว้ใช้ครั้งต่อไป
        </label>
      )}
      <p className="text-xs text-slate-400">
        ข้อมูลบัตรของคุณถูกเข้ารหัสและส่งตรงถึงผู้ให้บริการชำระเงิน (Omise) โดยตรง เราไม่เก็บเลขบัตรหรือ CVV ไว้ในระบบ
      </p>
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "กำลังดำเนินการ..." : submitLabel}
      </Button>
    </form>
  );
}
