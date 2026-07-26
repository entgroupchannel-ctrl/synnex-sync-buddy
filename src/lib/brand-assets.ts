import ACER from "@/assets/brands/ACER.png.asset.json";
import APPLE from "@/assets/brands/APPLE-BLACK.png.asset.json";
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
// โลโก้แบรนด์เพิ่มเติม (เวกเตอร์ต้นฉบับจาก Simple Icons → เรนเดอร์เป็น PNG โปร่งใส สีจริงของแบรนด์)
import CISCO from "@/assets/brands/CISCO.png.asset.json";
import CORSAIR from "@/assets/brands/CORSAIR.png.asset.json";
import HUAWEI from "@/assets/brands/HUAWEI.png.asset.json";
import SAMSUNG from "@/assets/brands/SAMSUNG.png.asset.json";
import SEAGATE from "@/assets/brands/SEAGATE.png.asset.json";
import LG from "@/assets/brands/LG.png.asset.json";
import DELL from "@/assets/brands/DELL.png.asset.json";
import MSI from "@/assets/brands/MSI.png.asset.json";
import NETGEAR from "@/assets/brands/NETGEAR.png.asset.json";
import INTEL from "@/assets/brands/INTEL.png.asset.json";
import AMD from "@/assets/brands/AMD.png.asset.json";
import NVIDIA from "@/assets/brands/NVIDIA.png.asset.json";
import EPSON from "@/assets/brands/EPSON.png.asset.json";
import XIAOMI from "@/assets/brands/XIAOMI.png.asset.json";
import UBIQUITI from "@/assets/brands/UBIQUITI.png.asset.json";

import VIEWSONIC from "@/assets/brands/VIEWSONIC.png.asset.json";
import ASROCK from "@/assets/brands/ASROCK.png.asset.json";
import BROTHER from "@/assets/brands/BROTHER.png.asset.json";
import JBL from "@/assets/brands/JBL.png.asset.json";
import KASPERSKY from "@/assets/brands/KASPERSKY.png.asset.json";
import TOSHIBA from "@/assets/brands/TOSHIBA.png.asset.json";
import SYNOLOGY from "@/assets/brands/SYNOLOGY.png.asset.json";
import QNAP from "@/assets/brands/QNAP.png.asset.json";
import HYPERX from "@/assets/brands/HYPERX.png.asset.json";
import COOLERMASTER from "@/assets/brands/COOLERMASTER.png.asset.json";
import DEEPCOOL from "@/assets/brands/DEEPCOOL.png.asset.json";
import NZXT from "@/assets/brands/NZXT.png.asset.json";
import FUJITSU from "@/assets/brands/FUJITSU.png.asset.json";
import SHARP from "@/assets/brands/SHARP.png.asset.json";
import PANASONIC from "@/assets/brands/PANASONIC.png.asset.json";
import SONY from "@/assets/brands/SONY.png.asset.json";
import POLY from "@/assets/brands/POLY.png.asset.json";
import FORTINET from "@/assets/brands/FORTINET.png.asset.json";
import STEELSERIES from "@/assets/brands/STEELSERIES.png.asset.json";

export const BRAND_LOGO_URLS: Record<string, string> = {
  ACER: ACER.url,
  APPLE: APPLE.url,
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
  CISCO: CISCO.url,
  CORSAIR: CORSAIR.url,
  HUAWEI: HUAWEI.url,
  SAMSUNG: SAMSUNG.url,
  SEAGATE: SEAGATE.url,
  LG: LG.url,
  DELL: DELL.url,
  MSI: MSI.url,
  "MSI GAMING": MSI.url,
  NETGEAR: NETGEAR.url,
  INTEL: INTEL.url,
  AMD: AMD.url,
  NVIDIA: NVIDIA.url,
  EPSON: EPSON.url,
  XIAOMI: XIAOMI.url,
  "MI / XIAOMI": XIAOMI.url,
  UBIQUITI: UBIQUITI.url,
  UBNT: UBIQUITI.url,
  VIEWSONIC: VIEWSONIC.url,
  ASROCK: ASROCK.url,
  BROTHER: BROTHER.url,
  JBL: JBL.url,
  KASPERSKY: KASPERSKY.url,
  TOSHIBA: TOSHIBA.url,
  SYNOLOGY: SYNOLOGY.url,
  QNAP: QNAP.url,
  HYPERX: HYPERX.url,
  COOLERMASTER: COOLERMASTER.url,
  DEEPCOOL: DEEPCOOL.url,
  NZXT: NZXT.url,
  FUJITSU: FUJITSU.url,
  SHARP: SHARP.url,
  PANASONIC: PANASONIC.url,
  SONY: SONY.url,
  POLY: POLY.url,
  FORTINET: FORTINET.url,
  STEELSERIES: STEELSERIES.url,
  "COOLER MASTER": COOLERMASTER.url,
  "VIEW SONIC": VIEWSONIC.url,
  "AS ROCK": ASROCK.url,
  "HYPER X": HYPERX.url,
  "POLY / PLANTRONICS": POLY.url,
};


export function getBrandLogoUrl(brand: string | null | undefined): string | null {
  if (!brand) return null;
  return BRAND_LOGO_URLS[brand.trim().toUpperCase()] ?? null;
}
