import { afterEach, describe, expect, it, vi } from "vitest";

// Mock the Supabase client module before importing the code under test.
const getUser = vi.fn();
const getSession = vi.fn();
const signOut = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: (...args: unknown[]) => getUser(...args),
      getSession: (...args: unknown[]) => getSession(...args),
      signOut: (...args: unknown[]) => signOut(...args),
    },
  },
}));

const { getUserSafe, getFreshAccessToken } = await import("../auth-session");

describe("getUserSafe", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("คืน user ปกติเมื่อ token ยังใช้ได้ ไม่เรียก signOut", async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: "u1", email: "a@b.com" } }, error: null });
    const user = await getUserSafe();
    expect(user).toEqual({ id: "u1", email: "a@b.com" });
    expect(signOut).not.toHaveBeenCalled();
  });

  it("token ตายแล้ว (401) → คืน null และเคลียร์ session ทิ้งแบบ local", async () => {
    getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { status: 401, message: "invalid JWT" },
    });
    const user = await getUserSafe();
    expect(user).toBeNull();
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("refresh token ถูก revoke → คืน null และเคลียร์ session ทิ้ง", async () => {
    getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { status: 400, message: "refresh_token_not_found" },
    });
    const user = await getUserSafe();
    expect(user).toBeNull();
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});

describe("getFreshAccessToken", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("session ยังไม่หมดอายุ → คืน access token ตรงๆ ไม่ยิง getUser เพิ่ม", async () => {
    getSession.mockResolvedValueOnce({
      data: {
        session: { access_token: "tok-live", expires_at: Math.floor(Date.now() / 1000) + 3600 },
      },
      error: null,
    });
    const token = await getFreshAccessToken();
    expect(token).toBe("tok-live");
    expect(getUser).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("ไม่มี session เลย (guest) → คืน null โดยไม่ error / ไม่ signOut ซ้ำ", async () => {
    getSession.mockResolvedValueOnce({ data: { session: null }, error: null });
    const token = await getFreshAccessToken();
    expect(token).toBeNull();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("session หมดอายุตามเวลา และ refresh ไม่สำเร็จ (getUser ล้ม) → คืน null และเคลียร์ session (ไม่ใช่ 401 ไปกับ request ถัดไป)", async () => {
    getSession.mockResolvedValueOnce({
      data: {
        session: { access_token: "tok-dead", expires_at: Math.floor(Date.now() / 1000) - 10 },
      },
      error: null,
    });
    getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { status: 401, message: "jwt expired" },
    });

    const token = await getFreshAccessToken();
    expect(token).toBeNull();
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("session หมดอายุตามเวลา แต่ auto-refresh สำเร็จจริง → คืน access token ใหม่", async () => {
    getSession
      .mockResolvedValueOnce({
        data: {
          session: { access_token: "tok-old", expires_at: Math.floor(Date.now() / 1000) - 10 },
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          session: {
            access_token: "tok-refreshed",
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          },
        },
        error: null,
      });
    getUser.mockResolvedValueOnce({ data: { user: { id: "u1", email: null } }, error: null });

    const token = await getFreshAccessToken();
    expect(token).toBe("tok-refreshed");
    expect(signOut).not.toHaveBeenCalled();
  });
});
