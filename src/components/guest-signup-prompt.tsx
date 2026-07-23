import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { UserPlus, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Props = {
  orderId: string;
  orderNumber: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  onLinked: () => void;
};

function strengthOf(pw: string): { label: string; color: string; pct: number } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { label: "อ่อน", color: "bg-red-500", pct: 33 };
  if (score <= 3) return { label: "พอใช้", color: "bg-amber-500", pct: 66 };
  return { label: "แข็งแรง", color: "bg-emerald-500", pct: 100 };
}

export function GuestSignupPrompt({ orderId, orderNumber, email, fullName, phone, onLinked }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [done, setDone] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  const mismatch = confirm.length > 0 && confirm !== password;
  const tooShort = password.length > 0 && password.length < 8;
  const s = strengthOf(password);

  async function handleSignup() {
    if (password.length < 8) {
      toast.error("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (password !== confirm) {
      toast.error("รหัสผ่านไม่ตรงกัน");
      return;
    }
    setLoading(true);
    setEmailExists(false);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: fullName, phone },
        },
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
          setEmailExists(true);
        } else {
          toast.error("เกิดข้อผิดพลาด ลองอีกครั้ง");
        }
        return;
      }
      const userId = data.user?.id;
      if (!userId) {
        toast.error("เกิดข้อผิดพลาด ลองอีกครั้ง");
        return;
      }
      await supabase
        .from("orders")
        .update({ user_id: userId, customer_type: "b2c" })
        .eq("id", orderId);
      await supabase.from("user_profiles").upsert({
        id: userId,
        user_type: "b2c",
        full_name: fullName,
        phone,
        account_status: "active",
      });
      setDone(true);
      onLinked();
      toast.success("สมัครสมาชิกสำเร็จ ✓");
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาด ลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  if (dismissed) {
    return (
      <div className="mt-4 rounded-xl border bg-slate-50 p-3 text-center text-xs text-slate-600">
        Order ของคุณถูกบันทึกแล้ว ใช้เลข <b className="font-mono">{orderNumber}</b> ติดตามสถานะได้
      </div>
    );
  }

  if (done) {
    return (
      <section
        className="mt-4 rounded-xl border-[1.5px] p-5 md:p-6"
        style={{ background: "#f0fdf9", borderColor: "#10b981" }}
      >
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          <h3 className="mt-2 text-lg font-bold text-[color:var(--brand-navy)]">สมัครสมาชิกสำเร็จ!</h3>
          <p className="mt-1 text-sm text-slate-700">
            Order <span className="font-mono font-bold">{orderNumber}</span> ถูกบันทึกในบัญชีของคุณแล้ว
          </p>
          <p className="text-xs text-slate-500">ตรวจสอบอีเมลเพื่อยืนยันบัญชี</p>
          <Button asChild className="mt-4">
            <Link to="/account/orders">ดูประวัติ Order ของฉัน →</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="mt-4 rounded-xl border-[1.5px] p-5 md:p-6"
      style={{ background: "#f0fdf9", borderColor: "#10b981" }}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          <UserPlus className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-[color:var(--brand-navy)]">
            บันทึก order นี้ไว้ในบัญชีของคุณ
          </h3>
          <p className="mt-0.5 text-sm text-slate-600">สมัครสมาชิกฟรีด้วยอีเมล</p>

          <ul className="mt-3 space-y-1 text-sm text-slate-700">
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> ติดตาม status order ได้ตลอดเวลา</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> ดูประวัติการสั่งซื้อทั้งหมด</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> รับสิทธิ์ราคาพิเศษสำหรับสมาชิก</li>
          </ul>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">อีเมล</label>
              <input
                type="email"
                value={email}
                readOnly
                className="mt-1 w-full cursor-not-allowed rounded-lg border bg-slate-100 px-3 py-2 text-sm text-slate-700"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">รหัสผ่าน</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="อย่างน้อย 8 ตัวอักษร"
                className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
              {password.length > 0 && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div className={`h-full ${s.color} transition-all`} style={{ width: `${s.pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-500">{s.label}</span>
                </div>
              )}
              {tooShort && <p className="mt-1 text-xs text-red-600">รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">ยืนยันรหัสผ่าน</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
              {mismatch && <p className="mt-1 text-xs text-red-600">รหัสผ่านไม่ตรงกัน</p>}
            </div>

            {emailExists && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                อีเมลนี้มีบัญชีอยู่แล้ว{" "}
                <Link
                  to="/auth"
                  search={{ email, redirect: `/order/${orderNumber}` } as never}
                  className="font-semibold underline"
                >
                  เข้าสู่ระบบ →
                </Link>
              </div>
            )}

            <Button
              onClick={handleSignup}
              disabled={loading || password.length < 8 || password !== confirm}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              สมัครสมาชิก & บันทึก Order นี้
            </Button>

            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="w-full text-center text-xs text-slate-500 underline-offset-2 hover:underline"
            >
              ไว้ทีหลัง — รับอีเมลยืนยัน order แทน
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
