import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert, X } from "lucide-react";
import { checkSecretsHealth, type SecretsHealth } from "@/lib/secrets-health.functions";

/**
 * แจ้งเตือนผู้ดูแลเมื่อ secret ที่จำเป็น (เช่น SUPABASE_SERVICE_ROLE_KEY) หายหรือเป็นค่าว่าง
 * แสดงเฉพาะในโซน /admin
 */
export function SecretsHealthBanner() {
  const check = useServerFn(checkSecretsHealth);
  const [health, setHealth] = useState<SecretsHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      setHealth(await check());
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void run();
    // เช็คซ้ำทุก 5 นาที
    const id = setInterval(() => void run(), 5 * 60 * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!health || health.ok || dismissed) return null;

  const hasCritical = health.missingCritical.length > 0;
  const missing = health.secrets.filter((s) => !s.present);

  return (
    <div
      className={`m-4 rounded-xl border p-4 ${
        hasCritical
          ? "border-destructive/40 bg-destructive/5"
          : "border-amber-400/50 bg-amber-50"
      }`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {hasCritical ? (
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        ) : (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {hasCritical
              ? "พบ Secret สำคัญหาย — ระบบฝั่งแอดมินบางส่วนจะใช้งานไม่ได้"
              : "พบ Secret ที่ยังไม่ได้ตั้งค่า"}
          </p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {missing.map((s) => (
              <li key={s.name} className="flex flex-wrap items-center gap-1.5">
                <code className="rounded bg-background px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                  {s.name}
                </code>
                <span>— กระทบ: {s.feature}</span>
                {s.critical && (
                  <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                    สำคัญ
                  </span>
                )}
              </li>
            ))}
          </ul>
          {hasCritical && (
            <p className="mt-2 text-xs text-muted-foreground">
              วิธีแก้: หากเป็นคีย์ที่ขึ้นต้นด้วย <code className="font-mono">SUPABASE_</code> ให้ผูกค่าใหม่จาก
              Project Settings → Supabase (rebind) เพราะเป็น reserved secret ที่ตั้งเองไม่ได้
              ส่วนคีย์อื่นเพิ่มได้ที่ Project Settings → Secrets
            </p>
          )}
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => void run()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              ตรวจสอบอีกครั้ง
            </button>
            <span className="text-[11px] text-muted-foreground">
              ตรวจล่าสุด {new Date(health.checkedAt).toLocaleTimeString("th-TH")}
            </span>
          </div>
        </div>
        <button
          type="button"
          aria-label="ปิดการแจ้งเตือน"
          onClick={() => setDismissed(true)}
          className="rounded p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** การ์ดสรุปสถานะ secret ทั้งหมด สำหรับหน้า Settings */
export function SecretsHealthPanel() {
  const check = useServerFn(checkSecretsHealth);
  const [health, setHealth] = useState<SecretsHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const run = async () => {
    setLoading(true);
    try {
      setHealth(await check());
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">สถานะ Secret ของระบบ</h2>
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          รีเฟรช
        </button>
      </div>
      {!health ? (
        <p className="text-xs text-muted-foreground">
          {loading ? "กำลังตรวจสอบ..." : "ตรวจสอบไม่สำเร็จ"}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {health.secrets.map((s) => (
            <li key={s.name} className="flex items-center gap-2 text-xs">
              {s.present ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              ) : (
                <AlertTriangle
                  className={`h-4 w-4 shrink-0 ${s.critical ? "text-destructive" : "text-amber-600"}`}
                />
              )}
              <code className="font-mono text-[11px]">{s.name}</code>
              <span className="truncate text-muted-foreground">— {s.feature}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
