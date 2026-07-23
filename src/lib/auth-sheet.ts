// Simple event bus to open the "auth prompt" sheet from any Add-to-Cart button.
import { useEffect, useState } from "react";

export type AuthSheetItem = { name: string; sku: string; image_url: string | null };

const EVT_OPEN = "auth-sheet:open";

export function triggerAuthPrompt(item: AuthSheetItem) {
  if (typeof window === "undefined") return;
  // Only show once per session unless user chose "no prompt yet"
  if (sessionStorage.getItem("ent_auth_prompted") === "1") return;
  window.dispatchEvent(new CustomEvent(EVT_OPEN, { detail: item }));
}

export function markPrompted() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("ent_auth_prompted", "1");
}

export function useAuthSheetListener() {
  const [state, setState] = useState<{ open: boolean; item: AuthSheetItem | null }>({ open: false, item: null });
  useEffect(() => {
    const h = (e: Event) => setState({ open: true, item: (e as CustomEvent).detail });
    window.addEventListener(EVT_OPEN, h);
    return () => window.removeEventListener(EVT_OPEN, h);
  }, []);
  return {
    ...state,
    close: () => {
      markPrompted();
      setState({ open: false, item: null });
    },
  };
}

// Track current user in header (Supabase session)
export function useSupabaseUser() {
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.getUser().then(({ data }) => {
        if (!mounted) return;
        setUser(data.user ? { id: data.user.id, email: data.user.email ?? null } : null);
        setLoading(false);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
        setUser(session?.user ? { id: session.user.id, email: session.user.email ?? null } : null);
      });
      return () => sub.subscription.unsubscribe();
    });
    return () => {
      mounted = false;
    };
  }, []);
  return { user, loading };
}
