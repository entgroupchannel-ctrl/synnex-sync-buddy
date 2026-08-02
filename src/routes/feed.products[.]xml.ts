// Product feed สำหรับ Meta Commerce Manager (Facebook/Instagram Shop) และ Google
// Merchant Center — รูปแบบ RSS 2.0 + namespace g: (มาตรฐานเดียวกัน ใช้ได้ทั้งสองที่)
//
// วิธีใช้งาน (ฝั่ง Meta):
//   1. Meta Commerce Manager → Catalog → Add items → Data feed
//   2. ใส่ URL: https://shop.entgroup.co.th/feed/products.xml
//   3. ตั้ง schedule ให้ดึงซ้ำทุกวัน (feed นี้อัปเดตราคา/สต๊อกสดจาก DB ทุกครั้งที่ถูกเรียก)
//
// ไม่ต้องมี secret/credential ใดๆ เพิ่ม — ใช้ publishable key แบบเดียวกับ sitemap.xml
import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://shop.entgroup.co.th";
const CURRENCY = "THB";

function esc(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** ตัด HTML/markdown ทิ้ง ย่อความยาวให้พอดีกับ description ของ feed (Meta แนะนำ ≤ 5000 ตัวอักษร) */
function toPlainDescription(s: string | null): string {
  if (!s) return "";
  const plain = s
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.slice(0, 2000);
}

function availabilityOf(stockStatus: string | null): "in stock" | "out of stock" | "preorder" {
  if (stockStatus === "พร้อมจัดส่ง") return "in stock";
  if (stockStatus === "สินค้าหมด") return "out of stock";
  return "preorder"; // เช่น "สั่งเข้า" — สินค้าสั่งตามออเดอร์
}

type Row = {
  id: string;
  sku: string;
  slug: string | null;
  name: string | null;
  description: string | null;
  brand: string | null;
  category: string | null;
  image_url: string | null;
  tier_price_guest: number | null;
  selling_price: number | null;
  stock_status: string | null;
};

export const Route = createFileRoute("/feed/products.xml")({
  server: {
    handlers: {
      GET: async () => {
        const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
        const key =
          process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        let products: Row[] = [];
        if (url && key) {
          try {
            const supabase = createClient(url, key, { auth: { persistSession: false } });
            const { data } = await supabase
              .from("synnex_products")
              .select(
                "id, sku, slug, name, description, brand, category, image_url, tier_price_guest, selling_price, stock_status",
              )
              .eq("price_approved", true)
              .gt("selling_price", 0)
              .not("image_url", "is", null)
              .limit(5000);
            products = (data ?? []) as Row[];
          } catch {
            /* ignore — ตอบ feed ว่างดีกว่า 500 error (Meta จะ retry รอบถัดไปเอง) */
          }
        }

        const items = products.map((p) => {
          const slug = p.slug || p.id;
          const price = p.tier_price_guest ?? p.selling_price ?? 0;
          const parts = [
            `    <g:id>${esc(p.sku || p.id)}</g:id>`,
            `    <title>${esc(p.name ?? p.sku)}</title>`,
            `    <description>${esc(toPlainDescription(p.description) || p.name || "")}</description>`,
            `    <link>${BASE_URL}/product/${encodeURIComponent(slug)}</link>`,
            p.image_url ? `    <g:image_link>${esc(p.image_url)}</g:image_link>` : null,
            `    <g:availability>${availabilityOf(p.stock_status)}</g:availability>`,
            `    <g:price>${price.toFixed(2)} ${CURRENCY}</g:price>`,
            `    <g:condition>new</g:condition>`,
            p.brand ? `    <g:brand>${esc(p.brand)}</g:brand>` : null,
            p.category ? `    <g:product_type>${esc(p.category)}</g:product_type>` : null,
          ];
          return `  <item>\n${parts.filter(Boolean).join("\n")}\n  </item>`;
        });

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">`,
          `<channel>`,
          `  <title>ENT Group IT Retail Shop — Product Feed</title>`,
          `  <link>${BASE_URL}</link>`,
          `  <description>รายการสินค้าสำหรับ Facebook/Instagram Catalog และ Google Merchant Center</description>`,
          ...items,
          `</channel>`,
          `</rss>`,
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
