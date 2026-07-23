// Supabase Edge Function: sync-synnex
// Logs into Synnex Thailand dealer portal, scrapes ASUS product listing,
// and upserts results into synnex_products. Callable only with service role.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";

const BASE = "https://www.synnex.co.th/Dealer";
const LOGIN_URL = `${BASE}/login.aspx`;
const PRODUCT_URL = `${BASE}/online_product_list.aspx?Brand=QVNVUw==`;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Jar = Map<string, string>;

function mergeSetCookie(jar: Jar, res: Response) {
  // deno-lint-ignore no-explicit-any
  const anyH = res.headers as any;
  const raw: string[] = typeof anyH.getSetCookie === "function"
    ? anyH.getSetCookie()
    : res.headers.get("set-cookie")
    ? [res.headers.get("set-cookie")!]
    : [];
  for (const line of raw) {
    const first = line.split(";")[0];
    const eq = first.indexOf("=");
    if (eq === -1) continue;
    const name = first.slice(0, eq).trim();
    const value = first.slice(eq + 1).trim();
    if (name) jar.set(name, value);
  }
}

function cookieHeader(jar: Jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function extractHidden(html: string, name: string): string {
  const re = new RegExp(
    `<input[^>]+name=["']${name}["'][^>]+value=["']([^"']*)["']`,
    "i",
  );
  const m = html.match(re);
  return m ? m[1] : "";
}

interface Product {
  sku: string;
  name: string | null;
  description: string | null;
  price: number | null;
  stock_qty: number | null;
  stock_status: string | null;
  image_url: string | null;
  product_url: string | null;
  brand: string | null;
}

async function scrape(username: string, password: string): Promise<Product[]> {
  const jar: Jar = new Map();

  // 1) GET login page
  const loginPage = await fetch(LOGIN_URL, {
    headers: { "User-Agent": UA, Accept: "text/html" },
    redirect: "manual",
  });
  mergeSetCookie(jar, loginPage);
  const loginHtml = await loginPage.text();
  const vs = extractHidden(loginHtml, "__VIEWSTATE");
  const vsg = extractHidden(loginHtml, "__VIEWSTATEGENERATOR");
  const ev = extractHidden(loginHtml, "__EVENTVALIDATION");
  if (!vs) throw new Error("Login page missing __VIEWSTATE — site changed");

  // 2) POST login
  const form = new URLSearchParams();
  form.set("__VIEWSTATE", vs);
  if (vsg) form.set("__VIEWSTATEGENERATOR", vsg);
  if (ev) form.set("__EVENTVALIDATION", ev);
  form.set("ctl00$ContentPlaceHolder1$txtUsername", username);
  form.set("ctl00$ContentPlaceHolder1$txtPassword", password);
  form.set("ctl00$ContentPlaceHolder1$btnLogin", "Login");

  const loginRes = await fetch(LOGIN_URL, {
    method: "POST",
    headers: {
      "User-Agent": UA,
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader(jar),
      Referer: LOGIN_URL,
    },
    body: form.toString(),
    redirect: "manual",
  });
  mergeSetCookie(jar, loginRes);

  if (loginRes.status >= 300 && loginRes.status < 400) {
    const loc = loginRes.headers.get("location");
    if (loc) {
      const follow = await fetch(new URL(loc, LOGIN_URL).toString(), {
        headers: { "User-Agent": UA, Cookie: cookieHeader(jar) },
        redirect: "manual",
      });
      mergeSetCookie(jar, follow);
      const followHtml = await follow.text();
      if (!/logout|index\.aspx/i.test(followHtml) && !jar.has("ASP.NET_SessionId")) {
        throw new Error("Login failed — no session established");
      }
    }
  }

  // 3) GET product list
  const listRes = await fetch(PRODUCT_URL, {
    headers: {
      "User-Agent": UA,
      Cookie: cookieHeader(jar),
      Referer: `${BASE}/`,
    },
    redirect: "manual",
  });
  const listHtml = await listRes.text();
  if (/login\.aspx/i.test(listHtml) && !/box-item-product/i.test(listHtml)) {
    throw new Error("Redirected to login — credentials rejected");
  }

  // 4) Parse
  const doc = new DOMParser().parseFromString(listHtml, "text/html");
  if (!doc) throw new Error("Failed to parse product page HTML");

  const items = doc.querySelectorAll(".box-item-product");
  const out: Product[] = [];
  const seen = new Set<string>();

  for (const node of items) {
    const el = node as unknown as Element;

    const nameEl = el.querySelector(".product-name a.text-bold");
    const name = nameEl?.textContent?.trim() || null;

    const descEl = el.querySelector(".product-name .text-cut-line-2");
    const description = descEl?.textContent?.trim() || null;

    const skuInput = el.querySelector('input[id*="hdProductName"]');
    const sku = skuInput?.getAttribute("value")?.trim() || "";
    if (!sku || seen.has(sku)) continue;
    seen.add(sku);

    const brandInput = el.querySelector('input[id*="hdItemBrand"]');
    const brand = brandInput?.getAttribute("value")?.trim() || null;

    const priceEl = el.querySelector(".discount-price");
    let price: number | null = null;
    if (priceEl) {
      const cleaned = (priceEl.textContent || "")
        .replace(/฿/g, "")
        .replace(/,/g, "")
        .trim();
      const m = cleaned.match(/-?\d+(?:\.\d+)?/);
      if (m) {
        const n = Number(m[0]);
        if (Number.isFinite(n)) price = n;
      }
    }

    const stockEl = el.querySelector(".product-onhand");
    let stock_qty: number | null = null;
    if (stockEl) {
      const m = (stockEl.textContent || "").match(/(\d+)/);
      if (m) stock_qty = parseInt(m[1], 10);
    }

    const ready = el.querySelector(".statusReady");
    const stock_status = ready ? "พร้อมจัดส่ง" : "สินค้าหมด";

    const imgEl = el.querySelector(".product-img img.img-responsive");
    let image_url = imgEl?.getAttribute("src") || null;
    if (image_url && !/^https?:/i.test(image_url)) {
      image_url = new URL(image_url, BASE + "/").toString();
    }

    const linkEl = el.querySelector(".product-img a");
    const href = linkEl?.getAttribute("href") || null;
    const product_url = href
      ? (/^https?:/i.test(href) ? href : `https://www.synnex.co.th/Dealer/${href.replace(/^\/+/, "")}`)
      : null;

    out.push({
      sku,
      name,
      description,
      price,
      stock_qty,
      stock_status,
      image_url,
      product_url,
      brand,
    });
  }

  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const started_at = new Date().toISOString();
  const { data: log, error: logErr } = await supabase
    .from("sync_logs")
    .insert({ started_at, status: "running", products_found: 0 })
    .select("id")
    .single();
  if (logErr) {
    return new Response(JSON.stringify({ error: logErr.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const username = Deno.env.get("SYNNEX_USERNAME");
    const password = Deno.env.get("SYNNEX_PASSWORD");
    if (!username || !password) throw new Error("Missing Synnex credentials");

    const products = await scrape(username, password);

    if (products.length > 0) {
      const now = new Date().toISOString();
      const rows = products.map((p) => ({ ...p, synced_at: now }));
      const { error: upErr } = await supabase
        .from("synnex_products")
        .upsert(rows, { onConflict: "sku" });
      if (upErr) throw new Error(upErr.message);
    }

    await supabase
      .from("sync_logs")
      .update({
        finished_at: new Date().toISOString(),
        products_found: products.length,
        status: "success",
        message: `Synced ${products.length} products`,
      })
      .eq("id", log.id);

    return new Response(
      JSON.stringify({ status: "success", productsFound: products.length }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase
      .from("sync_logs")
      .update({
        finished_at: new Date().toISOString(),
        status: "error",
        message: msg.slice(0, 500),
      })
      .eq("id", log.id);
    return new Response(
      JSON.stringify({ status: "error", message: msg }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
