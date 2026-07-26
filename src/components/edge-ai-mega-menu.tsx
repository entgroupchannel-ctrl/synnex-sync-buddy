import { Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Bot, Box, Cpu, CircuitBoard, Microchip, Server } from "lucide-react";

type Item = { icon: React.ReactNode; title: string; sub: string; jetsonType: string };

const ITEMS: Item[] = [
  { icon: <Box className="h-5 w-5" />, title: "Edge AI Box", sub: "กล่องคอมพิวเตอร์ AI สำเร็จรูป", jetsonType: "edgebox" },
  { icon: <Server className="h-5 w-5" />, title: "Developer System", sub: "ระบบสำหรับนักพัฒนา AI", jetsonType: "devsystem" },
  { icon: <CircuitBoard className="h-5 w-5" />, title: "Carrier Board", sub: "บอร์ดขยายสำหรับโมดูล Jetson", jetsonType: "board" },
  { icon: <Cpu className="h-5 w-5" />, title: "Developer Kits", sub: "ชุดทดลองพัฒนา Edge AI", jetsonType: "devkit" },
  { icon: <Microchip className="h-5 w-5" />, title: "Module", sub: "โมดูล Jetson แบบ standalone", jetsonType: "module" },
  { icon: <Server className="h-5 w-5" />, title: "AI Supercomputer", sub: "เครื่องประมวลผล AI ระดับสูง", jetsonType: "supercomputer" },
];

export function EdgeAiMegaMenu() {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <Link
        to="/"
        search={{ category: "Edge AI Box" } as never}
        className="flex items-center gap-1 whitespace-nowrap px-3 py-2.5 text-sm font-medium text-white/90 transition hover:text-white"
        style={{ color: open ? "#fff" : undefined }}
      >
        <Bot className="h-4 w-4" /> <span>Edge AI Box</span>
      </Link>
      {open && (
        <div
          className="absolute left-0 top-full z-50 w-[560px] rounded-xl bg-white p-5 text-slate-900 shadow-2xl ring-1 ring-slate-200"
          style={{ borderTop: "3px solid #10B981" }}
        >
          <Bot className="mb-3 h-5 w-5 text-[#10B981]" />
          <div className="mb-3 -mt-5 pl-7 text-sm font-bold text-[#1d1d1f]">Edge AI Products</div>
          <div className="grid grid-cols-2 gap-2">
            {ITEMS.map((it) => (
              <Link
                key={it.title}
                to="/"
                search={{ category: "Edge AI Box", jetsonType: it.jetsonType } as never}
                onClick={() => setOpen(false)}
                className="group flex items-start gap-3 rounded-lg p-2 transition hover:bg-[#f5f5f7]"
              >
                <span className="mt-0.5 text-[#10B981]">{it.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-[#1d1d1f] group-hover:text-[#10B981]">{it.title}</div>
                  <div className="text-xs text-slate-500">{it.sub}</div>
                </div>
              </Link>
            ))}
          </div>
          <Link
            to="/"
            search={{ category: "Edge AI Box" } as never}
            onClick={() => setOpen(false)}
            className="mt-4 block rounded-lg bg-[#1d1d1f] px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-black"
          >
            ดู Edge AI ทั้งหมด →
          </Link>
        </div>
      )}
    </div>
  );
}
