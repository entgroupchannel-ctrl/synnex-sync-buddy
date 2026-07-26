-- A3/A4: ถอด min_tier_price ออกจาก client + REVOKE SELECT คอลัมน์ต้นทุน
--
-- min_tier_price = round(cost_price * 1.02) ถูก select ไปทุกหน้าเว็บ (แม้ guest ที่ไม่ล็อกอิน)
-- ทำให้ย้อนกลับหาราคาทุนที่ ENT ซื้อจริงได้เกือบเป๊ะสำหรับสินค้าทุกชิ้น
--
-- แก้โดย:
--   1) เพิ่มคอลัมน์ราคาสำเร็จรูปต่อ tier (คำนวณ+clamp กับพื้นทุนไว้แล้วฝั่ง DB โดยตรง
--      ไม่ต้องส่ง floor/ทุนดิบออกไปให้ client คำนวณเองอีกต่อไป) สูตรต้องตรงกับ
--      src/lib/cart.ts::getSellingPrice เป๊ะ
--   2) REVOKE SELECT ตารางทั้งหมดจาก anon/authenticated แล้ว GRANT SELECT เฉพาะคอลัมน์ปลอดภัย
--      (Postgres column-level REVOKE ไม่ override table-level grant ที่มีอยู่ก่อน — ต้อง
--      revoke ระดับตารางก่อนแล้วค่อย grant เฉพาะคอลัมน์ที่ต้องการ)
--   service_role (admin server functions ผ่าน supabaseAdmin) ไม่ถูกกระทบ เพราะ bypass grants ทั้งหมด

alter table public.synnex_products
  add column if not exists tier_price_guest numeric generated always as (
    case when coalesce(selling_price,0) > 0 and selling_price <= 70000
      then round(selling_price)
      else null end
  ) stored,
  add column if not exists tier_price_b2c numeric generated always as (
    case when coalesce(selling_price,0) > 0 and selling_price <= 70000
      then round(greatest(
        (case when coalesce(member_price,0) > 0 then member_price else selling_price * 0.95 end),
        (case when coalesce(cost_price,0) > 0 then round(cost_price * 1.02) else 0 end)
      ))
      else null end
  ) stored,
  add column if not exists tier_price_b2c_silver numeric generated always as (
    case when coalesce(selling_price,0) > 0 and selling_price <= 70000
      then round(greatest(
        (case when coalesce(member_price,0) > 0 then member_price else selling_price * 0.95 end) * 0.97,
        (case when coalesce(cost_price,0) > 0 then round(cost_price * 1.02) else 0 end)
      ))
      else null end
  ) stored,
  add column if not exists tier_price_b2c_gold numeric generated always as (
    case when coalesce(selling_price,0) > 0 and selling_price <= 70000
      then round(greatest(
        (case when coalesce(member_price,0) > 0 then member_price else selling_price * 0.95 end) * 0.94,
        (case when coalesce(cost_price,0) > 0 then round(cost_price * 1.02) else 0 end)
      ))
      else null end
  ) stored,
  add column if not exists tier_price_b2c_vip numeric generated always as (
    case when coalesce(selling_price,0) > 0 and selling_price <= 70000
      then round(greatest(
        (case when coalesce(member_price,0) > 0 then member_price else selling_price * 0.95 end) * 0.92,
        (case when coalesce(cost_price,0) > 0 then round(cost_price * 1.02) else 0 end)
      ))
      else null end
  ) stored,
  add column if not exists tier_price_b2b numeric generated always as (
    case when coalesce(selling_price,0) > 0 and selling_price <= 70000
      then round(greatest(
        coalesce(
          (case when coalesce(b2b_price,0) > 0 then b2b_price else null end),
          (case when coalesce(member_price,0) > 0 then member_price else selling_price * 0.95 end)
        ),
        (case when coalesce(cost_price,0) > 0 then round(cost_price * 1.02) else 0 end)
      ))
      else null end
  ) stored,
  add column if not exists tier_price_b2b_silver numeric generated always as (
    case when coalesce(selling_price,0) > 0 and selling_price <= 70000
      then round(greatest(
        coalesce(
          (case when coalesce(b2b_price,0) > 0 then b2b_price else null end),
          (case when coalesce(member_price,0) > 0 then member_price else selling_price * 0.95 end)
        ) * 0.98,
        (case when coalesce(cost_price,0) > 0 then round(cost_price * 1.02) else 0 end)
      ))
      else null end
  ) stored,
  add column if not exists tier_price_b2b_gold numeric generated always as (
    case when coalesce(selling_price,0) > 0 and selling_price <= 70000
      then round(greatest(
        coalesce(
          (case when coalesce(b2b_price,0) > 0 then b2b_price else null end),
          (case when coalesce(member_price,0) > 0 then member_price else selling_price * 0.95 end)
        ) * 0.95,
        (case when coalesce(cost_price,0) > 0 then round(cost_price * 1.02) else 0 end)
      ))
      else null end
  ) stored;

-- ถอด SELECT ระดับตารางทั้งหมดออกก่อน (ของเดิม anon/authenticated มี SELECT แบบเหมารวมทุกคอลัมน์)
revoke select on public.synnex_products from anon, authenticated;

-- ให้ SELECT เฉพาะคอลัมน์ที่ปลอดภัย — ไม่มีคอลัมน์ต้นทุน/มาร์กอัป/พื้นราคาที่คำนวณจากทุนโดยตรง
grant select (
  id, sku, name, price, stock, image_url, brand, synced_at, created_at, updated_at,
  description, stock_qty, stock_status, product_url, category, distributor, slug,
  brand_name, selling_price, price_approved, b2b_price, member_price, weight_kg,
  fulfillment_type, image_gallery, subcategory, ram_generation,
  tier_price_guest, tier_price_b2c, tier_price_b2c_silver, tier_price_b2c_gold,
  tier_price_b2c_vip, tier_price_b2b, tier_price_b2b_silver, tier_price_b2b_gold
) on public.synnex_products to anon, authenticated;
