// Central helpers around Supabase auth session state.
//
// Why this file exists: several places in the app read the current user/session
// (useSupabaseUser, cart.ts, checkout.tsx, auth-attacher.ts) and, if the cached
// session in localStorage has gone stale (refresh token revoked/expired, clock
// skew, etc.), each call site used to just get an error back and move on —
// but the Supabase client kept the dead access token around and kept attaching
// it as `Authorization: Bearer <dead token>` to *every subsequent request*,
// including guest-eligible ones like inserting an order. PostgREST rejects an
// invalid JWT with 401 before RLS is even evaluated, so a stale session could
// block checkout entirely even though "anyone can insert orders" should apply.
//
// The helpers below centralize "is this session actually usable?" and clear
// the local session (without hitting the network sign-out endpoint) the moment
// we detect it isn't, so later calls in the same page load stop sending it.
import { supabase } from "@/integrations/supabase/client";

type AuthErrorLike = { status?: number; message?: string; code?: string } | null | undefined;

let signingOut = false;

/** Local-only sign-out (clears storage, does not require network) — de-duped so
 * concurrent callers that all discover the same dead session don't race. */
async function clearStaleSessionOnce(): Promise<void> {
  if (signingOut) return;
  signingOut = true;
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Best-effort. Worst case the stale token stays around and the next call
    // surfaces the same error again — no worse than before this helper existed.
  } finally {
    signingOut = false;
  }
}

function isDeadTokenError(error: AuthErrorLike): boolean {
  if (!error) return false;
  if (error.status === 401 || error.status === 403) return true;
  const msg = `${error.message ?? ""} ${error.code ?? ""}`.toLowerCase();
  return (
    msg.includes("refresh_token_not_found") ||
    msg.includes("invalid refresh token") ||
    msg.includes("invalid jwt") ||
    msg.includes("jwt expired") ||
    msg.includes("session_not_found") ||
    msg.includes("session_expired")
  );
}

/**
 * เหมือน `supabase.auth.getUser()` แต่ถ้า token ที่แคชไว้ใช้ไม่ได้แล้ว
 * จะเคลียร์ session ทิ้งจาก localStorage ให้อัตโนมัติ แล้วคืน `null`
 * (แทนที่จะปล่อยให้ client แนบ JWT ที่ตายแล้วไปกับ request ถัดๆ ไปเรื่อยๆ)
 */
export async function getUserSafe() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    if (isDeadTokenError(error)) await clearStaleSessionOnce();
    return null;
  }
  return data.user;
}

/**
 * คืน access token เฉพาะตอนที่ session ยังใช้ได้จริงเท่านั้น
 * ถ้าใช้ไม่ได้แล้ว (หมดอายุ/ refresh ล้ม) จะเคลียร์ session ทิ้งและคืน `null`
 * ให้ผู้เรียกไม่แนบ Authorization header แล้ว fallback เป็น anon/guest ตามปกติ
 * แทนที่จะแนบ token ตายแล้วแล้วโดน 401
 */
export async function getFreshAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    if (isDeadTokenError(error)) await clearStaleSessionOnce();
    return null;
  }
  const session = data.session;
  if (!session) return null;

  const expiresAtMs = (session.expires_at ?? 0) * 1000;
  if (expiresAtMs && expiresAtMs <= Date.now()) {
    // หมดอายุแล้วตามเวลา แต่ auto-refresh ยังไม่ทันอัปเดต local session —
    // ยืนยันจริงด้วย getUser() ซึ่งยิง network ตรวจสอบ/พยายาม refresh
    const user = await getUserSafe();
    if (!user) return null;
    const { data: refreshed } = await supabase.auth.getSession();
    return refreshed.session?.access_token ?? null;
  }

  return session.access_token;
}
