/**
 * คอลัมน์ของ synnex_products ที่อนุญาตให้ส่งออกไปฝั่ง client
 *
 * ⚠️ ห้ามเพิ่ม cost_price, markup_applied, markup_override, b2b_markup_applied
 *    ลงในลิสต์นี้เด็ดขาด — เป็นข้อมูลต้นทุนและอัตรากำไรของบริษัท
 *
 * ห้ามใช้ .select("*") กับตารางนี้ในโค้ดฝั่ง client อีกต่อไป
 * ถ้าต้องการคอลัมน์ใหม่ ให้เพิ่มที่นี่ที่เดียว แล้วทบทวนว่าปลอดภัยจริง
 */
export const PRODUCT_PUBLIC_COLUMNS = [
  "id",
  "sku",
  "slug",
  "name",
  "description",      // SpecTagsCompact ใช้ parse สเปก
  "brand",
  "category",
  "subcategory",      // RAM Desktop / RAM Notebook
  "ram_generation",   // DDR5 / DDR4 / DDR3L / DDR3 / DDR2 (คำนวณจาก DB)
  "image_url",
  "image_gallery",   // แกลเลอรีรูปในหน้ารายละเอียดสินค้า
  "price",
  "selling_price",
  "member_price",     // getSellingPrice + getProductBadge
  "b2b_price",        // getSellingPrice (tier b2b)
  "min_tier_price",   // getSellingPrice (clamp ราคาขั้นต่ำ)
  "price_approved",
  "stock_status",
  "stock_qty",
  "fulfillment_type", // StockBadge
  "distributor",
  "created_at",       // getProductBadge (ป้าย "ใหม่")
].join(", ") as "*"; // cast keeps supabase-js row typing (runtime = explicit column list)
