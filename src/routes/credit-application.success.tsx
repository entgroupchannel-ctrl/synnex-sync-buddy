import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Phone } from "lucide-react";

export const Route = createFileRoute("/credit-application/success")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    app: typeof search.app === "string" ? search.app : "",
  }),
  component: SuccessPage,
  head: () => ({
    meta: [
      { title: "ส่งคำขอวงเงินเครดิตแล้ว — ENT Group IT Retail Shop" },
      { name: "description", content: "ระบบได้รับคำขอวงเงินเครดิต B2B ของคุณแล้ว ทีมงานจะติดต่อกลับภายใน 3-5 วันทำการ" },
      { property: "og:title", content: "ส่งคำขอวงเงินเครดิตแล้ว — ENT Group IT Retail Shop" },
      { property: "og:description", content: "ทีมงาน ENT Group จะติดต่อกลับภายใน 3-5 วันทำการ" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function SuccessPage() {
  const { app } = Route.useSearch();
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" />
        <h1 className="mt-4 text-2xl font-black text-[color:var(--brand-navy)]">ได้รับคำขอวงเงินเครดิตแล้ว</h1>
        {app && (
          <p className="mt-3 inline-block rounded-lg bg-white px-4 py-2 font-mono text-lg font-bold text-emerald-700 shadow-sm">
            {app}
          </p>
        )}
        <p className="mt-4 flex items-center justify-center gap-2 text-slate-600">
          <Clock className="h-4 w-4" /> ทีมงานจะติดต่อกลับภายใน 3-5 วันทำการ
        </p>
        <div className="mt-6 rounded-xl border bg-white p-5 text-sm text-slate-600">
          <p className="flex items-center justify-center gap-2 font-semibold text-slate-800">
            <Phone className="h-4 w-4" /> สอบถามเพิ่มเติม 02-045-6104
          </p>
          <p className="mt-1">Sales@entgroup.co.th</p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700"><Link to="/">กลับหน้าแรก</Link></Button>
          <Button asChild variant="outline"><Link to="/my-account/credit">ดูสถานะวงเงินเครดิต</Link></Button>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
