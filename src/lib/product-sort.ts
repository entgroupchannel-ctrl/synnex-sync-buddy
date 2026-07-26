/**
 * ดันสินค้าที่ไม่มีรูป (image_url ว่าง) ไปไว้ท้ายๆ ของลิสต์เสมอ
 * ใช้กับทุก section ในหน้าแรกที่โชว์สินค้าแบบ curated (จำกัดจำนวน/สุ่ม/เรียงราคา)
 * เป็น stable partition — คงลำดับเดิมของแต่ละกลุ่มไว้ (เช่นเรียงราคาจากถูกไปแพง)
 */
export function imagesFirst<T extends { image_url?: string | null }>(items: T[]): T[] {
  const withImage: T[] = [];
  const withoutImage: T[] = [];
  for (const p of items) {
    (p.image_url ? withImage : withoutImage).push(p);
  }
  return [...withImage, ...withoutImage];
}

/** สุ่มลำดับแบบเดิมที่ใช้ทั่วโปรเจกต์ (Math.random) แยกออกมาเพื่อใช้ร่วมกับ imagesFirstShuffled */
export function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

/**
 * สุ่มลำดับภายในแต่ละกลุ่มแยกกัน (มีรูป / ไม่มีรูป) แล้วเอากลุ่มมีรูปมาก่อนเสมอ
 * ใช้แทน `arr.sort(() => Math.random() - 0.5)` ตรงๆ ในจุดที่เดิมสุ่มทั้งก้อน
 * เพื่อไม่ให้สินค้าไม่มีรูปหลุดมาปนอยู่ต้นๆ ลิสต์จากความสุ่ม
 */
export function imagesFirstShuffled<T extends { image_url?: string | null }>(items: T[]): T[] {
  const withImage: T[] = [];
  const withoutImage: T[] = [];
  for (const p of items) {
    (p.image_url ? withImage : withoutImage).push(p);
  }
  return [...shuffle(withImage), ...shuffle(withoutImage)];
}
