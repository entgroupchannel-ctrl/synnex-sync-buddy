export interface SpecItem {
  icon: string;
  label: string;
  value: string;
}

export function parseSpec(description?: string | null): SpecItem[] {
  if (!description) return [];

  const specs: SpecItem[] = [];
  const parts = description
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const part of parts) {
    const p = part.toLowerCase();

    if (p.match(/\d+(\.\d+)?\s*(inch|")/)) {
      specs.push({ icon: "Monitor", label: "จอ", value: part });
    } else if (
      p.includes("intel") ||
      p.includes("amd ryzen") ||
      p.includes("apple m") ||
      p.includes("core ultra") ||
      p.includes("core i") ||
      p.includes("core 5") ||
      p.includes("processor") ||
      p.includes("snapdragon")
    ) {
      specs.push({ icon: "Cpu", label: "CPU", value: part });
    } else if (
      /\d+gb.*(ddr|lpddr|unified|ram)/i.test(p) ||
      /(ddr|lpddr|unified).+\d+gb/i.test(p)
    ) {
      specs.push({ icon: "Zap", label: "RAM", value: part });
    } else if (
      /\d+(gb|tb).*(ssd|nvme|emmc|hdd)/i.test(p) ||
      /(ssd|nvme|emmc|hdd).*\d+(gb|tb)/i.test(p)
    ) {
      specs.push({ icon: "HardDrive", label: "Storage", value: part });
    } else if (
      p.includes("rtx") ||
      p.includes("gtx") ||
      p.includes("radeon rx") ||
      p.includes("arc") ||
      (p.includes("graphics") && !p.includes("integrated"))
    ) {
      specs.push({ icon: "Monitor", label: "GPU", value: part });
    } else if (
      p.includes("windows") ||
      p.includes("win 11") ||
      p.includes("win 10") ||
      p.includes("macos") ||
      p.includes("ubuntu") ||
      p.includes("freedos") ||
      p.includes("w11") ||
      p.includes("w10")
    ) {
      specs.push({ icon: "Package", label: "OS", value: part });
    } else if (p.includes("office") || p.includes("m365")) {
      specs.push({ icon: "FileText", label: "Office", value: part });
    } else if (/usb|hdmi|type-c|displayport|\bdp\b|lan|rj-?45|vga port/i.test(p)) {
      specs.push({ icon: "Package", label: "พอร์ต", value: part });
    }

  }

  return specs.slice(0, 6);
}

export const SPEC_CATEGORIES = ["Notebook", "PC", "Computer Set"];

export function hasSpecTags(category?: string | null) {
  return !!category && SPEC_CATEGORIES.includes(category);
}
