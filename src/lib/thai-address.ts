import { THAI_GEO } from "./thai-address-data";

export const ALL_PROVINCES = Object.keys(THAI_GEO);

const norm = (s: string) =>
  s.trim().replace(/\s+/g, "").replace(/^(อำเภอ|อ\.|เขต|แขวง)/, "");

export function districtsOf(province: string): string[] {
  return Object.keys(THAI_GEO[province.trim()] ?? {});
}

export function findDistrict(province: string, district: string): string | null {
  const list = districtsOf(province);
  const n = norm(district);
  return list.find((d) => norm(d) === n) ?? null;
}

export function postcodesOf(province: string, district: string): string[] {
  const d = findDistrict(province, district);
  if (!d) return [];
  return THAI_GEO[province.trim()]?.[d] ?? [];
}

/** All (province, district) pairs that use a postcode */
export function lookupPostcode(postcode: string): { province: string; district: string }[] {
  const out: { province: string; district: string }[] = [];
  if (!/^\d{5}$/.test(postcode)) return out;
  for (const [province, ds] of Object.entries(THAI_GEO)) {
    for (const [district, zips] of Object.entries(ds)) {
      if (zips.includes(postcode)) out.push({ province, district });
    }
  }
  return out;
}

export type AddressCheck = {
  ok: boolean;
  errors: { shipping_province?: string; shipping_district?: string; shipping_postcode?: string };
  /** normalized values to store */
  normalized: { province: string; district: string; postcode: string };
};

export function validateThaiAddress(input: {
  province: string;
  district: string;
  postcode: string;
}): AddressCheck {
  const province = input.province.trim();
  const postcode = input.postcode.trim();
  const errors: AddressCheck["errors"] = {};

  if (!THAI_GEO[province]) errors.shipping_province = "เลือกจังหวัดจากรายการ";

  const matched = THAI_GEO[province] ? findDistrict(province, input.district) : null;
  if (THAI_GEO[province] && !matched) errors.shipping_district = "ไม่พบเขต/อำเภอนี้ในจังหวัดที่เลือก";

  if (!/^\d{5}$/.test(postcode)) {
    errors.shipping_postcode = "รหัสไปรษณีย์ 5 หลัก";
  } else if (matched) {
    const zips = postcodesOf(province, matched);
    if (zips.length && !zips.includes(postcode)) {
      errors.shipping_postcode = `รหัสไปรษณีย์ไม่ตรงกับ ${matched} (${zips.join(", ")})`;
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    normalized: { province, district: matched ?? input.district.trim(), postcode },
  };
}
