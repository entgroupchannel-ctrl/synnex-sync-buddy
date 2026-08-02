## สาเหตุที่ยืนยันแล้ว

ผมแมปตำแหน่งใน bundle จริงบนเว็บ (`/assets/order._orderNumber-D8KQCR4G.js` ตำแหน่ง 10879) โค้ดตรงนั้นคือ:

```text
F = P(); I = F.Buffer.from && F.Buffer.alloc && ...
var P = i(((e,t) => { t.exports = {} }));   // โมดูล "buffer" ถูก stub เป็น {}
```

`F.Buffer` เป็น `undefined` → อ่าน `.from` ไม่ได้ → `TypeError: Cannot read properties of undefined (reading 'from')`

- **ไม่ใช่** `supabase.storage.from("payment-slips")`
- **ไม่ใช่** `supabaseAdmin.from("orders")` ใน server function
- ต้นเหตุจริง: ไลบรารี `promptpay-qr` ที่หน้านี้ import (ผ่าน `promptpay-modal`) ใช้ `crc` ซึ่งต้องการ `Buffer` ของ Node ตอน build สำหรับเบราว์เซอร์ Buffer ถูกแทนด้วยอ็อบเจ็กต์ว่าง จึงพังตอนโมดูลถูกประเมินผล (พังทันทีที่โหลดหน้า ไม่เกี่ยวกับข้อมูลของออเดอร์ ENT-20260802-424634)

หมายเหตุ: ในพรีวิว (dev) ไม่พัง เพราะ dev server ให้ Buffer ได้ ปัญหาจึงโผล่แค่บนเว็บจริง

## แผนการแก้

1. เพิ่ม `src/lib/promptpay.ts` — สร้าง payload PromptPay (มาตรฐาน EMVCo) และ CRC16-CCITT ด้วย TypeScript ล้วน ไม่พึ่ง `Buffer` หรือแพ็กเกจภายนอก รองรับเบอร์มือถือ / เลขนิติบุคคล / e-Wallet ID และจำนวนเงินทศนิยม 2 ตำแหน่ง เหมือนที่ใช้อยู่
2. แก้ `src/components/promptpay-modal.tsx` ให้เรียกฟังก์ชันใหม่แทน `promptpay-qr` (`qrcode.react` ใช้ต่อได้ปกติ ไม่เกี่ยวกับ Buffer)
3. ค้นหาไฟล์อื่นที่ยัง import `promptpay-qr` แล้วเปลี่ยนให้ใช้ตัวใหม่ทั้งหมด และถอดแพ็กเกจ `promptpay-qr` ออกจาก dependencies
4. ตรวจว่า QR ที่ได้เหมือนเดิม โดยเทียบสตริง payload ของเลข PromptPay + ยอดเงินตัวอย่างกับผลลัพธ์เดิม (unit test เล็ก ๆ ใน vitest ที่มีอยู่แล้ว) แล้ว typecheck
5. เช็คว่ามีแพ็กเกจอื่นในบันเดิลฝั่ง client ที่พึ่ง `Buffer` ซ่อนอยู่อีกไหม (grep บันเดิลหลังบิลด์) เพื่อกันปัญหาเดียวกันในหน้าอื่น เช่น checkout

## ต้อง Publish

แก้เสร็จต้องกด Publish หน้าคำสั่งซื้อบน shop.entgroup.co.th จึงจะหายครับ

## นอกขอบเขต (แจ้งไว้)

console ยังเตือน `<a>` ซ้อน `<a>` ใน `home-sections.tsx` (ส่วน Corporate) — คนละเรื่อง ถ้าต้องการให้แก้พร้อมกันบอกได้ครับ
