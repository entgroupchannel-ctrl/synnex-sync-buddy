// Simple module-level store for the "auth prompt" dialog so it survives
// re-renders/remounts of SiteHeader and stays open until the user acts.
import { useEffect, useState, useSyncExternalStore } from "react";

export type AuthSheetItem = { name: string; sku: string; image_url: string | null };

type SheetState = { open: boolean; item: AuthSheetItem | null };

let state: SheetState = { open: false, item: null };
const listeners = new Set<() => void>();

function setState(next: SheetState) {
  state = next;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const getSnapshot = () => state;
const serverSnapshot: SheetState = { open: false, item: null };
const getServerSnapshot = () => serverSnapshot;

export function triggerAuthPrompt(item: AuthSheetItem) {
  if (typeof window === "undefined") return;
  // Only show once per session
  if (sessionStorage.getItem("ent_auth_prompted") === "1") return;
  setState({ open: true, item });
}

export function markPrompted() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("ent_auth_prompted", "1");
}

export function closeAuthPrompt() {
  markPrompted();
  setState({ open: false, item: null });
}

export function useAuthSheetListener() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { ...snap, close: closeAuthPrompt };
}


// Track current user in header (Supabase session)
export function useSupabaseUser() {
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    Promise.all([import("@/integrations/supabase/client"), import("@/lib/auth-session")]).then(
      ([{ supabase }, { getUserSafe }]) => {
        getUserSafe().then((u) => {
          if (!mounted) return;
          setUser(u ? { id: u.id, email: u.email ?? null } : null);
          setLoading(false);
        });
        const { data: sub } = supabase.auth.onAuthStateChange((evt, session) => {
          if (!mounted) return;
          // SIGNED_OUT (รวมถึง local sign-out ที่ getUserSafe สั่งเมื่อ token ตาย) หรือ
          // TOKEN_REFRESHED ที่ไม่มี session (refresh ล้ม) → ถือว่าไม่มี user แล้ว
          if (evt === "SIGNED_OUT" || (evt === "TOKEN_REFRESHED" && !session)) {
            setUser(null);
            return;
          }
          setUser(
            session?.user ? { id: session.user.id, email: session.user.email ?? null } : null,
          );
        });
        return () => sub.subscription.unsubscribe();
      },
    );
    return () => {
      mounted = false;
    };
  }, []);
  return { user, loading };
}
