import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** secret ที่ระบบจำเป็นต้องมี ถ้าหายจะทำให้ฟีเจอร์ที่ระบุพัง */
const REQUIRED_SECRETS: { name: string; feature: string; critical: boolean }[] = [
  { name: "SUPABASE_URL", feature: "การเชื่อมต่อฐานข้อมูลทั้งหมด", critical: true },
  { name: "SUPABASE_SERVICE_ROLE_KEY", feature: "งานฝั่งแอดมิน (ราคาทุน, PO, ออเดอร์)", critical: true },
  { name: "SUPABASE_PUBLISHABLE_KEY", feature: "อ่านข้อมูลสาธารณะฝั่งเซิร์ฟเวอร์", critical: true },
  { name: "RESEND_API_KEY_Synex", feature: "อีเมลแจ้งเตือนลูกค้า/ใบเสนอราคา", critical: false },
  { name: "OMISE_SECRET_KEY", feature: "ชำระเงินด้วยบัตรเครดิต", critical: false },
  { name: "OMISE_PUBLIC_KEY", feature: "ฟอร์มกรอกบัตรเครดิตหน้าเว็บ", critical: false },
  { name: "SLIPOK_API_KEY", feature: "ตรวจสลิปโอนเงินอัตโนมัติ", critical: false },
  { name: "SLIPOK_BRANCH_ID", feature: "ตรวจสลิปโอนเงินอัตโนมัติ", critical: false },
];

export type SecretStatus = {
  name: string;
  feature: string;
  critical: boolean;
  present: boolean;
};

export type SecretsHealth = {
  checkedAt: string;
  ok: boolean;
  missingCritical: string[];
  missingOptional: string[];
  secrets: SecretStatus[];
};

export const checkSecretsHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SecretsHealth> => {
    const { assertAdmin } = await import("@/lib/admin-guard.server");
    await assertAdmin(context.userId);

    const secrets: SecretStatus[] = REQUIRED_SECRETS.map((s) => ({
      ...s,
      present: (process.env[s.name] ?? "").trim().length > 0,
    }));

    const missingCritical = secrets.filter((s) => s.critical && !s.present).map((s) => s.name);
    const missingOptional = secrets.filter((s) => !s.critical && !s.present).map((s) => s.name);

    if (missingCritical.length > 0) {
      console.error("[secrets-health] secret สำคัญหาย:", missingCritical.join(", "));
    }

    return {
      checkedAt: new Date().toISOString(),
      ok: missingCritical.length === 0 && missingOptional.length === 0,
      missingCritical,
      missingOptional,
      secrets,
    };
  });
