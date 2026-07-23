
# Synnex Product Sync — Build Plan

## Stack note
This project runs on **TanStack Start + Lovable Cloud (Supabase)**, not a raw Supabase Edge Function project. I'll implement the scraper as a **TanStack server function** (`createServerFn`) instead of a `supabase/functions/sync-synnex/` edge function — that's the supported pattern here and gives the same result (server-only code, secrets from env, writes via service role). Everything else (tables, secrets, UI) matches your spec 1:1.

Also: I'll need to enable Lovable Cloud (Supabase) first — it's not on yet.

## Phase 1 — Database (migration)
Two tables via Supabase migration:
- `synnex_products` (id uuid pk, sku text unique, name text, price numeric, stock text, image_url text, brand text, synced_at timestamptz default now())
- `sync_logs` (id uuid pk, started_at timestamptz, finished_at timestamptz, products_found int, status text check in ('success','error'), message text)
- RLS enabled; SELECT policy for authenticated users on both tables (admin UI reads); writes go through service-role server function only.

## Phase 2 — Scraper (`src/lib/synnex-sync.functions.ts`)
`runSynnexSync` server function (POST, admin-only):
1. Read `SYNNEX_USERNAME` / `SYNNEX_PASSWORD` from `process.env` inside handler.
2. GET `login.aspx` → parse `__VIEWSTATE`, `__VIEWSTATEGENERATOR`, `__EVENTVALIDATION` from HTML.
3. POST form-encoded login with those fields + `ctl00$ContentPlaceHolder1$txtUsername/txtPassword/btnLogin`. Capture `Set-Cookie` (ASP.NET_SessionId, .ASPXAUTH) via a cookie jar.
4. GET `online_product_list.aspx?Brand=QVNVUw==` with the session cookies.
5. Parse HTML table (using `node-html-parser` — Worker-safe, no native deps) to extract SKU / name / price / stock / image_url. Brand hardcoded to "ASUS" for this Brand param (base64 of "ASUS").
6. Upsert into `synnex_products` on `sku` using service-role client (`await import("@/integrations/supabase/client.server")` inside handler).
7. Insert row into `sync_logs` with counts + status.
8. Return `{ productsFound, status, message }`.

`getSyncStatus` server function (GET): returns latest sync_log + product count.
`listProducts` server function (GET): paginated (50/page) with search on sku/name.

Note on reliability: Synnex is a live ASP.NET site with anti-bot measures and likely rate limits. First run may need iteration if response shape differs — I'll add clear error logging to `sync_logs.message`.

## Phase 3 — Admin UI (`/admin/sync`)
Public route (per your spec — no auth wall mentioned). Route: `src/routes/admin.sync.tsx`.
- Sarabun font via `<link>` in `__root.tsx` head, exposed as `--font-sans` in `@theme`.
- Header: title, last-synced timestamp, total product count, "Sync Now" button.
- Sync flow: button calls `runSynnexSync` via `useServerFn` + mutation; spinner while pending; sonner toast for success (green) / error (red).
- Table: SKU, Name, Price (฿ formatted), Stock, Last Synced.
- Search input (debounced) + pagination controls (50/page), server-side via `listProducts`.
- Clean minimal design: white bg, dark navy text (add `--color-navy` token), shadcn Table/Input/Button.

## Secrets
- `SYNNEX_USERNAME`, `SYNNEX_PASSWORD` — added via secure form (add_secret) after you confirm.

## Files to create/edit
- Enable Lovable Cloud
- Migration for the two tables + RLS
- `src/lib/synnex-sync.functions.ts` (server functions)
- `src/lib/synnex-scraper.server.ts` (scraper helpers: cookie jar, viewstate parse, product parse)
- `src/routes/admin.sync.tsx` (admin UI)
- `src/routes/__root.tsx` (add Sarabun `<link>`)
- `src/styles.css` (font token, navy color)
- Add secrets `SYNNEX_USERNAME`, `SYNNEX_PASSWORD`

## Out of scope (say if you want them)
- Auth gate on `/admin/sync` (currently public — anyone with URL can trigger sync)
- Scheduled/cron auto-sync
- Multi-brand support (currently ASUS only per your Brand param)
- Product images beyond `image_url` field
