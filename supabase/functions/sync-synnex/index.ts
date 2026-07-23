// Supabase Edge Function: sync-synnex
// Logs into Synnex Thailand dealer portal, scrapes ASUS product listing,
// and upserts results into synnex_products. Callable only with service role.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";
import { fetch as undiciFetch, Agent } from "npm:undici@6";

// Synnex serves an incomplete TLS chain (missing intermediate CA),
// so Deno's default fetch rejects it. Use an undici Agent that skips
// peer verification for these requests only.
const insecureAgent = new Agent({ connect: { rejectUnauthorized: false } });
const sfetch = (url: string, init: RequestInit = {}) =>
  undiciFetch(url, { ...init, dispatcher: insecureAgent } as never) as unknown as Promise<Response>;

const BASE = "https://www.synnex.co.th/Dealer";
const LOGIN_URL = `${BASE}/login.aspx`;
const PRODUCT_URL = `${BASE}/online_product_list.aspx?Brand=QVNVUw==`;

// Browser-like headers to bypass basic bot detection.
const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept":
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "th-TH,th;q=0.9,en;q=0.8",
  // NOTE: we intentionally do NOT send Accept-Encoding — undici would then
  // hand us back compressed bytes we'd have to decode manually. Omitting it
  // lets the server return identity encoding.
  "Connection": "keep-alive",
};

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
  console.log("[sync-synnex] step 1: GET", LOGIN_URL);
  const loginPage = await sfetch(LOGIN_URL, {
    headers: { ...BROWSER_HEADERS },
    redirect: "manual",
  });
  console.log("[sync-synnex] step 1 status:", loginPage.status);
  mergeSetCookie(jar, loginPage);
  console.log("[sync-synnex] step 1 cookies:", [...jar.keys()].join(","));
  const loginHtml = await loginPage.text();
  const vs = extractHidden(loginHtml, "__VIEWSTATE");
  const vsg = extractHidden(loginHtml, "__VIEWSTATEGENERATOR");
  const ev = extractHidden(loginHtml, "__EVENTVALIDATION");
  console.log("[sync-synnex] hidden fields — VIEWSTATE:", !!vs, "VSG:", !!vsg, "EV:", !!ev);
  if (!vs) throw new Error("Login page missing __VIEWSTATE — site changed or blocked");

  // 2) POST login
  const form = new URLSearchParams();
  form.set("__VIEWSTATE", vs);
  if (vsg) form.set("__VIEWSTATEGENERATOR", vsg);
  if (ev) form.set("__EVENTVALIDATION", ev);
  form.set("ctl00$ContentPlaceHolder1$txtUsername", username);
  form.set("ctl00$ContentPlaceHolder1$txtPassword", password);
  form.set("ctl00$ContentPlaceHolder1$btnLogin", "Login");

  console.log("[sync-synnex] step 2: POST", LOGIN_URL);
  const loginRes = await sfetch(LOGIN_URL, {
    method: "POST",
    headers: {
      ...BROWSER_HEADERS,
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader(jar),
      Referer: LOGIN_URL,
      Origin: "https://www.synnex.co.th",
    },
    body: form.toString(),
    redirect: "manual",
  });
  console.log("[sync-synnex] step 2 status:", loginRes.status, "location:", loginRes.headers.get("location"));
  mergeSetCookie(jar, loginRes);
  console.log("[sync-synnex] step 2 cookies:", [...jar.keys()].join(","));

  if (loginRes.status >= 300 && loginRes.status < 400) {
    const loc = loginRes.headers.get("location");
    if (loc) {
      const followUrl = new URL(loc, LOGIN_URL).toString();
      console.log("[sync-synnex] step 2b: follow redirect", followUrl);
      const follow = await sfetch(followUrl, {
        headers: { ...BROWSER_HEADERS, Cookie: cookieHeader(jar), Referer: LOGIN_URL },
        redirect: "manual",
      });
      console.log("[sync-synnex] step 2b status:", follow.status);
      mergeSetCookie(jar, follow);
      const followHtml = await follow.text();
      if (!/logout|index\.aspx/i.test(followHtml) && !jar.has("ASP.NET_SessionId")) {
        throw new Error("Login failed — no session established");
      }
    }
  }

  // 3) GET product list
  console.log("[sync-synnex] step 3: GET", PRODUCT_URL);
  const listRes = await sfetch(PRODUCT_URL, {
    headers: {
      ...BROWSER_HEADERS,
      Cookie: cookieHeader(jar),
      Referer: `${BASE}/`,
    },
    redirect: "manual",
  });
  console.log("[sync-synnex] step 3 status:", listRes.status);
  mergeSetCookie(jar, listRes);
  const listHtml = await listRes.text();
  console.log("[sync-synnex] step 3 html length:", listHtml.length);
  if (/login\.aspx/i.test(listHtml) && !/box-item-product/i.test(listHtml)) {
    throw new Error("Redirected to login — credentials rejected");
  }

  // 4) Parse
  const doc = new DOMParser().parseFromString(listHtml, "text/html");
  if (!doc) throw new Error("Failed to parse product page HTML");

  const items = doc.querySelectorAll(".box-item-product");
  console.log("[sync-synnex] step 4: parsed", items.length, "product nodes");
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

  // SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by the
  // Edge Functions runtime — no manual secret configuration required.
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  console.log("[sync-synnex] env — SUPABASE_URL:", !!supabaseUrl, "SERVICE_ROLE:", !!serviceRoleKey);
  if (!supabaseUrl || !serviceRoleKey) {
    const msg = `Missing built-in secrets: ${!supabaseUrl ? "SUPABASE_URL " : ""}${!serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : ""}`.trim();
    console.error("[sync-synnex]", msg);
    return new Response(JSON.stringify({ status: "error", error: msg }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const started_at = new Date().toISOString();
  const { data: log, error: logErr } = await supabase
    .from("sync_logs")
    .insert({ started_at, status: "running", products_found: 0 })
    .select("id")
    .single();
  if (logErr) {
    console.error("[sync-synnex] failed to create sync_log:", logErr.message);
    return new Response(JSON.stringify({ error: logErr.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const diagnostics: Record<string, unknown> = {};

  try {
    // Preflight: verify outbound network works at all
    console.log("[sync-synnex] preflight: fetching https://httpbin.org/get");
    try {
      const pre = await fetch("https://httpbin.org/get");
      const preBody = await pre.text();
      console.log("[sync-synnex] httpbin status:", pre.status);
      diagnostics.httpbin = { ok: true, status: pre.status, bodyPreview: preBody.slice(0, 300) };
    } catch (pe) {
      const perr = pe instanceof Error ? { name: pe.name, message: pe.message, stack: pe.stack } : { message: String(pe) };
      console.error("[sync-synnex] httpbin preflight FAILED:", perr);
      diagnostics.httpbin = { ok: false, error: perr };
      throw new Error(`Outbound network unavailable (httpbin failed): ${perr.message}`);
    }

    const username = Deno.env.get("SYNNEX_USERNAME");
    const password = Deno.env.get("SYNNEX_PASSWORD");
    if (!username || !password) throw new Error("Missing Synnex credentials");

    console.log("[sync-synnex] starting Synnex scrape");
    let products: Product[];
    try {
      products = await scrape(username, password);
      console.log(`[sync-synnex] scrape ok, ${products.length} products`);
      diagnostics.synnex = { ok: true, count: products.length };
    } catch (se) {
      const serr = se instanceof Error
        ? { name: se.name, message: se.message, stack: se.stack, cause: se.cause ? String(se.cause) : undefined }
        : { message: String(se) };
      console.error("[sync-synnex] Synnex scrape FAILED (httpbin OK):", serr);
      diagnostics.synnex = { ok: false, error: serr };
      throw se;
    }

    if (products.length > 0) {
      const now = new Date().toISOString();
      // Incoming price = distributor cost. Save to cost_price; clear
      // selling_price and reset approval so admin must re-approve.
      const rows = products.map((p) => ({
        ...p,
        cost_price: p.price,
        selling_price: null,
        price_approved: false,
        synced_at: now,
      }));
      const { error: upErr } = await supabase
        .from("synnex_products")
        .upsert(rows, { onConflict: "sku" });
      if (upErr) throw new Error(`Upsert failed: ${upErr.message}`);
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
      JSON.stringify({ status: "success", productsFound: products.length, diagnostics }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const err = e instanceof Error
      ? { name: e.name, message: e.message, stack: e.stack, cause: e.cause ? String(e.cause) : undefined }
      : { message: String(e) };
    console.error("[sync-synnex] FATAL:", err);
    await supabase
      .from("sync_logs")
      .update({
        finished_at: new Date().toISOString(),
        status: "error",
        message: err.message.slice(0, 500),
      })
      .eq("id", log.id);
    return new Response(
      JSON.stringify({ status: "error", error: err, diagnostics }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
