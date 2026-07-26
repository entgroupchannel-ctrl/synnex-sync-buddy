แก้ไข `src/components/product-image.tsx` บรรทัด 125 ให้แสดง placeholder ของหมวด UPS เฉพาะเมื่อไม่มีรูปภาพจริงหรือโหลดรูปไม่สำเร็จเท่านั้น

```text
ก่อนแก้:
  if (category === "UPS") { ...always render placeholder... }

หลังแก้:
  if (category === "UPS" && (error || !src)) { ...render placeholder only when no real image... }
```

ผลลัพธ์: สินค้าหมวด UPS ที่มี `image_url` จริงจะแสดงรูปจริงแทนที่จะถูกบังด้วย placeholder "ภาพแทน" ตลอดเวลา

ขั้นตอน:
1. แก้ไขเงื่อนไขบรรทัด 125 ตาม diff ที่แนบมา
2. รัน type-check และ tests เพื่อยืนยันว่าไม่มี regression
3. ตรวจสอบ preview หน้ารายการสินค้าหมวด UPS ว่ารูปจริงปรากฏ