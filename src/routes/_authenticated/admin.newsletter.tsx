import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/newsletter")({
  component: NewsletterPage,
  head: () => ({ meta: [{ title: "Newsletter — Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
});

function NewsletterPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-newsletter"],
    queryFn: async () => {
      const { data } = await supabase
        .from("newsletter_subscribers")
        .select("email,created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-black text-slate-900">Newsletter Subscribers</h1>
      <p className="mt-1 text-sm text-slate-500">
        {isLoading ? "กำลังโหลด..." : `${data?.length ?? 0} รายชื่อ`}
      </p>
      <div className="mt-5 overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left">อีเมล</th>
              <th className="px-3 py-2 text-left">สมัครเมื่อ</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((r: any) => (
              <tr key={r.email} className="border-t">
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {new Date(r.created_at).toLocaleString("th-TH")}
                </td>
              </tr>
            ))}
            {!isLoading && (data?.length ?? 0) === 0 ? (
              <tr>
                <td colSpan={2} className="px-3 py-10 text-center text-xs text-slate-500">
                  ยังไม่มีผู้สมัคร
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
