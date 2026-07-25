import type { ReactNode } from "react";
import {
  Laptop,
  Monitor,
  Printer,
  Server,
  Cpu,
  MemoryStick,
  Bot,
  Package,
  Plug,
  Wifi,
  HardDrive,
  Smartphone,
  Sun,
  Home,
  Computer,
  Camera,
  Watch,
  Wind,
  Zap,
  Shield,
  Volume2,
} from "lucide-react";

// lucide-react has no Apple glyph — use the official-shaped SVG.
export const AppleIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 814 1000" className={className} fill="currentColor" aria-hidden="true">
    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.2 0 663 0 541.8c0-207.1 134.7-316.6 266.8-316.6 70.5 0 129.2 46.5 173.8 46.5 42.8 0 109.7-49.2 187.5-49.2zM649.3 97.2c31.2-38.5 53.3-91.6 53.3-144.7 0-8.3-.6-16.6-2-24.3-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 85.5-55.1 139.3 0 9 1.3 18 2 20.9 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.3-68.3z" />
  </svg>
);

const ic = "h-4 w-4";

export const CATEGORY_ICONS: Record<string, ReactNode> = {
  Notebook: <Laptop className={ic} />,
  Apple: <AppleIcon className={ic} />,
  Monitor: <Monitor className={ic} />,
  Printer: <Printer className={ic} />,
  PC: <Computer className={ic} />,
  UPS: <Zap className={ic} />,
  "Computer Set": <Server className={ic} />,
  Components: <Cpu className={ic} />,
  RAM: <MemoryStick className={ic} />,
  "Edge AI Box": <Bot className={ic} />,
  Software: <Package className={ic} />,
  Accessories: <Plug className={ic} />,
  Network: <Wifi className={ic} />,
  Storage: <HardDrive className={ic} />,
  "Smart Phone & Tablet": <Smartphone className={ic} />,
  "Solar & Energy": <Sun className={ic} />,
  "Smart Life": <Home className={ic} />,
  "Speaker & Audio": <Volume2 className={ic} />,
};

export function getCategoryIcon(name: string): ReactNode {
  return CATEGORY_ICONS[name] ?? <Package className={ic} />;
}

export const SMART_LIFE_SUBCATEGORY_ICONS: Record<string, ReactNode> = {
  "กล้องวงจรปิด (CCTV)": <Camera className={ic} />,
  "Smartwatch & Fitness": <Watch className={ic} />,
  "Smart Home / Xiaomi": <Home className={ic} />,
  "เครื่องฟอกอากาศ": <Wind className={ic} />,
  "Gadget": <Zap className={ic} />,
  "Smart Security": <Shield className={ic} />,
};
