import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/flash-deals")({
  component: FlashDealsPage,
  head: () => ({ meta: [{ title: "Flash Deals — Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
});

function FlashDealsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-black text-slate-900">Flash Deals</h1>
      <p className="mt-2 text-sm text-slate-500">
        ตั้งค่าดีลจำกัดเวลา — เร็วๆ นี้
      </p>
    </div>
  );
}
