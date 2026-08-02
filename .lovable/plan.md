## สาเหตุ (ยืนยันจาก auth logs แล้ว)

Log ฝั่ง Supabase Auth ตอนที่คุณกดล็อกอิน LINE ขึ้นว่า:

```text
500: Error getting user profile from external provider
failed to verify ID token: oidc: id token signed with unsupported algorithm,
expected ["ES256"] got "HS256"
```

ไม่ใช่บั๊กในโค้ดเว็บเลย — LINE Login เซ็น `id_token` ด้วย **HS256** (ใช้ channel secret) แต่ Supabase custom provider แบบ **OIDC** บังคับ ES256 เท่านั้น จึงพังที่ `/callback` ก่อนจะสร้าง session ทุกครั้ง (Google/Facebook/อีเมล ไม่เกี่ยว)

## แนวทางแก้ (ตั้งค่าใน Supabase — ไม่ต้องแก้โค้ด)

เปลี่ยน custom provider `custom:line` จาก type **OIDC** → **OAuth2** เพื่อให้ Supabase ดึงโปรไฟล์จาก userinfo endpoint แทนการ verify id_token:

1. Supabase Dashboard → Authentication → Providers → ลบ/แก้ provider `custom:line` แล้วสร้างใหม่เป็นชนิด **OAuth2**
2. ใส่ค่า endpoints ของ LINE:
   - Authorization URL: `https://access.line.me/oauth2/v2.1/authorize`
   - Token URL: `https://api.line.me/oauth2/v2.1/token`
   - Userinfo URL: `https://api.line.me/v2/profile`
   - Scopes: `profile openid email`
   - Client ID / Secret: LINE Channel ID / Channel secret
   - User ID field: `userId` (LINE คืน `userId`, `displayName`, `pictureUrl`)
3. LINE Developers Console → LINE Login → Callback URL:
   `https://wuieuiohusgfdilemplj.supabase.co/auth/v1/callback`
4. Supabase → URL Configuration → Redirect URLs เพิ่ม
   `https://shop.entgroup.co.th/auth/callback` และ URL preview

ถ้า LINE ไม่คืนอีเมล (ต้องขอสิทธิ์ Email permission ใน console) Supabase จะสร้างผู้ใช้แบบไม่มีอีเมล — ต้องเผื่อไว้ในโค้ดตามข้อล่าง

## สิ่งที่จะแก้ในโค้ด (เล็ก)

1. `src/routes/auth.callback.tsx` — จับ `error_description` ที่มีคำว่า "user profile from external provider" แล้วแสดงข้อความไทยชัดเจนว่า "การเชื่อมต่อ LINE ยังตั้งค่าไม่สมบูรณ์" พร้อมปุ่มกลับไปล็อกอินด้วยอีเมล/Google (ปัจจุบันแสดงข้อความดิบ)
2. `src/routes/auth.tsx` — ระหว่างยังตั้งค่าไม่เสร็จ เพิ่ม flag ให้ซ่อน/ปิดปุ่ม LINE ได้ในที่เดียว (ค่าเริ่มต้น: แสดง)
3. รองรับผู้ใช้ LINE ที่ไม่มีอีเมล: หลังล็อกอินสำเร็จ ถ้า `user.email` ว่าง ให้พาไปหน้ากรอกอีเมล/เบอร์ในโปรไฟล์ก่อนสั่งซื้อ (ไม่ให้ค้างหน้า checkout)

## ทางเลือกสำรอง (ถ้า Supabase ไม่มี type OAuth2 ให้เลือก)

ทำ LINE login เองผ่าน server route: `/api/public/auth/line/callback` แลก `code` → access token → เรียก `https://api.line.me/v2/profile` → สร้าง/ค้นหา user ด้วย service role แล้วออก session ให้ (ต้องเก็บ state/PKCE เอง) — งานมากกว่า จึงเสนอเป็นแผนสำรอง

## หมายเหตุ

จนกว่าจะทำข้อ 1–4 เสร็จ ปุ่ม LINE จะยังล็อกอินไม่ได้ (แต่เว็บไม่พัง) ครับ
