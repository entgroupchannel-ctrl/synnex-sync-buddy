/**
 * src/components/work-footer.tsx  (ไฟล์ใหม่)
 * Footer แบบเรียบง่ายสำหรับหน้า "งาน" (admin + my-account/my-orders)
 * ไม่มี newsletter, ไม่มี link หมวดหมู่สินค้าแบบ SiteFooter ฝั่งร้านค้า
 */
import { Link } from "@tanstack/react-router";

export function WorkFooter() {
  const year = new Date().getFullYear() + 543; // พ.ศ.
  return (
    <footer className="border-t bg-white px-4 py-4 text-xs text-slate-500">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <span>© {year} บริษัท อี เอ็น ที กรุ๊ป จำกัด (ENT Group) · สงวนลิขสิทธิ์</span>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/contact" className="hover:text-[color:var(--brand-navy)] hover:underline">
            ติดต่อเรา
          </Link>
          <Link to="/privacy" className="hover:text-[color:var(--brand-navy)] hover:underline">
            นโยบายความเป็นส่วนตัว
          </Link>
          <Link to="/terms" className="hover:text-[color:var(--brand-navy)] hover:underline">
            เงื่อนไขการใช้งาน
          </Link>
        </div>
      </div>
    </footer>
  );
}
