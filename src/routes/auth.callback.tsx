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
        if (errDesc) {
          setError(decodeURIComponent(errDesc));
          return;
        }

        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        const type = params.get("type") || search.get("type");

        if (access_token && refresh_token) {
          const { error: setErr } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (setErr) throw setErr;
        }

        // clean URL
        window.history.replaceState(
          {},
          "",
          window.location.pathname,
        );

        if (type === "recovery") {
          navigate({ to: "/reset-password" as any });
          return;
        }

        if (type === "signup" || type === "email_change") {
          toast.success("ยืนยันอีเมลสำเร็จ ยินดีต้อนรับ!");
        } else {
          toast.success("เข้าสู่ระบบสำเร็จ");
        }
        navigate({ to: "/" });
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
