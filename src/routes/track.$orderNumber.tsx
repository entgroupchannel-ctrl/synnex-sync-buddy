import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { getPublicTracking } from "@/lib/tracking.functions";
import { buildTrackingUrl, providerLabel, eventLabel, eventIcon } from "@/lib/shipping";
import { ExternalLink, Package, MapPin } from "lucide-react";

export const Route = createFileRoute("/track/$orderNumber")({
  head: ({ params }) => ({
    meta: [
      { title: `ติดตามพัสดุ ${params.orderNumber} — ENT Group IT Shop` },
      { name: "description", content: "ติดตามสถานะการจัดส่งพัสดุของคุณ" },
      { property: "og:title", content: `ติดตามพัสดุ ${params.orderNumber}` },
      { property: "og:description", content: "ติดตามสถานะการจัดส่งพัสดุของคุณ" },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const { orderNumber } = Route.useParams();
  const fetchFn = useServerFn(getPublicTracking);
  const q = useQuery({
    queryKey: ["public-tracking", orderNumber],
    queryFn: () => fetchFn({ data: { orderNumber } }),
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[color:var(--brand-navy)]">ติดตามพัสดุ / Track Your Order</h1>
          <p className="mt-1 font-mono text-sm text-slate-600">{orderNumber}</p>
        </div>

        {q.isLoading && <div className="h-40 animate-pulse rounded-lg bg-slate-200" />}
        {!q.isLoading && !q.data && (
          <div className="rounded-lg border bg-white p-10 text-center text-slate-500">
            <Package className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            ไม่พบคำสั่งซื้อ / Order not found
          </div>
        )}

        {q.data && (
          <div className="space-y-4">
            {/* Carrier */}
            <div className="rounded-lg border bg-white p-5">
              {q.data.tracking_number ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase text-slate-500">บริษัทขนส่ง / Carrier</div>
                    <div className="text-lg font-semibold text-[color:var(--brand-navy)]">
                      {providerLabel(q.data.shipping_provider)}
                    </div>
                    <div className="mt-1 font-mono text-sm">{q.data.tracking_number}</div>
                  </div>
                  {(q.data.tracking_url ?? buildTrackingUrl(q.data.shipping_provider, q.data.tracking_number)) && (
                    <a
                      href={q.data.tracking_url ?? buildTrackingUrl(q.data.shipping_provider, q.data.tracking_number)!}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-[color:var(--brand-green,#10B981)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                    >
                      ติดตามที่ {providerLabel(q.data.shipping_provider)} <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-sm text-slate-500">ยังไม่มีการจัดส่ง / Not shipped yet</div>
              )}
            </div>

            {/* ETA + Timeline */}
            <div className="rounded-lg border bg-white p-5">
              {q.data.estimated_delivery && (
                <div className="mb-4 text-sm">
                  <span className="text-slate-500">กำหนดส่ง / Estimated: </span>
                  <b>{new Date(q.data.estimated_delivery).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}</b>
                </div>
              )}
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Timeline</h2>
              {q.data.events.length === 0 ? (
                <div className="text-sm text-slate-500">ยังไม่มีสถานะการจัดส่ง</div>
              ) : (
                <ol className="relative space-y-4 border-l-2 border-slate-200 pl-4">
                  {q.data.events.map((ev: { id: string; event_time: string | null; status: string | null; location: string | null; description: string | null; description_en: string | null }) => (
                    <li key={ev.id} className="relative">
                      <span className="absolute -left-[22px] top-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                      <div className="text-xs text-slate-500">
                        {new Date(ev.event_time!).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="text-sm font-semibold">
                        {eventIcon(ev.status)} {eventLabel(ev.status)}
                      </div>
                      {(ev.description || ev.location) && (
                        <div className="text-sm text-slate-600">
                          {ev.description}
                          {ev.location && <span className="ml-1 text-slate-500"> · {ev.location}</span>}
                        </div>
                      )}
                    </li>
                  ))}
                  {q.data.estimated_delivery && !q.data.delivered_at && (
                    <li className="relative opacity-60">
                      <span className="absolute -left-[22px] top-1 h-3 w-3 rounded-full border-2 border-slate-300 bg-white" />
                      <div className="text-xs text-slate-500">
                        {new Date(q.data.estimated_delivery).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                      </div>
                      <div className="text-sm font-semibold">○ ส่งถึงปลายทาง (ประมาณการ)</div>
                    </li>
                  )}
                </ol>
              )}
            </div>

            {/* Shipping address (masked) */}
            <div className="rounded-lg border bg-white p-5">
              <h2 className="mb-3 flex items-center gap-1 text-sm font-bold uppercase tracking-wide text-slate-500">
                <MapPin className="h-4 w-4" /> ที่อยู่จัดส่ง
              </h2>
              <div className="text-sm">
                <div className="font-semibold">{q.data.shipping.name} · {q.data.shipping.phone}</div>
                <div className="mt-1 text-slate-600">
                  {[q.data.shipping.address, q.data.shipping.district, q.data.shipping.province, q.data.shipping.postcode].filter(Boolean).join(" ")}
                </div>
                <div className="mt-2 text-xs text-slate-400">* แสดงบางส่วนเพื่อความปลอดภัย</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
