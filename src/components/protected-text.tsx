import { useState, type ClipboardEvent, type MouseEvent } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * ป้องกันการ copy รหัสสินค้า/รุ่นแบบตรงๆ ไปค้นหาต่อที่เว็บอื่น
 *
 * ⚠️ นี่คือ "ตัวหน่วง" (deterrent) ไม่ใช่การป้องกันจริงจัง — ข้อความยังอ่านได้ด้วยตา
 * มองผ่าน view-source/inspector หรือจดด้วยมือได้เสมอ
 */
export function ProtectedText({
  text,
  className = "",
  maskByDefault = true,
}: {
  text: string;
  className?: string;
  maskByDefault?: boolean;
}) {
  const [revealed, setRevealed] = useState(!maskByDefault);

  const masked = (() => {
    if (text.length <= 4) return "•".repeat(text.length);
    const head = text.slice(0, Math.ceil(text.length * 0.35));
    const tail = text.slice(-Math.ceil(text.length * 0.15));
    return `${head}${"•".repeat(Math.max(3, text.length - head.length - tail.length))}${tail}`;
  })();

  const blockCopy = (e: ClipboardEvent<HTMLSpanElement>) => {
    e.preventDefault();
  };
  const blockContextMenu = (e: MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`select-none ${className}`}
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
        onCopy={blockCopy}
        onCut={blockCopy}
        onContextMenu={blockContextMenu}
        title="คัดลอกไม่ได้ — สอบถามรหัสเต็มได้ที่แชท/โทรศัพท์"
      >
        {revealed ? text : masked}
      </span>
      {maskByDefault && (
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          aria-label={revealed ? "ซ่อนรหัส" : "แสดงรหัสเต็ม"}
          className="text-slate-400 hover:text-slate-600"
        >
          {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      )}
    </span>
  );
}
