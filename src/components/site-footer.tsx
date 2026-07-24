import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Award,
  ShieldCheck,
  Truck,
  ReceiptText,
  Phone,
  Mail,
  MapPin,
  Printer,
  Facebook,
  Instagram,
  Youtube,
  MessageCircle,
  ChevronDown,
  Globe,
  Mail as MailIcon,
} from "lucide-react";
import { toast } from "sonner";
import entLogo from "@/assets/entgroup-logo.jpg.asset.json";

/* -------------------------------------------------------------- */
/* Small helpers                                                  */
/* -------------------------------------------------------------- */

function LogoBadge({
  src,
  alt,
  label,
  className = "",
}: {
  src: string;
  alt: string;
  label: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      title={alt}
      className={`inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-2 shadow-sm ${className}`}
    >
      {failed ? (
        <span className="text-[11px] font-semibold text-slate-700">{label}</span>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="max-h-6 max-w-full object-contain"
        />
      )}
    </span>
  );
}


function FooterLink({
  to,
  href,
  children,
}: {
  to?: string;
  href?: string;
  children: React.ReactNode;
}) {
  const cls =
    "text-xs text-white/70 transition-colors hover:text-[color:var(--brand-green)]";
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to ?? "/"} className={cls}>
      {children}
    </Link>
  );
}

/* -------------------------------------------------------------- */
/* Trust badges bar                                                */
/* -------------------------------------------------------------- */

