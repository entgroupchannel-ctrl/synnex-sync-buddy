import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/seo")({
  component: SeoDashboard,
});

type Check = "pass" | "warn" | "fail";
type PageResult = {
  path: string;
  status: number | null;
  title: { state: Check; value: string };
  desc: { state: Check; value: string };
  canonical: { state: Check; value: string };
  og: { state: Check; missing: string[] };
  schema: { state: Check; types: string[]; error?: string };
  extras: string[];
  jsonLdRaw: string[];
};

function classify(len: number, min: number, max: number, hardMax: number): Check {
  if (len < min) return "fail";
  if (len > hardMax) return "fail";
  if (len > max) return "warn";
  return "pass";
}

async function fetchAndCheck(path: string, kind: "html" | "raw"): Promise<PageResult> {
  const res: PageResult = {
    path,
    status: null,
    title: { state: "fail", value: "" },
    desc: { state: "fail", value: "" },
    canonical: { state: "fail", value: "" },
    og: { state: "fail", missing: [] },
    schema: { state: "fail", types: [] },
    extras: [],
    jsonLdRaw: [],
  };
  try {
    const r = await fetch(path, { headers: { Accept: kind === "raw" ? "*/*" : "text/html" } });
    res.status = r.status;
    const text = await r.text();
    if (kind === "raw") {
      res.title.state = r.ok ? "pass" : "fail";
      res.title.value = r.ok ? "200 OK" : `HTTP ${r.status}`;
      res.desc.state = "pass";
      res.canonical.state = "pass";
      res.og.state = "pass";
      res.schema.state = "pass";
      res.schema.types = [`${text.length} bytes`];
      return res;
    }
    const doc = new DOMParser().parseFromString(text, "text/html");
    const title = doc.querySelector("title")?.textContent?.trim() ?? "";
    res.title.value = title;
    res.title.state = classify(title.length, 10, 60, 70);

    const desc = doc.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
    res.desc.value = desc;
    res.desc.state = classify(desc.length, 40, 155, 200);

    const canon = doc.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "";
    res.canonical.value = canon;
    res.canonical.state = canon ? "pass" : "fail";

    const required = ["og:title", "og:description", "og:image"];
    const missing = required.filter((p) => !doc.querySelector(`meta[property="${p}"]`));
    res.og.missing = missing;
    res.og.state = missing.length === 0 ? "pass" : missing.length === required.length ? "fail" : "warn";

    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    if (scripts.length === 0) {
      res.schema.state = "fail";
      res.schema.error = "ไม่พบ JSON-LD";
    } else {
      const types: string[] = [];
      for (const s of Array.from(scripts)) {
        const raw = s.textContent ?? "";
        res.jsonLdRaw.push(raw);
        try {
          const parsed = JSON.parse(raw);
          const collect = (obj: unknown) => {
            if (!obj || typeof obj !== "object") return;
            const rec = obj as Record<string, unknown>;
            if (typeof rec["@type"] === "string") types.push(rec["@type"] as string);
            if (Array.isArray(rec["@graph"])) rec["@graph"].forEach(collect);
          };
          collect(parsed);
        } catch (e) {
          res.schema.state = "fail";
          res.schema.error = `JSON parse: ${(e as Error).message}`;
          return res;
        }
      }
      res.schema.types = Array.from(new Set(types));
      res.schema.state = types.length > 0 ? "pass" : "warn";
    }

    // Contextual expectations
    if (path.startsWith("/product/") && !res.schema.types.includes("Product")) {
      res.extras.push("ต้องมี Product schema");
      if (res.schema.state === "pass") res.schema.state = "warn";
    }
    if (path.startsWith("/?category=") && !res.schema.types.includes("ItemList")) {
      res.extras.push("ต้องมี ItemList schema");
      if (res.schema.state === "pass") res.schema.state = "warn";
    }
  } catch (e) {
    res.extras.push(`fetch error: ${(e as Error).message}`);
  }
  return res;
}

function StateIcon({ s }: { s: Check }) {
  if (s === "pass") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (s === "warn") return <AlertTriangle className="h-4 w-4 text-amber-600" />;
  return <XCircle className="h-4 w-4 text-red-600" />;
}

