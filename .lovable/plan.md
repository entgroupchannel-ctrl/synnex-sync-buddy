# Keep the "บุคคลทั่วไป / องค์กร" dialog open until the user chooses

## Problem

When a guest adds a product to the cart, the dialog asking "คุณเป็นใคร?" (บุคคลทั่วไป vs องค์กร / B2B) flashes and then disappears on its own. The user wants it to stay open until they click something.

Confirmed from the code: the dialog's open state lives in local React state inside a hook (`useAuthSheetListener`) used by `AddToCartSheet`, which is rendered inside `SiteHeader`. Any remount/re-render cycle of that subtree (cart update, header state change, route transition) resets that local state to closed, so the dialog vanishes without the user acting. The exact trigger of the remount is not yet confirmed — step 1 verifies it.

## Plan

1. Reproduce in the browser: add a product to the cart as a guest, and log when the dialog opens/closes to confirm the state is lost by a remount rather than by a click.
2. Move the dialog's open state out of component-local state into a module-level store in `src/lib/auth-sheet.ts` (small subscribe/snapshot store used via `useSyncExternalStore`). A remount then re-reads the still-open state instead of resetting it.
3. Make the dialog explicitly user-dismissed:
   - no auto-close on re-render or navigation,
   - close only when the user picks บุคคลทั่วไป, องค์กร / B2B, "ดูตะกร้าต่อโดยไม่สมัคร", "เข้าสู่ระบบ", or the X / outside click,
   - add a visible close button so there is always a clear manual exit.
4. Keep the existing once-per-session behaviour (`ent_auth_prompted`) so it only appears on the first guest add-to-cart, and keep the current visual design unchanged.
5. Verify again in the browser: dialog stays open indefinitely until a choice is made, and each choice still navigates correctly.

## Technical notes

- Files touched: `src/lib/auth-sheet.ts` (state store), `src/components/add-to-cart-sheet.tsx` (open/close wiring + close button).
- No changes to cart logic, pricing, or auth flows.
