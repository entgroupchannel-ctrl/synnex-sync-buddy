import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: () => <StubPage title="Analytics" desc="รายงานยอดขายและสถิติ — เร็วๆ นี้" />,
  head: () => ({ meta: [{ title: "Analytics — Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
});

function StubPage({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-black text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">{desc}</p>
    </div>
  );
}
