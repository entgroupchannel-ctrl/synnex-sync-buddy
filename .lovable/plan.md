## สาเหตุที่ยืนยันได้
ชื่อ provider `custom:line` ถูกต้องแล้ว เพราะ flow ผ่าน `/authorize` และมาถึง callback; error ใหม่เกิดจาก Supabase ไม่ได้รับ `email` จาก LINE โดยโค้ดปัจจุบันไม่ได้ส่ง scopes ให้ LINE และ LINE จะคืนอีเมลเฉพาะ channel ที่ได้รับ Email address permission เท่านั้น

## แผนแก้
1. แก้ปุ่ม LINE ใน `src/routes/auth.tsx` ให้ส่ง scopes `openid profile email` โดยเฉพาะ LINE โดยไม่กระทบ Google/Facebook
2. ปรับ `/auth/callback` ให้แสดงคำแนะนำตรงกับ error `Error getting user email from external provider` แทนข้อความทั่วไป
3. ตรวจสอบ flow จริงว่าลิงก์ authorize มี `scope=openid profile email` และ callback กลับมาสร้าง session/redirect ได้
4. ตั้งค่า LINE Developers Console → Channel → Basic settings → OpenID Connect → Email address permission ให้สถานะเป็น **Applied**; หากยังไม่ Applied ต้องยื่นขอสิทธิ์พร้อมภาพหน้าจออธิบายการใช้อีเมลก่อน เพราะ Supabase Auth ต้องมีอีเมลเพื่อสร้างผู้ใช้

## ค่าที่ต้องคงไว้ใน Supabase
- Provider identifier: `line` (SDK ใช้ `custom:line`)
- Authorization URL: `https://access.line.me/oauth2/v2.1/authorize`
- Token URL: `https://api.line.me/oauth2/v2.1/token`
- Userinfo URL: `https://api.line.me/oauth2/v2.1/userinfo`
- JWKS URI: `https://api.line.me/oauth2/v2.1/certs`
- LINE callback URL: `https://wuieuiohusgfdilemplj.supabase.co/auth/v1/callback`