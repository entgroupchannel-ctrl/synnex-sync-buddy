## สาเหตุ (ยืนยันจากโค้ดแล้ว)

Error `Can't load URL — The domain of this URL isn't included in the app's domains` เป็น **error จากฝั่ง Meta app settings ไม่ใช่บั๊กในโค้ด**

โค้ดในโปรเจกต์ถูกต้องแล้ว: `src/routes/auth.tsx` เรียก `supabase.auth.signInWithOAuth({ provider: "facebook", options: { redirectTo: origin + "/auth/callback" } })` → Supabase ส่งต่อไป `facebook.com/dialog/oauth` โดยใช้ redirect URI ของ Supabase เอง ซึ่ง Meta app ยังไม่ได้อนุญาตโดเมนนั้น

## สิ่งที่ต้องทำ (ตั้งค่านอกโค้ด — ผมทำแทนไม่ได้)

ที่ [developers.facebook.com](https://developers.facebook.com/) → App ของคุณ:

1. **Settings → Basic → App Domains** ใส่ทั้งสองค่า:
   - `wuieuiohusgfdilemplj.supabase.co`
   - `shop.entgroup.co.th`
2. **Settings → Basic → Site URL** (ในส่วน Website platform): `https://shop.entgroup.co.th`
3. **Facebook Login → Settings → Valid OAuth Redirect URIs**:
   - `https://wuieuiohusgfdilemplj.supabase.co/auth/v1/callback`
4. **Supabase → Authentication → Providers → Facebook**: ใส่ App ID + App Secret และเปิด Enabled
5. **Supabase → Authentication → URL Configuration → Redirect URLs** เพิ่ม:
   - `https://shop.entgroup.co.th/auth/callback`
   - `https://id-preview--7d8a7d42-ef56-43a0-9320-1e6b4432ed74.lovable.app/auth/callback`
6. ถ้า App ยังอยู่โหมด Development → ต้องเพิ่มบัญชีทดสอบเป็น Tester หรือกด Go Live (ต้องมี Privacy Policy URL — ใช้ `https://shop.entgroup.co.th/privacy` ที่มีอยู่แล้วได้)

## สิ่งที่ผมจะแก้ในโค้ด (เล็กน้อย, ช่วยลูกค้าไม่เจอหน้าจอตาย)

1. `src/routes/auth.tsx` — ขยาย error handling ของ OAuth ให้ครอบคลุมข้อความจาก Meta/Supabase มากขึ้น (เช่น domain/redirect ไม่ถูกอนุญาต, provider ปิดอยู่) แล้วแสดง toast ภาษาไทยที่บอกว่า "ยังตั้งค่าไม่เสร็จ" พร้อมทางเลือกล็อกอินด้วยอีเมล/Google แทน
2. `src/routes/auth.callback.tsx` — ถ้ากลับมาพร้อม `?error=` หรือ `error_description=` จาก provider ให้เด้งกลับ `/auth` พร้อมข้อความอธิบาย ไม่ค้างหน้าเปล่า

## หมายเหตุ

จนกว่าจะทำข้อ 1–6 เสร็จ ปุ่ม Facebook จะยังใช้งานไม่ได้ (แต่ไม่ทำให้เว็บพัง) — Google login กับอีเมล/รหัสผ่านยังทำงานปกติ ถ้าต้องการให้ผม **ซ่อนปุ่ม Facebook ชั่วคราว** จนตั้งค่าเสร็จ บอกได้เลยครับ
