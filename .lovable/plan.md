## ปัญหา
หลังยืนยันอีเมลสมัครสมาชิก Supabase redirect กลับมาที่ `http://localhost:3000/#access_token=...&type=signup` แต่หน้าแรก (`src/routes/index.tsx`) ไม่มี logic อ่าน token จาก URL hash → session ไม่ถูก set และผู้ใช้เห็นเป็น error / ยังไม่ล็อกอิน

สาเหตุ 2 จุด:
1. **Supabase Dashboard**: Site URL / Redirect URLs ยังชี้ที่ `http://localhost:3000` (dev) และ template ยืนยันอีเมล redirect ไป `/` ไม่ใช่หน้า callback ที่รองรับ hash token
2. **โค้ด**: ไม่มี route callback สำหรับรับ hash tokens (`#access_token=...&type=signup|recovery`)

## แผนแก้

### 1. เพิ่มหน้า callback รับ hash token
สร้าง `src/routes/auth.callback.tsx`:
- อ่าน `window.location.hash` → parse `access_token`, `refresh_token`, `type`
- เรียก `supabase.auth.setSession({ access_token, refresh_token })`
- ล้าง hash ออกจาก URL
- ถ้า `type=signup` → toast "ยืนยันอีเมลสำเร็จ" แล้ว navigate ไป `/`
- ถ้า `type=recovery` → navigate ไป `/reset-password`
- ถ้า error → แสดงข้อความและปุ่มกลับ `/auth`

### 2. ตั้งค่า Supabase Dashboard (ผู้ใช้ทำเอง)
ที่ **Authentication → URL Configuration**:
- **Site URL**: `https://shop.entgroup.co.th`
- **Redirect URLs** (เพิ่มทั้งหมด):
  - `https://shop.entgroup.co.th/auth/callback`
  - `https://synnex-sync-buddy.lovable.app/auth/callback`
  - `https://id-preview--7d8a7d42-ef56-43a0-9320-1e6b4432ed74.lovable.app/auth/callback`
  - `http://localhost:3000/auth/callback`
  - `http://localhost:8080/auth/callback`

ที่ **Authentication → Email Templates → Confirm signup**: เปลี่ยน link เป็น
```
{{ .SiteURL }}/auth/callback#access_token={{ .Token }}&type=signup
```
หรือใช้ default template แต่แก้ `emailRedirectTo` ในโค้ด signup

### 3. แก้ signup / reset ให้ส่ง redirect ที่ถูก
ในหน้า `/auth` (signup) และ forgot password:
- `signUp({ ..., options: { emailRedirectTo: \`${window.location.origin}/auth/callback\` } })`
- `resetPasswordForEmail(email, { redirectTo: \`${window.location.origin}/auth/callback?next=/reset-password\` })`

### 4. ทดสอบ
สมัครใหม่ด้วยอีเมลทดสอบ → กดลิงก์ในเมล → ต้อง redirect กลับมาที่ `/auth/callback` → เห็น toast สำเร็จ → login อัตโนมัติ → กลับหน้าแรก

---

**หมายเหตุ**: บัญชี `entgroupchannel@gmail.com` ยืนยันแล้วจาก log (`user_signedup` เวลา 18:12:16 UTC) — หลังแก้เสร็จสามารถล็อกอินด้วย email/password ที่ตั้งไว้ได้ทันที ไม่ต้องสมัครใหม่
