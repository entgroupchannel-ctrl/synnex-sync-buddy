import ACER from "@/assets/brands/ACER.png.asset.json";
import ASUS from "@/assets/brands/ASUS.png.asset.json";
import CANON from "@/assets/brands/CANON.png.asset.json";
import DAHUA from "@/assets/brands/DAHUA.png.asset.json";
import HIKVISION from "@/assets/brands/HIKVISION.png.asset.json";
import HP from "@/assets/brands/HPI.png.asset.json";
import KINGSTON from "@/assets/brands/KINGSTON.png.asset.json";
import LENOVO from "@/assets/brands/LENOVO.png.asset.json";
import LOGITECH from "@/assets/brands/LOGITECH.png.asset.json";
import RAPOO from "@/assets/brands/RAPOO.png.asset.json";
import RAZER from "@/assets/brands/RAZER.png.asset.json";
import TKS from "@/assets/brands/TKS.png.asset.json";
import TPLINK from "@/assets/brands/TPLINK.png.asset.json";
import WD from "@/assets/brands/WD.png.asset.json";

export const BRAND_LOGO_URLS: Record<string, string> = {
  ACER: ACER.url,
  ASUS: ASUS.url,
  CANON: CANON.url,
  DAHUA: DAHUA.url,
  HIKVISION: HIKVISION.url,
  HP: HP.url,
  HPI: HP.url,
  KINGSTON: KINGSTON.url,
  LENOVO: LENOVO.url,
  LOGITECH: LOGITECH.url,
  RAPOO: RAPOO.url,
  RAZER: RAZER.url,
  TKS: TKS.url,
  "TKS PAPER": TKS.url,
  TPLINK: TPLINK.url,
  "TP-LINK": TPLINK.url,
  WD: WD.url,
  "WESTERN DIGITAL": WD.url,
};

export function getBrandLogoUrl(brand: string | null | undefined): string | null {
  if (!brand) return null;
  return BRAND_LOGO_URLS[brand.trim().toUpperCase()] ?? null;
}
