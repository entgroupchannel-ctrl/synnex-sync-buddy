## สาเหตุที่คลิก "🔧 Config PC" แล้วหน้าไม่ปรากฏทันที

ตรวจสอบแล้วพบ **3 สาเหตุหลัก**:

### 1. Router ไม่ได้เปิด preload (สาเหตุหลัก)
`src/router.tsx` ตั้ง `defaultPreloadStaleTime: 0` แต่**ไม่มี `defaultPreload: "intent"`** → ตอน hover ที่ลิงก์ TanStack Router ไม่ pre-fetch route chunk ล่วงหน้า พอคลิกจริงต้องดาวน์โหลด chunk แบบ cold

### 2. Route file หนัก (1,063 บรรทัด)
`src/routes/pc-builder.tsx` รวม 7-step wizard + quotation dialog + form ในไฟล์เดียว → chunk ใหญ่ ดาวน์โหลดช้าโดยเฉพาะบน mobile

### 3. Query Supabase ยิงตอน mount ไม่มี skeleton
`useEffect` บรรทัด 462 ยิง query ตอน mount และตั้ง `loading = true` แต่พื้นที่รายการสินค้าแสดงเป็นว่าง ทำให้รู้สึกว่าหน้ายัง "ไม่มา" ทั้งที่ shell มาแล้ว

Link ใน `src/components/site-header.tsx` (บรรทัด 327) ก็ไม่มี `preload="intent"` เฉพาะตัว

---

## แผนแก้ไข

### Step 1 — เปิด preload ระดับ router
แก้ `src/router.tsx` เพิ่ม `defaultPreload: "intent"` และ `defaultPreloadDelay: 50` เพื่อให้ทุก `<Link>` pre-fetch chunk ตอน hover/focus/touchstart — คลิกจริงจะรู้สึก instant

### Step 2 — เพิ่ม preload ที่ nav link
ระบุ `preload="intent"` ให้ `<Link to="/pc-builder">` ใน `site-header.tsx` เป็น safety net

### Step 3 — Skeleton แทน blank ระหว่างโหลด
ใน `pc-builder.tsx` ช่วง `loading = true` แสดง skeleton card 8–12 ใบ แทนพื้นที่ว่าง เพื่อให้หน้ารู้สึก "ปรากฏทันที"

### (Optional) Step 4 — ลดขนาด chunk ด้วย lazy dialog
แยก quotation dialog (`Dialog`, `Textarea`, form logic) ออกเป็นไฟล์ย่อย import ด้วย `React.lazy` เฉพาะตอนกดปุ่ม → ลด initial chunk ของ `/pc-builder` อย่างมีนัยสำคัญ

หมายเหตุ: TanStack Start เปิด `autoCodeSplitting` อยู่แล้ว → component ของ route นี้ถูก split เป็น chunk แยกอัตโนมัติ ปัญหาจึงอยู่ที่ **ไม่มี prefetch** ไม่ใช่ splitting

---

## Technical notes
- `defaultPreload: "intent"` + `defaultPreloadStaleTime: 0` เป็นคู่ที่แนะนำ (Query เป็นเจ้าของ freshness แทน router)
- ไม่แตะ database, edge function, business logic
- Step 1–3 ควรแก้อาการได้ครบ; Step 4 เป็น optimization
