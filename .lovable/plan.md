## Overview
Build a full customer management system with a unified `/my-account` layout for customers and a redesigned `/admin/customers` + detail page for staff. Uses existing `user_profiles`, `user_addresses`, `orders`, and `email_logs` tables; adds tags, admin notes, and cached order stats.

## Database migration
```sql
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS total_orders integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_spent numeric NOT NULL DEFAULT 0;
```
`user_addresses` already exists with matching schema + RLS — skip.

Add `has_role`-style admin check via existing `user_profiles` (project uses `account_status` + admin flag — will check current admin RLS; if none, keep current pattern where any authenticated user reads own row and admins are identified in app). Add an RLS policy so admins can read/update all `user_profiles` (guarded by a security-definer `is_admin(uid)` helper) if not present.

Trigger: recompute `total_orders`/`total_spent` on orders insert/update (status not cancelled).

## `/my-account` layout
New route file `src/routes/_authenticated/my-account.tsx` — layout with sidebar (ข้อมูลส่วนตัว / ที่อยู่ / ประวัติสั่งซื้อ / ข้อมูลบริษัท B2B-only) and `<Outlet />`. Child routes:
- `my-account.index.tsx` → redirect to profile
- `my-account.profile.tsx` — edit name/phone/email + change password (requires old password via reauth) + type badge
- `my-account.addresses.tsx` — reuse existing addresses UI, list/create/default/delete
- `my-account.orders.tsx` — order list; each row links to `/order/$orderNumber`; slip upload + PDF download already handled on order detail page (keep link)
- `my-account.company.tsx` — B2B only; shows company info + `account_status` message

Redirect old `/account/*` routes to `/my-account/*` (or keep both — simpler: rewrite existing files to live under new path). Plan: create new routes; remove old `account.*` files.

## `/admin/customers` overhaul
Rewrite `admin.customers.tsx`:
- Columns: ชื่อ | Type | บริษัท | เบอร์ | Orders | ยอดรวม | สมัครเมื่อ | สถานะ
- Filter chips: ทั้งหมด / B2C / B2B / รอ Approve / VIP (tag)
- Search across name/email/phone/company
- Row click → `/admin/customers/$id`
- Badges: B2C blue, B2B active purple, B2B pending yellow, VIP pink

## `/admin/customers/$id` detail
New route `admin.customers.$id.tsx`, 3-column grid:
- **LEFT** customer info (name/email/phone/joined, type+status, B2B company/tax/address)
- **CENTER** orders list w/ cumulative total + latest order
- **RIGHT** actions:
  - Approve / Reject B2B → update `account_status`; call new edge function `send-b2b-status-email`
  - Tag manager (add/remove: VIP, Blacklist, Corporate) → updates `tags[]`
  - Admin notes textarea with debounced auto-save (~800ms)

## Edge function `send-b2b-status-email`
`supabase/functions/send-b2b-status-email/index.ts` — accepts `{ user_id, status }`, loads profile+auth email, sends Resend email using shared helper. Deploy via edge function tool.

## Checkout auto-fill
In `checkout.tsx`, if authenticated, load default address from `user_addresses` and prefill shipping fields (only if user hasn't typed anything yet).

## Files
Create:
- `src/routes/_authenticated/my-account.tsx` (layout)
- `src/routes/_authenticated/my-account.index.tsx`
- `src/routes/_authenticated/my-account.profile.tsx`
- `src/routes/_authenticated/my-account.addresses.tsx`
- `src/routes/_authenticated/my-account.orders.tsx`
- `src/routes/_authenticated/my-account.company.tsx`
- `src/routes/_authenticated/admin.customers.$id.tsx`
- `supabase/functions/send-b2b-status-email/index.ts`

Modify:
- `src/routes/_authenticated/admin.customers.tsx` (new columns/filters + link to detail)
- `src/routes/checkout.tsx` (auto-fill from default address)
- `src/components/site-header.tsx` (menu: /account/* → /my-account/*)

Delete (replaced): `src/routes/_authenticated/account.profile.tsx`, `account.addresses.tsx`, `account.orders.tsx`.

## Confirmations needed
1. OK to delete the old `/account/*` routes and replace with `/my-account/*`? (Or keep `/account/*` as redirects for existing links?)
2. Tag list fixed to `VIP / Blacklist / Corporate`, or allow free-form tags too?
3. Send B2B approval/reject email from Resend with generic template — confirm sender `Sales@entgroup.co.th`?