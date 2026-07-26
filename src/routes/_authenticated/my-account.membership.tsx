import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Crown, Star, Gem, Sparkles, Check, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/my-account/membership")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "ระดับสมาชิก & สิทธิประโยชน์ — ENT Group IT Shop" },
      { name: "description", content: "ดูระดับสมาชิก ยอดซื้อสะสม และสิทธิประโยชน์ส่วนลดของคุณ" },
      { property: "og:title", content: "ระดับสมาชิก & สิทธิประโยชน์" },
      { property: "og:description", content: "ยิ่งซื้อเยอะ ยิ่งได้ราคาดีขึ้น" },
    ],
  }),
  component: MembershipPage,
});

const TIERS = [
  {
    key: "member",
    label: "Member",
    icon: Star,
    threshold: 0,
    discountLabel: "ราคาสมาชิก (ถูกกว่าราคาปกติ)",
    color: "text-slate-600",
    bg: "bg-slate-100",
  },
  {
    key: "silver",
    label: "Silver",
    icon: Sparkles,
    threshold: 30000,
    discountLabel: "ส่วนลดเพิ่มอีก 3% จากราคาสมาชิก",
    color: "text-slate-700",
    bg: "bg-slate-200",
  },
  {
    key: "gold",
    label: "Gold",
    icon: Crown,
    threshold: 100000,
    discountLabel: "ส่วนลดเพิ่มอีก 5% จากราคาสมาชิก",
    color: "text-amber-700",
    bg: "bg-amber-100",
  },
  {
    key: "vip",
    label: "VIP",
    icon: Gem,
    threshold: 300000,
    discountLabel: "ส่วนลดเพิ่มอีก 7% จากราคาสมาชิก + ดูแลพิเศษ",
    color: "text-purple-700",
    bg: "bg-purple-100",
  },
] as const;

function MembershipPage() {
  const profileQ = useQuery({
    queryKey: ["my-membership"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("user_profiles")
        .select("user_type, loyalty_tier, b2b_tier, total_spent, total_orders")
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
  });

  const p = profileQ.data;
  const isB2B = p?.user_type === "b2b";
  const totalSpent = Number(p?.total_spent ?? 0);

  const b2bTier = p?.b2b_tier?.toLowerCase();
  const currentTierKey = isB2B
    ? b2bTier === "gold" ? "gold" : b2bTier === "silver" ? "silver" : "member"
    : (p?.loyalty_tier?.toLowerCase() ?? "member");

  const foundIndex = TIERS.findIndex((t) => t.key === currentTierKey);
  const currentIndex = foundIndex < 0 ? 0 : foundIndex;
  const current = TIERS[currentIndex];
  const next = TIERS[currentIndex + 1];
  const progressPct = next ? Math.min(100, (totalSpent / next.threshold) * 100) : 100;
  const CurrentIcon = current.icon;

  if (profileQ.isLoading) {
    return <div className="rounded-lg border bg-white p-6 text-sm text-muted-foreground">กำลังโหลด...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-[color:var(--brand-navy)]">ระดับสมาชิก &amp; สิทธิประโยชน์</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ยิ่งซื้อเยอะ ยิ่งได้ราคาดีขึ้น — คำนวณจากยอดซื้อสะสมตลอดชีพ
        </p>
      </div>

      <div className="rounded-lg border bg-white p-5">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${current.bg}`}>
            <CurrentIcon className={`h-6 w-6 ${current.color}`} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">ระดับปัจจุบันของคุณ</div>
            <div className="text-lg font-black text-[color:var(--brand-navy)]">{current.label}</div>
          </div>
        </div>
        <p className="mt-3 text-sm font-medium text-emerald-700">{current.discountLabel}</p>

        {!isB2B && (
          <div className="mt-5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">
                ยอดซื้อสะสม <span className="font-bold text-foreground">฿{totalSpent.toLocaleString("th-TH")}</span>
                {p?.total_orders ? ` · ${p.total_orders} คำสั่งซื้อ` : ""}
              </span>
              {next && (
                <span className="text-muted-foreground">
                  อีก ฿{Math.max(0, next.threshold - totalSpent).toLocaleString("th-TH")} ถึงระดับ{" "}
                  <span className="font-bold text-foreground">{next.label}</span>
                </span>
              )}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[color:var(--brand-green,#10B981)] transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {!next && <p className="text-xs font-semibold text-purple-700">คุณอยู่ระดับสูงสุดแล้ว</p>}
          </div>
        )}
      </div>

      {!isB2B && (
        <div className="grid gap-3 sm:grid-cols-2">
          {TIERS.map((t, i) => {
            const isCurrent = t.key === currentTierKey;
            const unlocked = i <= currentIndex;
            const Icon = t.icon;
            return (
              <div
                key={t.key}
                className={`rounded-lg border p-4 transition ${
                  isCurrent ? "border-[color:var(--brand-navy)] bg-white shadow-sm" : "bg-white"
                } ${unlocked ? "" : "opacity-70"}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${t.bg}`}>
                    <Icon className={`h-4 w-4 ${t.color}`} />
                  </div>
                  <span className="font-bold">{t.label}</span>
                  {isCurrent && (
                    <span className="rounded-full bg-[color:var(--brand-navy)] px-2 py-0.5 text-[10px] font-bold text-white">
                      ระดับของคุณ
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {t.threshold === 0
                    ? "สมัครสมาชิกฟรี"
                    : `ยอดซื้อสะสม ฿${t.threshold.toLocaleString("th-TH")}+`}
                </div>
                <div className="mt-2 flex items-start gap-2 text-sm">
                  {unlocked ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  )}
                  <span className={unlocked ? "" : "text-muted-foreground"}>{t.discountLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isB2B && (
        <div className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">
          บัญชีองค์กร (B2B) ใช้ระดับราคาที่ตกลงกันโดยเฉพาะ — ติดต่อทีมงานที่ 02-045-6104 หากต้องการทบทวนเงื่อนไข
        </div>
      )}
    </div>
  );
}
