import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://shop.entgroup.co.th";

const STATIC_PATHS: { path: string; changefreq: string; priority: string }[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
];

const CATEGORY_PATHS = [
  "Notebook",
  "Monitor",
  "Printer",
  "PC",
  "Software",
  "Network",
  "Storage",
  "Accessories",
];

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
        const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        type Row = { slug: string | null; id: string; name: string | null; image_url: string | null; updated_at: string | null; synced_at: string | null };
        let products: Row[] = [];

        if (url && key) {
          try {
            const supabase = createClient(url, key, { auth: { persistSession: false } });
            const { data } = await supabase
              .from("synnex_products")
              .select("slug, id, name, image_url, updated_at, synced_at")
              .eq("price_approved", true)
              .gt("selling_price", 0)
              .limit(5000);
            products = (data ?? []) as Row[];
          } catch {
            /* ignore — still emit static sitemap */
          }
        }

        const urls: string[] = [];

        for (const s of STATIC_PATHS) {
          urls.push(
            `  <url>\n    <loc>${BASE_URL}${s.path}</loc>\n    <changefreq>${s.changefreq}</changefreq>\n    <priority>${s.priority}</priority>\n  </url>`,
          );
        }

        for (const c of CATEGORY_PATHS) {
          urls.push(
            `  <url>\n    <loc>${BASE_URL}/?category=${encodeURIComponent(c)}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`,
          );
        }

        for (const p of products) {
          const slug = p.slug || p.id;
          const lastmod = p.updated_at || p.synced_at;
          const parts = [
            `    <loc>${BASE_URL}/product/${encodeURIComponent(slug)}</loc>`,
            lastmod ? `    <lastmod>${new Date(lastmod).toISOString()}</lastmod>` : null,
            `    <changefreq>weekly</changefreq>`,
            `    <priority>0.7</priority>`,
          ];
          if (p.image_url) {
            parts.push(
              `    <image:image>\n      <image:loc>${esc(p.image_url)}</image:loc>${p.name ? `\n      <image:title>${esc(p.name)}</image:title>` : ""}\n    </image:image>`,
            );
          }
          urls.push(`  <url>\n${parts.filter(Boolean).join("\n")}\n  </url>`);
        }

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
