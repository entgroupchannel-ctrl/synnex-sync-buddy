const MESSAGES = [
  "🔥 สินค้าใหม่ iPhone 17 Pro Max มาแล้ว!",
  "⚡ ลดราคา Computer Set RTX5090 วันนี้เท่านั้น",
  "🏆 Smart Life Sale ลดสูงสุด 20%",
  "💳 สมัครวงเงินเครดิต B2B ได้แล้ววันนี้",
  "🚚 ส่งฟรีเมื่อซื้อครบ ฿5,000 กทม./ปริมณฑล",
  "✅ ลิขสิทธิ์แท้ Microsoft Office 2024 พร้อมส่ง",
];

export function ScrollingTicker() {
  const items = [...MESSAGES, ...MESSAGES];
  return (
    <div className="overflow-hidden border-y border-slate-200 bg-gradient-to-r from-yellow-50 via-white to-yellow-50">
      <div className="animate-marquee flex whitespace-nowrap py-1.5 text-xs font-medium text-slate-700">
        {items.map((text, i) => (
          <span key={i} className="mx-6 shrink-0">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
