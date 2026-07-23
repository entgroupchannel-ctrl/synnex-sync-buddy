// Server-only Synnex Thailand dealer portal scraper helpers.
import { parse } from "node-html-parser";

const BASE = "https://www.synnex.co.th/dealer";
const LOGIN_URL = `${BASE}/login.aspx`;
const PRODUCT_URL = `${BASE}/online_product_list.aspx?Brand=QVNVUw==`;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

type CookieJar = Map<string, string>;

function mergeSetCookie(jar: CookieJar, res: Response) {
  // Cloudflare Workers exposes multiple Set-Cookie via getSetCookie()
  const raw =
    typeof (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === "function"
      ? (res.headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
      : res.headers.get("set-cookie")
        ? [res.headers.get("set-cookie") as string]
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

function cookieHeader(jar: CookieJar): string {
  return Array.from(jar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function extractHidden(html: string, name: string): string {
  const re = new RegExp(
    `<input[^>]+name=["']${name}["'][^>]+value=["']([^"']*)["']`,
    "i",
  );
  const m = html.match(re);
  return m ? m[1] : "";
}

export interface ScrapedProduct {
  sku: string;
  name: string | null;
  price: number | null;
  stock: string | null;
  image_url: string | null;
  brand: string;
}

export async function scrapeSynnexProducts(
  username: string,
  password: string,
): Promise<ScrapedProduct[]> {
  const jar: CookieJar = new Map();

  // 1) GET login page to grab viewstate
  const loginPage = await fetch(LOGIN_URL, {
    headers: { "User-Agent": UA, Accept: "text/html" },
    redirect: "manual",
  });
  mergeSetCookie(jar, loginPage);
  const html = await loginPage.text();
  const viewState = extractHidden(html, "__VIEWSTATE");
  const viewStateGen = extractHidden(html, "__VIEWSTATEGENERATOR");
  const eventValidation = extractHidden(html, "__EVENTVALIDATION");

  if (!viewState) {
    throw new Error("Login page did not return __VIEWSTATE — site layout may have changed");
  }

  // 2) POST login form
  const form = new URLSearchParams();
  form.set("__VIEWSTATE", viewState);
  if (viewStateGen) form.set("__VIEWSTATEGENERATOR", viewStateGen);
  if (eventValidation) form.set("__EVENTVALIDATION", eventValidation);
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

  // Follow one redirect if returned
  if (loginRes.status >= 300 && loginRes.status < 400) {
    const loc = loginRes.headers.get("location");
    if (loc) {
      const follow = await fetch(new URL(loc, LOGIN_URL).toString(), {
        headers: { "User-Agent": UA, Cookie: cookieHeader(jar) },
        redirect: "manual",
      });
      mergeSetCookie(jar, follow);
    }
  }

  if (!jar.has("ASP.NET_SessionId") && !jar.has(".ASPXAUTH")) {
    throw new Error("Login did not produce a session cookie — credentials may be wrong");
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
  mergeSetCookie(jar, listRes);
  const listHtml = await listRes.text();

  if (/login\.aspx/i.test(listHtml) && !/online_product_list/i.test(listRes.url)) {
    throw new Error("Redirected back to login — session not accepted");
  }

  return parseProducts(listHtml, "ASUS");
}

function toNumber(text: string): number | null {
  const cleaned = text.replace(/[^\d.,-]/g, "").replace(/,/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseProducts(html: string, brand: string): ScrapedProduct[] {
  const root = parse(html);
  const results: ScrapedProduct[] = [];
  const seen = new Set<string>();

  // Find data table rows. Synnex uses ASP.NET GridView tables — try broadly.
  const rows = root.querySelectorAll("table tr");
  for (const row of rows) {
    const cells = row.querySelectorAll("td");
    if (cells.length < 3) continue;

    const texts = cells.map((c) => c.text.trim().replace(/\s+/g, " "));
    // Heuristic: skip header rows
    if (texts.every((t) => t.length === 0)) continue;

    // Try to identify SKU (short alnum), name (longer), price (numeric)
    let sku = "";
    let name = "";
    let priceRaw = "";
    let stock = "";
    let img: string | null = null;

    const imgEl = row.querySelector("img");
    if (imgEl) {
      const src = imgEl.getAttribute("src") || "";
      if (src && !/logo|spacer|blank/i.test(src)) {
        img = new URL(src, BASE + "/").toString();
      }
    }

    // Common Synnex table shape: [img?, SKU, Name, Price, Stock, ...]
    // Find first cell that looks like a SKU (letters+digits, no spaces, 4-30 chars)
    const skuIdx = texts.findIndex(
      (t) => /^[A-Za-z0-9._/-]{4,40}$/.test(t) && /[A-Za-z]/.test(t) && /\d/.test(t),
    );
    if (skuIdx === -1) continue;
    sku = texts[skuIdx];

    // Name = longest remaining text cell after SKU
    let nameIdx = -1;
    let nameLen = 0;
    for (let i = skuIdx + 1; i < texts.length; i++) {
      if (texts[i].length > nameLen && texts[i].length > 5 && !/^\d[\d,.\s]*$/.test(texts[i])) {
        nameLen = texts[i].length;
        nameIdx = i;
      }
    }
    if (nameIdx !== -1) name = texts[nameIdx];

    // Price = a cell that parses to a number > 0
    for (let i = 0; i < texts.length; i++) {
      if (i === skuIdx || i === nameIdx) continue;
      const n = toNumber(texts[i]);
      if (n !== null && n > 0 && /\d/.test(texts[i]) && (texts[i].includes(",") || texts[i].includes("."))) {
        priceRaw = texts[i];
        break;
      }
    }

    // Stock — look for cells like "In Stock", "Out", numeric qty
    for (let i = 0; i < texts.length; i++) {
      if (i === skuIdx || i === nameIdx) continue;
      const t = texts[i];
      if (/stock|available|out|มี|หมด/i.test(t) || /^\d{1,4}$/.test(t)) {
        stock = t;
        break;
      }
    }

    if (seen.has(sku)) continue;
    seen.add(sku);

    results.push({
      sku,
      name: name || null,
      price: priceRaw ? toNumber(priceRaw) : null,
      stock: stock || null,
      image_url: img,
      brand,
    });
  }

  return results;
}
