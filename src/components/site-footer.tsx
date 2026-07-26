import { useEffect, useState } from "react";
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
  CheckCircle2,
  Loader2,
  Lock,
  CreditCard,

  KeyRound,
  Server,
  EyeOff,
  UserCheck,
  Cookie,
  Trash2,
  Clock,
  FileCheck2,
} from "lucide-react";
import { toast } from "sonner";
import entLogo from "@/assets/entgroup-logo.jpg.asset.json";
import {
  PAYMENT_BADGES,
  CARRIER_BADGES,
  type FooterBadge,
} from "@/lib/footer-badges";

/* -------------------------------------------------------------- */
/* Small helpers                                                  */
/* -------------------------------------------------------------- */

function BrandBadge({ badge }: { badge: FooterBadge }) {
  const [broken, setBroken] = useState(false);
  const showLogo = Boolean(badge.logoUrl) && !broken;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium ${
        badge.comingSoon ? "opacity-50 grayscale" : ""
      }`}
      style={{
        borderColor: "rgba(255,255,255,0.3)",
        color: "rgba(255,255,255,0.8)",
      }}
    >
      {showLogo ? (
        <img
          src={badge.logoUrl}
          alt={badge.label}
          loading="lazy"
          onError={() => setBroken(true)}
          className="h-5 w-auto max-w-[54px] object-contain"
        />
      ) : (
        <>
          <badge.icon className="h-3.5 w-3.5 shrink-0 text-[color:var(--brand-green)]" />
          <span className="whitespace-nowrap">{badge.label}</span>
        </>
      )}
      {badge.comingSoon && (
        <span className="rounded bg-white/15 px-1 py-0.5 text-[9px] leading-none text-white/70">
          เร็วๆ นี้
        </span>
      )}
    </span>
  );
}

function BadgeRow({ badges }: { badges: FooterBadge[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <BrandBadge key={b.label} badge={b} />
      ))}
    </div>
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
      title: "ชำระเงินปลอดภัย",
      desc: "เข้ารหัส HTTPS · ไม่เก็บข้อมูลบัตรบนเซิร์ฟเวอร์",

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
  const [done, setDone] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { count } = await supabase
          .from("newsletter_subscribers")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);
        if (alive) setCount(count ?? null);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.toLowerCase().trim();
    if (!value || !value.includes("@")) {
      toast.error("กรุณากรอกอีเมลที่ถูกต้อง");
      return;
    }
    setLoading(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.from("newsletter_subscribers").upsert(
        {
          email: value,
          subscribed_at: new Date().toISOString(),
          source: "footer",
          is_active: true,
        },
        { onConflict: "email" },
      );
      if (error) throw error;

      await supabase.functions.invoke("send-newsletter-welcome", {
        body: { email: value },
      });

      toast.success("สมัครรับข่าวสารสำเร็จ! ตรวจสอบอีเมลของคุณ");
      setEmail("");
      setDone(true);
      setCount((c) => (c === null ? c : c + 1));
      setTimeout(() => setDone(false), 5000);
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
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
              Get exclusive IT deals &amp; news
              {count !== null ? ` · สมัครแล้ว ${count.toLocaleString()} คน` : ""}{" "}
              · ไม่มีสแปม ยกเลิกได้ทุกเมื่อ
            </div>
          </div>
        </div>
        {done ? (
          <div className="flex w-full max-w-md items-center gap-2 rounded-md border border-[color:var(--brand-green)]/40 bg-[color:var(--brand-green)]/10 px-3 py-2.5 text-sm font-semibold text-[color:var(--brand-green)]">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            สมัครแล้ว! ตรวจสอบอีเมลของคุณ
          </div>
        ) : (
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
              className="flex h-10 shrink-0 items-center gap-2 rounded-md bg-[color:var(--brand-green)] px-4 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "กำลังสมัคร..." : "สมัครรับข่าวสาร"}
            </button>
          </form>
        )}
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
  const foundingBeYear = 2558;


  return (
    <footer className="mt-10">
      <TrustBar />
      <NewsletterStrip />

      <div className="bg-[color:var(--brand-navy)] text-white/80">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-6">
          {/* Column 1 — Help Center */}
          <Column title="ศูนย์ช่วยเหลือ">
            <ul className="space-y-2">
              <li><FooterLink to="/how-to-order">วิธีสั่งซื้อสินค้า</FooterLink></li>
              <li><FooterLink to="/payment-methods">วิธีชำระเงิน</FooterLink></li>
              <li><FooterLink to="/credit-application">สมัครวงเงินเครดิต B2B</FooterLink></li>
              <li><FooterLink to="/shipping-info">การจัดส่งสินค้า</FooterLink></li>
              <li><FooterLink to="/returns">การคืนเงินและคืนสินค้า</FooterLink></li>
              <li><FooterLink to="/contact">ติดต่อ ENT Group</FooterLink></li>
              <li><FooterLink to="/privacy">นโยบายความเป็นส่วนตัว</FooterLink></li>
              <li><FooterLink to="/terms">เงื่อนไขการใช้งาน</FooterLink></li>
            </ul>
          </Column>

          {/* Column 2 — Categories */}
          <Column title="หมวดหมู่สินค้า">
            <ul className="space-y-2">
              <li><FooterLink to="/?category=Smart+Life">🏠 Smart Life</FooterLink></li>
              <li><FooterLink to="/?category=Speaker+%26+Audio">🔊 Speaker & Audio</FooterLink></li>
              <li><FooterLink to="/?category=Notebook">Notebook</FooterLink></li>
              <li><FooterLink to="/?category=Computer+Set">คอมพิวเตอร์ชุด</FooterLink></li>
              <li><FooterLink to="/?category=Components">ชิ้นส่วน / CPU</FooterLink></li>
              <li><FooterLink to="/?category=Solar+%26+Energy">โซลาร์และพลังงาน</FooterLink></li>
              <li><FooterLink to="/?category=Software">Software</FooterLink></li>
              <li><FooterLink to="/pc-builder">🔧 Config PC</FooterLink></li>
            </ul>
          </Column>

          {/* Column 3 — About */}
          <Column title="เกี่ยวกับ ENT Group">
            <ul className="space-y-2">
              <li><FooterLink href="https://entgroup.co.th/about">เกี่ยวกับเรา</FooterLink></li>
              <li><FooterLink href="https://entgroup.co.th">ผลิตภัณฑ์ ENT Group</FooterLink></li>
              <li><FooterLink to="/credit-application">💳 วงเงินเครดิต B2B</FooterLink></li>
              <li><FooterLink to="/?category=Network">🏢 Corporate Solutions</FooterLink></li>
              <li><FooterLink to="/contact">ติดต่อเรา</FooterLink></li>
              <li><FooterLink to="/careers">ร่วมงานกับเรา</FooterLink></li>
              <li><FooterLink href="https://entgroup.co.th/blog">ENT Group Blog</FooterLink></li>
            </ul>
          </Column>

          {/* Column 4 — Payment */}
          <Column title="วิธีการชำระเงิน / Payment">
            <BadgeRow badges={PAYMENT_BADGES} />
            <p className="mt-3 text-[11px] text-white/50">
              ปัจจุบันรองรับ PromptPay QR และโอนผ่านธนาคาร ·{" "}
              <Link
                to="/payment-methods"
                className="underline hover:text-[color:var(--brand-green)]"
              >
                ดูรายละเอียด
              </Link>
            </p>
          </Column>

          {/* Column 5 — Shipping */}
          <Column title="บริการจัดส่ง / Delivery">
            <BadgeRow badges={CARRIER_BADGES} />

            <p className="mt-3 text-[11px] text-white/60">
              จัดส่งทั่วประเทศไทย ครอบคลุมทุกพื้นที่
            </p>
          </Column>

          {/* Column 6 — Follow + Contact */}
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
                <a href="mailto:sales@entgroup.co.th" className="hover:text-[color:var(--brand-green)]">sales@entgroup.co.th</a>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--brand-green)]" />
                <div className="leading-relaxed text-white/60">
                  เลขที่ 70/5 หมู่ 4 เมทโทร บิซทาวน์ แจ้งวัฒนะ 2<br />
                  ถ.หอการค้าไทย ตำบลคลองพระอุดม<br />
                  อำเภอปากเกร็ด จังหวัดนนทบุรี 11120
                </div>
              </div>

              <div className="pt-1 text-[11px] text-white/50">
                เลขประจำตัวผู้เสียภาษี: 0135558013167
              </div>
            </div>
          </Column>
        </div>

        {/* PDPA + Security */}
        <div className="border-t border-white/10">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:grid-cols-2">
            {/* PDPA */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[color:var(--brand-green)]" />
                <span className="text-sm font-bold uppercase tracking-wide text-white">
                  ข้อมูลส่วนบุคคล (PDPA)
                </span>
              </div>
              <p className="mb-3 text-[11px] leading-relaxed text-white/60">
                เราปฏิบัติตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
                โดยเก็บข้อมูลเท่าที่จำเป็นต่อการซื้อขายเท่านั้น
              </p>
              <div className="space-y-2">
                {[
                  { icon: UserCheck, text: "เก็บอะไร: ชื่อ ที่อยู่จัดส่ง เบอร์โทร อีเมล และข้อมูลนิติบุคคลสำหรับออกใบกำกับภาษี" },
                  { icon: FileCheck2, text: "ใช้ทำอะไร: จัดส่งสินค้า ยืนยันคำสั่งซื้อ ออกใบกำกับภาษี และบริการหลังการขาย" },
                  { icon: EyeOff, text: "ส่งต่อให้ใคร: เฉพาะบริษัทขนส่งเพื่อนำจ่ายพัสดุ — ไม่ขายหรือให้เช่าข้อมูลแก่บุคคลที่สาม" },
                  { icon: Cookie, text: "คุกกี้: ใช้เพื่อจดจำตะกร้าสินค้าและการเข้าสู่ระบบ ไม่ใช้เพื่อโฆษณาติดตามข้ามเว็บ" },
                  { icon: Clock, text: "เก็บนานแค่ไหน: ข้อมูลคำสั่งซื้อเก็บตามที่กฎหมายบัญชี/ภาษีกำหนด แล้วลบหรือทำให้ไม่ระบุตัวตน" },
                  { icon: Trash2, text: "สิทธิของคุณ: ขอเข้าถึง แก้ไข คัดค้าน หรือลบข้อมูลได้ที่ sales@entgroup.co.th" },
                ].map((it) => (
                  <div key={it.text} className="flex items-start gap-2">
                    <it.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--brand-green)]" />
                    <span className="text-[11px] leading-relaxed text-white/70">
                      {it.text}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                to="/privacy"
                className="mt-3 inline-block text-[11px] font-semibold text-[color:var(--brand-green)] hover:underline"
              >
                อ่านนโยบายความเป็นส่วนตัวฉบับเต็ม →
              </Link>
            </div>

            {/* Security */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Lock className="h-4 w-4 text-[color:var(--brand-green)]" />
                <span className="text-sm font-bold uppercase tracking-wide text-white">
                  ระบบรักษาความปลอดภัยของเรา
                </span>
              </div>
              <div className="space-y-2.5">
                {[
                  { icon: Lock, title: "เข้ารหัส HTTPS/TLS ทุกหน้า", desc: "ข้อมูลระหว่างเบราว์เซอร์กับเซิร์ฟเวอร์ถูกเข้ารหัสตลอดเส้นทาง" },
                  { icon: CreditCard, title: "ไม่เก็บเลขบัตรบนเซิร์ฟเวอร์ของเรา", desc: "ชำระผ่าน PromptPay QR / โอนธนาคาร เราไม่เก็บข้อมูลบัตรใดๆ" },
                  { icon: Server, title: "ฐานข้อมูลเข้ารหัสขณะจัดเก็บ", desc: "พร้อมสำรองข้อมูลอัตโนมัติทุกวัน" },
                  { icon: KeyRound, title: "รหัสผ่านถูก hash ไม่เก็บเป็นข้อความธรรมดา", desc: "รองรับการรีเซ็ตรหัสผ่านผ่านอีเมลที่ยืนยันแล้ว" },
                  { icon: EyeOff, title: "แยกสิทธิ์การเข้าถึงรายคำสั่งซื้อ", desc: "บัญชีหนึ่งเห็นได้เฉพาะคำสั่งซื้อของตนเองเท่านั้น" },
                  { icon: FileCheck2, title: "ล็อกยอดเงินคำสั่งซื้อไม่ให้แก้ย้อนหลัง", desc: "การเปลี่ยนสถานะชำระเงินต้องผ่านระบบตรวจสอบฝั่งเซิร์ฟเวอร์เท่านั้น" },
                ].map((it) => (
                  <div key={it.title} className="flex items-start gap-2">
                    <it.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--brand-green)]" />
                    <div>
                      <div className="text-[11px] font-semibold text-white">
                        {it.title}
                      </div>
                      <div className="text-[11px] leading-relaxed text-white/55">
                        {it.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Brand strip */}

        <div className="mx-auto max-w-7xl border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <img
              src={entLogo.url}
              alt="ENT Group IT Shop"
              className="h-10 w-10 rounded-lg object-contain bg-white p-0.5"
            />
            <div>
              <div className="text-sm font-medium text-white">
                IT Shop
              </div>
              <div className="text-xs text-green-300">
                Computer for all
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Network sites */}
      <div className="border-t border-white/10 bg-[#0a1628]">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-xs font-semibold text-white mr-2">เว็บไซต์ในเครือ:</span>
          {[
            { label: "VIMOSA", href: "https://www.vimosa.co.th/" },
            { label: "VICHAKAN", href: "https://www.vichakarn.co/" },
            { label: "CRM", href: "https://crm.entgroup.co.th" },
            { label: "Order", href: "https://order.entgroup.co.th" },
            { label: "Diary", href: "https://diary.entgroup.co.th" },
            { label: "Price Management", href: "https://price.entgroup.co.th" },
            { label: "Predictive", href: "https://predictive.entgroup.co.th/" },
          ].map((site, i, arr) => (
            <span key={site.label} className="inline-flex items-center gap-1">
              <a
                href={site.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-300 hover:text-green-300 transition-colors"
              >
                {site.label}
              </a>
              {i < arr.length - 1 && <span className="text-slate-600 mx-1">|</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-[#0a1628] border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-slate-400">
          © {foundingBeYear}–{beYear} บริษัท อีเอ็นที กรุ๊ป จำกัด · เลขประจำตัวผู้เสียภาษี: 0135558013167
        </div>
      </div>

    </footer>
  );
}

export default SiteFooter;
