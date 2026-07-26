import { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * ช่องรหัสผ่านพร้อมปุ่มดูรหัสผ่าน (Eye/EyeOff)
 * ใส่ autoComplete ที่ถูกต้องเสมอ (current-password / new-password) เพื่อให้
 * เบราว์เซอร์เสนอ "จำรหัสผ่าน" ให้อัตโนมัติ — วิธีที่ปลอดภัยที่สุดในการ "จำรหัสผ่าน"
 * คือให้ browser password manager จัดการ ไม่ใช่เก็บรหัสผ่านไว้เองฝั่ง client
 */
export const PasswordInput = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(({ className, autoComplete, ...props }, ref) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        ref={ref}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete ?? "current-password"}
        className={cn("pr-10", className)}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";
