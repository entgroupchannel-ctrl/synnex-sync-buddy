import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "ยืนยันบัญชี | ENT Group" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallback,
});

const NEXT_KEY = "auth:nextPath";

function takeNext(): string {
  try {
    const v = window.sessionStorage.getItem(NEXT_KEY);
    window.sessionStorage.removeItem(NEXT_KEY);
    return v || "/";
  } catch {
    return "/";
  }
}

function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    (async () => {
      try {
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : "";
        const params = new URLSearchParams(hash);
        const search = new URLSearchParams(window.location.search);

        const errDesc =
          params.get("error_description") || search.get("error_description");
        const errCode =
          params.get("error") ||
          search.get("error") ||
          params.get("error_code") ||
          search.get("error_code");
        if (errDesc || errCode) {
          const raw = decodeURIComponent(errDesc || errCode || "").replace(/\+/g, " ");
          const low = raw.toLowerCase();
          if (low.includes("user profile from external provider")) {
            setError(
              "การเชื่อมต่อบัญชี LINE ยังตั้งค่าไม่สมบูรณ์ (ผู้ให้บริการส่งข้อมูลโปรไฟล์ในรูปแบบที่ระบบยังรับไม่ได้) — " +
                "กรุณาเข้าสู่ระบบด้วยอีเมล/รหัสผ่าน หรือ Google ไปก่อน ทีมงานกำลังแก้ไขการตั้งค่าครับ",
            );
            return;
          }
          setError(
            low.includes("redirect") || low.includes("domain") || low.includes("uri")
              ? `การตั้งค่าผู้ให้บริการล็อกอินยังไม่สมบูรณ์ (${raw}) — กรุณาใช้อีเมล/รหัสผ่าน หรือแจ้งผู้ดูแลระบบ`
              : raw || "เข้าสู่ระบบผ่านผู้ให้บริการภายนอกไม่สำเร็จ",
          );
          return;
        }

        const cleanUrl = () =>
          window.history.replaceState({}, "", window.location.pathname);

        const finish = async (type: string | null) => {
          cleanUrl();
          if (type === "recovery") {
            navigate({ to: "/reset-password" as any });
            return;
          }
          if (type === "signup" || type === "email_change") {
            toast.success("ยืนยันอีเมลสำเร็จ ยินดีต้อนรับ!");
          } else {
            toast.success("เข้าสู่ระบบสำเร็จ");
          }

          // ผู้ใช้จาก LINE อาจไม่มีอีเมล — พาไปกรอกข้อมูลติดต่อก่อน ไม่ให้ค้างตอนสั่งซื้อ
          const { data: userRes } = await supabase.auth.getUser();
          const next = takeNext();
          if (userRes?.user && !userRes.user.email) {
            toast.info("กรุณากรอกอีเมลและเบอร์โทรเพื่อใช้สั่งซื้อและรับใบเสร็จ");
            navigate({ to: "/my-account/profile" as never });
            return;
          }
          navigate({ to: next as never });
        };


        const type = params.get("type") || search.get("type");

        // OAuth/OIDC (Google, Facebook, LINE) แบบ PKCE ส่งกลับมาเป็น ?code=...
        const code = search.get("code");
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (code) {
          const { error: exchangeErr } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) {
            // detectSessionInUrl ของ supabase-js อาจแลก code ไปแล้วก่อน effect นี้รัน
            // (code ถูกใช้แล้ว/ไม่มี code_verifier) — ถ้ามี session อยู่จริงถือว่าสำเร็จ
            const { data: existing } = await supabase.auth.getSession();
            if (!existing.session) throw exchangeErr;
          }
          await finish(type);
          return;
        }

        if (access_token && refresh_token) {
          const { error: setErr } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (setErr) throw setErr;
          await finish(type);
          return;
        }

        // ไม่มี code/token ใน URL — อาจถูก supabase-js กินไปแล้ว หรือ session
        // ยังถูกเขียนลง storage ไม่เสร็จ รอสั้นๆ ก่อนตัดสินว่าไม่สำเร็จ
        for (let i = 0; i < 10; i++) {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            await finish(type);
            return;
          }
          await new Promise((r) => setTimeout(r, 300));
        }

        setError(
          "ไม่พบข้อมูลการเข้าสู่ระบบจากผู้ให้บริการ — กรุณาลองเข้าสู่ระบบอีกครั้ง",
        );
      } catch (e: any) {
        setError(e?.message ?? "เกิดข้อผิดพลาด");
      }
    })();
  }, [navigate]);


  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        {error ? (
          <>
            <h1 className="text-xl font-semibold text-red-600">
              ยืนยันบัญชีไม่สำเร็จ
            </h1>
            <p className="text-sm text-muted-foreground break-words">{error}</p>
            <Button onClick={() => navigate({ to: "/auth" })}>
              กลับไปหน้าเข้าสู่ระบบ
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold">กำลังยืนยันบัญชี...</h1>
            <p className="text-sm text-muted-foreground">โปรดรอสักครู่</p>
          </>
        )}
      </div>
    </div>
  );
}
