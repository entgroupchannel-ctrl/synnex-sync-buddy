import { useSyncExternalStore } from "react";

export type Lang = "th" | "en";

const translations: Record<Lang, Record<string, string>> = {
  th: {
    // Navigation
    "nav.all": "ทั้งหมด",
    "nav.notebook": "Notebook",
    "nav.cart": "ตะกร้าสินค้า",
    "nav.login": "เข้าสู่ระบบ",
    "nav.register": "สมัครสมาชิก",
    "nav.categories": "หมวดหมู่",
    "nav.home": "หน้าแรก",
    "nav.account": "บัญชี",
    "nav.orders": "ประวัติการสั่งซื้อ",
    "nav.profile": "ข้อมูลส่วนตัว",
    "nav.addresses": "ที่อยู่จัดส่ง",
    "nav.signout": "ออกจากระบบ",
    "nav.search": "ค้นหาสินค้า, SKU, ยี่ห้อ...",

    // Homepage
    "hero.badge": "ENT Group — สินค้าแท้ 100% ตั้งแต่ปี 2558",
    "hero.title_line1": "ราคา Dealer จริง",
    "hero.title_line2": "ไม่ผ่านคนกลาง",
    "hero.sub": "Mini PC • Panel PC • IT Products จาก ENT Group IT Shop",
    "hero.cta": "ดูสินค้าทั้งหมด",
    "hero.ready_only": "เฉพาะพร้อมจัดส่ง",

    // Product
    "product.add_cart": "ใส่ตะกร้า",
    "product.buy_now": "ซื้อทันที",
    "product.in_stock": "พร้อมจัดส่ง",
    "product.out_stock": "สินค้าหมด",
    "product.contact": "ติดต่อสอบถาม",
    "product.sku": "รหัสสินค้า",
    "product.brand": "แบรนด์",

    // Cart
    "cart.title": "ตะกร้าสินค้า",
    "cart.continue": "เลือกซื้อต่อ",
    "cart.empty": "ตะกร้าสินค้าว่างเปล่า",
    "cart.empty_en": "Your cart is empty",
    "cart.empty_sub": "ยังไม่มีสินค้าในตะกร้า",
    "cart.empty_sub_en": "No items have been added yet",
    "cart.browse": "เลือกสินค้า",
    "cart.or_categories": "หรือดูหมวดหมู่",
    "cart.recently_viewed": "สินค้าที่คุณดูล่าสุด",
    "cart.summary": "สรุปคำสั่งซื้อ",
    "cart.subtotal": "รวม",
    "cart.shipping": "ค่าจัดส่ง",
    "cart.shipping_calc": "คำนวณตอนชำระเงิน",
    "cart.total": "ยอดรวม",
    "cart.checkout": "ดำเนินการชำระเงิน",

    // Checkout
    "checkout.title": "ชำระเงิน",
    "checkout.contact": "ข้อมูลผู้ติดต่อ",
    "checkout.shipping": "ที่อยู่จัดส่ง",
    "checkout.payment": "วิธีชำระเงิน",
    "checkout.confirm": "ยืนยันคำสั่งซื้อ",
    "checkout.transfer": "โอนเงิน",
    "checkout.cod": "เก็บเงินปลายทาง",

    // Order
    "order.success": "สั่งซื้อสำเร็จ!",
    "order.number": "เลขที่คำสั่งซื้อ",
    "order.status": "สถานะ",
    "order.pending": "รอยืนยัน",
    "order.confirmed": "ยืนยันแล้ว",
    "order.shipped": "จัดส่งแล้ว",
    "order.delivered": "ส่งถึงแล้ว",

    // Auth
    "auth.login": "เข้าสู่ระบบ",
    "auth.register": "สมัครสมาชิก",
    "auth.email": "อีเมล",
    "auth.password": "รหัสผ่าน",
    "auth.name": "ชื่อ-นามสกุล",
    "auth.phone": "เบอร์โทรศัพท์",
    "auth.b2c": "บุคคลทั่วไป",
    "auth.b2b": "องค์กร / B2B",
  },
  en: {
    "nav.all": "All",
    "nav.notebook": "Notebook",
    "nav.cart": "Cart",
    "nav.login": "Sign In",
    "nav.register": "Register",
    "nav.categories": "Categories",
    "nav.home": "Home",
    "nav.account": "Account",
    "nav.orders": "Order History",
    "nav.profile": "Profile",
    "nav.addresses": "Addresses",
    "nav.signout": "Sign Out",
    "nav.search": "Search products, SKU, brand...",

    "hero.badge": "ENT Group — 100% Genuine since 2015",
    "hero.title_line1": "Real Dealer Prices",
    "hero.title_line2": "No Middleman",
    "hero.sub": "Mini PC • Panel PC • IT Products from ENT Group IT Shop",
    "hero.cta": "Browse Products",
    "hero.ready_only": "In stock only",

    "product.add_cart": "Add to Cart",
    "product.buy_now": "Buy Now",
    "product.in_stock": "In Stock",
    "product.out_stock": "Out of Stock",
    "product.contact": "Contact Us",
    "product.sku": "SKU",
    "product.brand": "Brand",

    "cart.title": "Shopping Cart",
    "cart.continue": "Continue Shopping",
    "cart.empty": "Your cart is empty",
    "cart.empty_en": "ตะกร้าสินค้าว่างเปล่า",
    "cart.empty_sub": "No items have been added yet",
    "cart.empty_sub_en": "ยังไม่มีสินค้าในตะกร้า",
    "cart.browse": "Browse Products",
    "cart.or_categories": "Or browse categories",
    "cart.recently_viewed": "Recently viewed",
    "cart.summary": "Order Summary",
    "cart.subtotal": "Subtotal",
    "cart.shipping": "Shipping",
    "cart.shipping_calc": "Calculated at checkout",
    "cart.total": "Total",
    "cart.checkout": "Proceed to Checkout",

    "checkout.title": "Checkout",
    "checkout.contact": "Contact Information",
    "checkout.shipping": "Shipping Address",
    "checkout.payment": "Payment Method",
    "checkout.confirm": "Confirm Order",
    "checkout.transfer": "Bank Transfer",
    "checkout.cod": "Cash on Delivery",

    "order.success": "Order Placed Successfully!",
    "order.number": "Order Number",
    "order.status": "Status",
    "order.pending": "Pending",
    "order.confirmed": "Confirmed",
    "order.shipped": "Shipped",
    "order.delivered": "Delivered",

    "auth.login": "Sign In",
    "auth.register": "Create Account",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.name": "Full Name",
    "auth.phone": "Phone Number",
    "auth.b2c": "Individual",
    "auth.b2b": "Business / B2B",
  },
};

const LS_KEY = "ent_lang";
const EVT = "ent-lang-change";
const listeners = new Set<() => void>();

function getInitial(): Lang {
  if (typeof window === "undefined") return "th";
  const v = window.localStorage.getItem(LS_KEY);
  return v === "en" ? "en" : "th";
}

let current: Lang = getInitial();

function subscribe(cb: () => void) {
  listeners.add(cb);
  const handler = () => cb();
  window.addEventListener(EVT, handler);
  return () => {
    listeners.delete(cb);
    window.removeEventListener(EVT, handler);
  };
}

function getSnapshot(): Lang {
  return current;
}

function getServerSnapshot(): Lang {
  return "th";
}

export function setLanguage(next: Lang) {
  current = next;
  try { window.localStorage.setItem(LS_KEY, next); } catch { /* ignore */ }
  document.documentElement.setAttribute("lang", next);
  window.dispatchEvent(new Event(EVT));
}

export function useLanguage() {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const t = (key: string) => translations[lang][key] ?? key;
  const toggleLang = () => setLanguage(lang === "th" ? "en" : "th");
  return { lang, t, toggleLang, setLang: setLanguage };
}