function SeoDashboard() {
  const [results, setResults] = useState<PageResult[]>([]);
  const [running, setRunning] = useState(false);
  const [ranAt, setRanAt] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ path: string; raw: string } | null>(null);

  const run = async () => {
    setRunning(true);
    setResults([]);
    try {
      // Get 5 random product slugs
      const { data: products } = await supabase
        .from("synnex_products")
        .select("slug, id")
        .eq("price_approved", true)
        .gt("selling_price", 0)
        .limit(50);
      const list = (products ?? []).map((p) => p.slug || p.id).filter(Boolean).slice(0, 100);
      const picks: string[] = [];
      for (let i = 0; i < 5 && list.length > 0; i++) {
        const idx = Math.floor(Math.random() * list.length);
        picks.push(list.splice(idx, 1)[0] as string);
      }

      const pages: Array<{ path: string; kind: "html" | "raw" }> = [
        { path: "/", kind: "html" },
        ...picks.map((slug) => ({ path: `/product/${encodeURIComponent(slug)}`, kind: "html" as const })),
        { path: "/?category=Notebook", kind: "html" },
        { path: "/?category=Network", kind: "html" },
        { path: "/sitemap.xml", kind: "raw" },
        { path: "/robots.txt", kind: "raw" },
        { path: "/llms.txt", kind: "raw" },
      ];

      const out: PageResult[] = [];
      for (const p of pages) {
        // eslint-disable-next-line no-await-in-loop
        out.push(await fetchAndCheck(p.path, p.kind));
        setResults([...out]);
      }
      setRanAt(new Date().toLocaleString("th-TH"));
    } finally {
      setRunning(false);
    }
  };

  const summary = results.reduce(
    (acc, r) => {
      const anyFail = [r.title.state, r.desc.state, r.canonical.state, r.og.state, r.schema.state].some((s) => s === "fail");
      const anyWarn = [r.title.state, r.desc.state, r.canonical.state, r.og.state, r.schema.state].some((s) => s === "warn");
      if (anyFail) acc.errors++;
      else if (anyWarn) acc.warnings++;
      else acc.passing++;
      return acc;
    },
    { passing: 0, warnings: 0, errors: 0 },
  );

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">SEO Health Check</h1>
          <p className="text-sm text-slate-500">ตรวจสอบ meta tags, canonical, OG, JSON-LD schema, sitemap และ robots</p>
        </div>
        <Button onClick={run} disabled={running} className="bg-[color:var(--brand-green)] hover:opacity-90">
          {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Run SEO Check
        </Button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border bg-emerald-50 p-3">
          <div className="text-xs text-emerald-800">✅ Pages passing</div>
          <div className="text-2xl font-bold text-emerald-900">{summary.passing}</div>
        </div>
        <div className="rounded-lg border bg-amber-50 p-3">
          <div className="text-xs text-amber-800">⚠️ Warnings</div>
          <div className="text-2xl font-bold text-amber-900">{summary.warnings}</div>
        </div>
        <div className="rounded-lg border bg-red-50 p-3">
          <div className="text-xs text-red-800">❌ Errors</div>
          <div className="text-2xl font-bold text-red-900">{summary.errors}</div>
        </div>
        <div className="rounded-lg border bg-white p-3">
          <div className="text-xs text-slate-500">Last check</div>
          <div className="text-sm font-medium text-slate-800">{ranAt ?? "—"}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Page</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Desc</th>
              <th className="px-3 py-2">Canonical</th>
              <th className="px-3 py-2">OG</th>
              <th className="px-3 py-2">Schema</th>
              <th className="px-3 py-2">Types</th>
              <th className="px-3 py-2">Issues</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 && !running && (
              <tr><td colSpan={9} className="p-8 text-center text-slate-500">กดปุ่ม "Run SEO Check" เพื่อเริ่มตรวจสอบ</td></tr>
            )}
            {results.map((r) => {
              const issues: string[] = [];
              if (r.title.state !== "pass") issues.push(`title: ${r.title.value.length} chars`);
              if (r.desc.state !== "pass") issues.push(`desc: ${r.desc.value.length} chars`);
              if (r.canonical.state !== "pass") issues.push("no canonical");
              if (r.og.missing.length) issues.push(`OG missing: ${r.og.missing.join(", ")}`);
              if (r.schema.error) issues.push(r.schema.error);
              issues.push(...r.extras);
              return (
                <tr key={r.path} className="border-t">
                  <td className="px-3 py-2">
                    <button className="text-left text-blue-700 underline hover:text-blue-900" onClick={() => setPreview({ path: r.path, raw: r.jsonLdRaw.join("\n\n---\n\n") || "(no JSON-LD)" })}>{r.path}</button>
                  </td>
                  <td className="px-3 py-2">{r.status ?? "—"}</td>
                  <td className="px-3 py-2"><StateIcon s={r.title.state} /></td>
                  <td className="px-3 py-2"><StateIcon s={r.desc.state} /></td>
                  <td className="px-3 py-2"><StateIcon s={r.canonical.state} /></td>
                  <td className="px-3 py-2"><StateIcon s={r.og.state} /></td>
                  <td className="px-3 py-2"><StateIcon s={r.schema.state} /></td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {r.schema.types.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-red-700">{issues.join(" · ") || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {preview && (
        <div className="mt-6 rounded-lg border bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold">JSON-LD Preview — {preview.path}</h2>
            <button className="text-xs text-slate-500 hover:text-slate-800" onClick={() => setPreview(null)}>ปิด</button>
          </div>
          <pre className="max-h-96 overflow-auto rounded bg-slate-900 p-3 text-xs text-emerald-200">{preview.raw}</pre>
        </div>
      )}
    </div>
  );
}
