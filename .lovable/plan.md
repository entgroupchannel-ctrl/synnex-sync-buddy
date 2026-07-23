# Browse-first Auth & Checkout Redesign

## Scope

Turn the shop into "browse anonymously → auth prompt on Add-to-Cart → guest checkout allowed". Add B2C/B2B registration paths, a `user_profiles`/`user_addresses` schema, an auth modal, guest checkout with optional tax-invoice fields, and an admin Customers page.

## What ships

### 1. Database
- New `user_profiles` (id → auth.users, user_type b2c/b2b, full_name, phone, company_name, tax_id, company_address, account_status).
- New `user_addresses` (recipient, phone, address_line, district, province, postcode, is_default).
- Trigger on `auth.users` insert → row in `user_profiles` (metadata-driven type/status).
- RLS: owner-only read/update; admins can read/update via existing role-check pattern.
- `orders`: add `user_id` (nullable → guest orders), `customer_type` ('b2c'|'b2b'|'guest'), `tax_invoice` jsonb (company_name, tax_id, address), `payment_method` ('transfer'|'cod'), `is_guest`.

### 2. Public browsing (no login)
- Homepage / category / product-detail: keep public, remove any residual auth gates.
- Header: show `เข้าสู่ระบบ` + `สมัครสมาชิก` when signed out; show name + dropdown (orders, profile, addresses, sign out) when signed in.
- Cart badge reads from localStorage (already works).

### 3. Add-to-Cart auth modal
- New `AddToCartAuthSheet` (shadcn Sheet, bottom on mobile / dialog on desktop).
- Triggered on first Add-to-Cart per session for unauth users (dismiss remembered in `sessionStorage`).
- Item is added optimistically first.
- Options: `บุคคลทั่วไป` → B2C form, `องค์กร/B2B` → B2B form, `ดูตะกร้าต่อโดยไม่สมัคร` → close.

### 4. Auth route `/auth`
- Tabs: เข้าสู่ระบบ / สมัคร B2C / สมัคร B2B.
- B2C fields per spec, zod-validated (Thai phone regex, email, password ≥8, confirm match).
- B2B fields per spec + 13-digit tax ID validation, `ต้องการใบกำกับภาษี` toggle, optional PDF upload (Supabase Storage bucket `b2b-docs`, private).
- On B2B signup: profile row gets `account_status='pending_approval'`, toast "ทีมงานจะติดต่อยืนยันภายใน 1 วันทำการ", still allowed to browse/checkout as guest.
- Sign-in with email + password. Google OAuth button via `lovable.auth.signInWithOAuth('google', ...)`. LINE Login deferred (needs external provider config — noted in UI as "coming soon" unless user has already configured it).

### 5. Checkout
- `/checkout` no longer requires login.
- If logged-in: prefill name/phone/email + address from profile/default address.
- If guest: collect ชื่อ, เบอร์, อีเมล, ที่อยู่.
- `ต้องการใบกำกับภาษี` toggle → reveals company_name / tax_id / company_address fields (zod-required when toggled).
- Payment method radio: `โอนเงิน` vs `เก็บเงินปลายทาง (+฿50)`; COD adds 50 to total.
- After order: show bank details (if transfer), and — for guests — "สมัครสมาชิกเพื่อติดตาม order" CTA prefilled with email.

### 6. Logged-in surfaces
- Header dropdown with links: `/account/orders`, `/account/profile`, `/account/addresses`, (B2B only) `/account/company`.
- `/account/orders` lists orders scoped by `user_id`.
- `/account/profile` edits full_name, phone.
- `/account/addresses` CRUD user_addresses with default toggle.
- Product detail: if signed-out, small "เข้าสู่ระบบเพื่อดูราคาพิเศษ B2B" line (no b2b_price column yet — link only).

### 7. Admin `/admin/customers`
- Table: ชื่อ | ประเภท | บริษัท | เบอร์ | สถานะ | ยอดสั่งซื้อรวม | วันสมัคร.
- Filter tabs: ทั้งหมด / B2C / B2B / รอ approve / Guest orders (guests = orders where user_id IS NULL, grouped by email).
- Row actions on pending B2B: Approve / Reject → updates `account_status`.

### 8. UX polish
- Thai phone regex `^0\d{8,9}$` with input mask hint.
- Tax ID: 13-digit numeric input with live check (length + optional checksum note).
- Cart merge on login: on `SIGNED_IN`, if a `ent_cart` exists in localStorage, keep it (Supabase-side cart table is out of scope — cart stays in localStorage per current design; only orders persist).

## What is NOT in this turn

- LINE Login (needs provider setup in Supabase dashboard; button hidden or disabled).
- B2B `b2b_price` column and pricing rules (spec mentions "if admin sets b2b_price" — no admin surface for it yet). We'll show the "ราคาพิเศษ" concept only when the column exists — deferred.
- Server-side cart table / cart merge across devices (kept in localStorage as today).
- Email delivery for the B2B approval notification (Supabase Auth will send confirm-email; the "approved" transactional email is deferred).
- Quotation flow ("ขอใบเสนอราคา") — deferred; the button is a future stub.

## Technical notes

- Schema changes via `supabase--migration` in one call (tables, grants, RLS, trigger, orders columns).
- New auth pages under `src/routes/auth.tsx` (rewrite existing) and new `src/routes/account.*.tsx` behind `_authenticated`.
- Admin customers under `src/routes/_authenticated/admin.customers.tsx`.
- Shared `AddToCartAuthSheet` in `src/components/`.
- All forms: `react-hook-form` + `zod`.
- File upload uses new private storage bucket `b2b-docs` (created via `supabase--storage_create_bucket`, admin-only read).

## Open question (blocking Google button only)

Google OAuth in Supabase — is the Google provider already enabled in your Supabase dashboard? If not, the button will render but 400. Reply "skip google" to hide it, "enabled" to keep it, or paste the redirect URL you configured.
