import { useState } from "react";

const BRAND_DOMAINS: Record<string, string | null> = {
  ASUS: "asus.com",
  DAHUA: "dahuasecurity.com",
  HIKVISION: "hikvision.com",
  SAMSUNG: "samsung.com",
  CISCO: "cisco.com",
  SANDISK: "sandisk.com",
  LENOVO: "lenovo.com",
  DELL: "dell.com",
  HP: "hp.com",
  ACER: "acer.com",
  HUAWEI: "huawei.com",
  APC: "apc.com",
  ZIRCON: null,
  TKS: null,
};

export function BrandLogo({ brand, className = "" }: { brand: string | null | undefined; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!brand) return null;
  const key = brand.trim().toUpperCase();
  const domain = key in BRAND_DOMAINS ? BRAND_DOMAINS[key] : null;
  const showImg = domain && !failed;
  return (
    <div
      className={`absolute left-2 top-2 z-10 inline-flex items-center rounded-md bg-white px-2 py-1 shadow-[0_1px_3px_rgba(0,0,0,0.1)] ${className}`}
    >
      {showImg ? (
        <img
          src={`https://logo.clearbit.com/${domain}`}
          alt={brand}
          onError={() => setFailed(true)}
          style={{ height: 16, maxWidth: 48, objectFit: "contain" }}
        />
      ) : (
        <span className="text-[10px] font-semibold text-slate-500">{brand}</span>
      )}
    </div>
  );
}