function TrustBar() {
  const items = [
    {
      icon: Award,
      title: "สินค้าแท้ 100%",
      desc: "ENT Group IT Shop",
    },
    {
      icon: ShieldCheck,
      title: "ปลอดภัย 100%",
      desc: "ชำระเงินผ่านระบบที่ได้มาตรฐาน",
    },
    {
      icon: Truck,
      title: "จัดส่งทั่วไทย",
      desc: "Kerry, Flash, EMS ครอบคลุมทุกพื้นที่",
    },
    {
      icon: ReceiptText,
      title: "ใบกำกับภาษี",
      desc: "รองรับนิติบุคคล VAT 7%",
    },
  ];
  return (
    <div
      className="bg-[#f8fafc]"
      style={{ borderTop: "3px solid #10b981" }}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4">
        {items.map((it) => (
          <div key={it.title} className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[color:var(--brand-green)]/10 text-[color:var(--brand-green)]">
              <it.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900">
                {it.title}
              </div>
              <div className="text-[11px] leading-tight text-slate-600">
                {it.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- */
/* Newsletter strip                                                */
/* -------------------------------------------------------------- */

function NewsletterStrip() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email });
      if (error && !String(error.message).includes("duplicate")) throw error;
      toast.success("สมัครรับข่าวสารสำเร็จ ขอบคุณค่ะ 💚");
      setEmail("");
    } catch (err: any) {
      toast.error(err?.message ?? "ไม่สามารถสมัครได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0a1628] text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <MailIcon className="mt-1 h-6 w-6 shrink-0 text-[color:var(--brand-green)]" />
          <div>
            <div className="text-base font-bold">
              รับข่าวสารและโปรโมชั่นก่อนใคร
            </div>
            <div className="text-xs text-white/70">
              Get exclusive IT deals & news · สมัครแล้ว 1,247 คน · ไม่มีสแปม
              ยกเลิกได้ทุกเมื่อ
            </div>
          </div>
        </div>
        <form
          onSubmit={submit}
          className="flex w-full max-w-md items-center gap-2"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="กรอกอีเมลของคุณ"
            className="h-10 flex-1 rounded-md border border-white/20 bg-white/5 px-3 text-sm text-white placeholder:text-white/40 focus:border-[color:var(--brand-green)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="h-10 shrink-0 rounded-md bg-[color:var(--brand-green)] px-4 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "..." : "สมัครรับข่าวสาร"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- */
/* Column with mobile accordion                                    */
/* -------------------------------------------------------------- */

function Column({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/10 pb-3 md:border-0 md:pb-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-2 text-left md:cursor-default md:py-0"
      >
        <span className="text-sm font-bold uppercase tracking-wide text-white">
          {title}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-white/60 transition-transform md:hidden ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div className={`${open ? "block" : "hidden"} mt-3 md:mt-4 md:block`}>
        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- */
/* Main footer                                                     */
/* -------------------------------------------------------------- */

export function SiteFooter() {
  const year = new Date().getFullYear();
  const beYear = year + 543;

  return (
    <footer className="mt-10">
      <TrustBar />
      <NewsletterStrip />

      <div className="bg-[color:var(--brand-navy)] text-white/80">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-5">
          {/* Column 1 — Help Center */}
          <Column title="ศูนย์ช่วยเหลือ">
            <ul className="space-y-2">
              <li><FooterLink to="/how-to-order">วิธีสั่งซื้อสินค้า</FooterLink></li>
              <li><FooterLink to="/payment-methods">วิธีชำระเงิน</FooterLink></li>
              <li><FooterLink to="/shipping-info">การจัดส่งสินค้า</FooterLink></li>
              <li><FooterLink to="/returns">การคืนเงินและคืนสินค้า</FooterLink></li>
              <li><FooterLink to="/contact">ติดต่อ ENT Group</FooterLink></li>
              <li><FooterLink to="/privacy">นโยบายความเป็นส่วนตัว</FooterLink></li>
              <li><FooterLink to="/terms">เงื่อนไขการใช้งาน</FooterLink></li>
            </ul>
          </Column>

          {/* Column 2 — About */}
          <Column title="เกี่ยวกับ ENT Group">
            <ul className="space-y-2">
              <li><FooterLink href="https://entgroup.co.th/about">เกี่ยวกับเรา</FooterLink></li>
              <li><FooterLink href="https://entgroup.co.th">ผลิตภัณฑ์ ENT Group</FooterLink></li>
              <li><FooterLink href="/about">เกี่ยวกับเรา</FooterLink></li>
              <li><FooterLink to="/contact">ติดต่อเรา</FooterLink></li>
              <li><FooterLink to="/careers">ร่วมงานกับเรา</FooterLink></li>
              <li><FooterLink href="https://entgroup.co.th/blog">ENT Group Blog</FooterLink></li>
            </ul>
          </Column>

          {/* Column 3 — Payment */}
          <Column title="วิธีการชำระเงิน / Payment">
            <div className="grid grid-cols-3 gap-1.5">
              <LogoBadge
                label="PromptPay"
                alt="PromptPay"
                src="https://upload.wikimedia.org/wikipedia/commons/9/94/Logo_Prompt_Pay.png"
              />
              <LogoBadge
                label="VISA"
                alt="Visa"
                src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg"
              />
              <LogoBadge
                label="Mastercard"
                alt="Mastercard"
                src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
              />
              <LogoBadge
                label="KBank"
                alt="Kasikornbank"
                src="https://upload.wikimedia.org/wikipedia/commons/2/23/Kasikornbank_logo.svg"
              />
              <LogoBadge
                label="SCB"
                alt="Siam Commercial Bank"
                src="https://upload.wikimedia.org/wikipedia/commons/8/8e/Logo_Siam_Commercial_Bank.svg"
              />
              <LogoBadge
                label="โอนเงิน"
                alt="Bank transfer"
                src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3e6.svg"
              />
            </div>
            <p className="mt-3 text-[11px] text-white/50">
              * บัตรเครดิต/เดบิต เร็วๆ นี้
            </p>
          </Column>

          {/* Column 4 — Shipping */}
          <Column title="บริการจัดส่ง / Delivery">
            <div className="grid grid-cols-3 gap-1.5">
              <LogoBadge
                label="Kerry"
                alt="Kerry Express"
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Kerry_Logistics.svg/320px-Kerry_Logistics.svg.png"
              />
              <LogoBadge
                label="Flash"
                alt="Flash Express"
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Flash_Express_logo.svg/320px-Flash_Express_logo.svg.png"
              />
              <LogoBadge
                label="ThaiPost"
                alt="Thailand Post"
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Thailand_Post_Logo.svg/320px-Thailand_Post_Logo.svg.png"
              />
              <LogoBadge
                label="SCG"
                alt="SCG Express"
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/SCG_Logo.svg/320px-SCG_Logo.svg.png"
              />
              <LogoBadge
                label="NIM"
                alt="NIM Express"
                src="https://www.nimexpress.com/web/wp-content/uploads/2020/09/NimExpress-Logo.png"
              />
              <LogoBadge
                label="J&T"
                alt="J&T Express"
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/J%26T_Express_logo.svg/320px-J%26T_Express_logo.svg.png"
              />
            </div>

            <p className="mt-3 text-[11px] text-white/60">
              จัดส่งทั่วประเทศไทย ครอบคลุมทุกพื้นที่
            </p>
          </Column>

          {/* Column 5 — Follow + Contact */}
          <Column title="ติดตามเรา / Follow Us">
            <div className="flex flex-wrap gap-2">
              <a
                href="https://facebook.com/entgroup"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white hover:bg-[color:var(--brand-green)]"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com/entgroup"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white hover:bg-[color:var(--brand-green)]"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <Link
                to="/contact"
                aria-label="LINE"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white hover:bg-[color:var(--brand-green)]"
              >
                <MessageCircle className="h-4 w-4" />
              </Link>
              <a
                href="https://youtube.com/@entgroup"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white hover:bg-[color:var(--brand-green)]"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="font-semibold text-white">สำนักงานใหญ่ & สำนักงานขาย</div>
              <div className="font-semibold text-[color:var(--brand-green)]">บริษัท อีเอ็นที กรุ๊ป จำกัด</div>

              <div className="flex items-start gap-2">
                <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--brand-green)]" />
                <div className="space-y-0.5">
                  <a href="tel:020456104" className="block hover:text-[color:var(--brand-green)]">02-045-6104</a>
                  <a href="tel:0957391053" className="block hover:text-[color:var(--brand-green)]">095-739-1053</a>
                  <a href="tel:0840461315" className="block hover:text-[color:var(--brand-green)]">084-046-1315</a>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Printer className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--brand-green)]" />
                <span className="text-white/70">Fax: 02-045-6105</span>
              </div>

              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--brand-green)]" />
                <a href="mailto:Sales@entgroup.co.th" className="hover:text-[color:var(--brand-green)]">Sales@entgroup.co.th</a>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--brand-green)]" />
                <div className="leading-relaxed text-white/60">
                  70/5 หมู่ 4 เมทโทร บิซทาวน์ แจ้งวัฒนะ 2<br />
                  ตำบลคลองพระอุดม อำเภอปากเกร็ด<br />
                  นนทบุรี 11120
                </div>
              </div>

              <div className="pt-1 text-[11px] text-white/50">
                เลขประจำตัวผู้เสียภาษี: 0135558013167
              </div>
            </div>
          </Column>
        </div>

        {/* Brand strip */}
        <div className="mx-auto max-w-7xl border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <img
              src={entLogo.url}
              alt="ENT Group"
              className="h-10 w-10 rounded-md bg-white object-contain p-1"
            />
            <div>
              <div className="text-sm font-bold text-white">
                ENT Group IT Shop
              </div>
              <div className="text-[11px] text-[color:var(--brand-green)]">
                Computer for all
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-[#0a1628] text-white/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 text-[11px] md:flex-row md:items-center md:justify-between">
          <div>
            © {beYear}–{beYear} บริษัท อี เอ็น ที กรุ๊ป จำกัด · เลขประจำตัวผู้เสียภาษี: 0135558013167
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link to="/privacy" className="hover:text-[color:var(--brand-green)]">นโยบายความเป็นส่วนตัว</Link>
            <Link to="/terms" className="hover:text-[color:var(--brand-green)]">เงื่อนไขการใช้งาน</Link>
            <Link to="/returns" className="hover:text-[color:var(--brand-green)]">นโยบายการคืนสินค้า</Link>
            <Link to="/sitemap" className="hover:text-[color:var(--brand-green)]">แผนผังเว็บไซต์</Link>
          </div>
          <a
            href="https://shop.entgroup.co.th"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-[color:var(--brand-green)]"
          >
            <Globe className="h-3.5 w-3.5" />
            shop.entgroup.co.th
          </a>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
