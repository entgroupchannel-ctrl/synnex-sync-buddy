import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const getSecondsUntilMidnight = () => {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
};

export function FlashSaleCountdown() {
  const [secs, setSecs] = useState(getSecondsUntilMidnight);

  useEffect(() => {
    const id = setInterval(() => setSecs(getSecondsUntilMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;
  const parts = [hours, minutes, seconds];

  return (
    <div className="bg-gradient-to-r from-red-600 via-orange-500 to-red-600 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-4 py-2 text-xs sm:text-sm">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 font-bold animate-pulse">
          🔥 FLASH SALE
        </span>
        <span className="hidden sm:inline">หมดเวลาใน</span>
        <div className="flex items-center gap-1 font-mono font-bold">
          {parts.map((val, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="rounded-md bg-slate-900/80 px-1.5 py-0.5 tabular-nums">
                {String(val).padStart(2, "0")}
              </span>
              {i < 2 && <span>:</span>}
            </span>
          ))}
        </div>
        <span className="hidden md:inline">ลดสูงสุด 20% เฉพาะสมาชิก</span>
        <Link
          to="/auth"
          className="rounded-full bg-white px-3 py-0.5 text-xs font-semibold text-red-600 hover:bg-yellow-100"
        >
          สมัครฟรี →
        </Link>
      </div>
    </div>
  );
}
