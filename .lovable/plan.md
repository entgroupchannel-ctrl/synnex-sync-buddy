## ที่ได้จากไฟล์อัปโหลด

zip มี patch + ไฟล์เต็มของการแก้ปัญหา "session/JWT ที่ตายแล้วยังถูกแนบไปกับทุก request → PostgREST ตอบ 401 ก่อนถึง RLS → checkout ล้ม" ตรงกับ diagnosis รอบก่อน

## แผน apply

1. **สร้างไฟล์ใหม่** `src/lib/auth-session.ts` ตามที่ให้มา
   - `getUserSafe()` — เรียก `getUser()`; ถ้า error เป็น dead-token (401/403, `refresh_token_not_found`, `invalid JWT`, `jwt expired`, `session_not_found`) → `signOut({ scope: "local" })` (de-dupe ด้วย flag) แล้วคืน `null`
   - `getFreshAccessToken()` — คืน access token เฉพาะเมื่อ session ยังไม่หมดอายุ; ถ้าหมดอายุจะยืนยันด้วย `getUserSafe()` ก่อน ไม่งั้นคืน `null` ให้ผู้เรียกไม่แนบ Authorization → fallback เป็น guest

2. **สร้างเทสต์** `src/lib/__tests__/auth-session.test.ts` (7 เทสต์ตามที่ให้มา)

3. **แก้ไฟล์เดิมเฉพาะส่วนที่เป็นตรรกะจริง** (ข้ามส่วนที่เป็นแค่ prettier reformat ในไฟล์เดิม เพื่อให้ diff อ่านง่ายและลดความเสี่ยง)
   - `src/lib/auth-sheet.ts` — `useSupabaseUser()` ใช้ `getUserSafe()` และจัดการ event `SIGNED_OUT` / `TOKEN_REFRESHED` ที่ไม่มี session → `setUser(null)`
   - `src/lib/cart.ts` — `useCustomerTier()` ใช้ `getUserSafe()` แทน `supabase.auth.getUser()`
   - `src/routes/checkout.tsx` — จุด charge บัตรเครดิต ใช้ `getFreshAccessToken()` แทน `getSession().access_token`
   - `src/integrations/supabase/auth-attacher.ts` — แนบ bearer จาก `getFreshAccessToken()` (หมายเหตุ: ไฟล์นี้ generated โดย integration ถ้าถูก regenerate ต้องแก้ซ้ำ)
   - `src/routes/__root.tsx` — เพิ่ม listener กลางหนึ่งตัว: เมื่อ `SIGNED_OUT` → `queryClient.removeQueries()` เพื่อไม่ให้ cache ผูกกับ user เก่าค้าง

4. **ตรวจสอบ** — `tsgo` typecheck + `vitest run` ทั้งชุด แล้วตรวจว่าไม่มี error ใหม่

## ระหว่างนี้

ล้าง key `sb-*-auth-token` ใน localStorage ของ preview (หรือเปิด incognito) แล้วลอง checkout ใหม่ ควรผ่านทันที

## หลัง apply

ต้องกด Publish เพื่ออัปเดต shop.entgroup.co.th