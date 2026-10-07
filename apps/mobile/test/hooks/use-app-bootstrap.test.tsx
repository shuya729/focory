// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { type ReactNode, StrictMode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useAppBootstrap } from "@/hooks/use-app-bootstrap";
import { createDeferred } from "../deferred";

const mocks = vi.hoisted(() => ({
  migration: { success: true, error: undefined as Error | undefined },
  session: vi.fn(),
  signIn: vi.fn(),
}));
vi.mock("@/lib/auth/client", () => ({
  authClient: {
    getSession: mocks.session,
    signIn: { anonymous: mocks.signIn },
  },
}));
vi.mock("drizzle-orm/expo-sqlite/migrator", () => ({
  useMigrations: () => mocks.migration,
}));
vi.mock("@/lib/db/client", () => ({ db: {}, migrations: {} }));
beforeEach(() => {
  vi.resetAllMocks();
  mocks.migration = { success: true, error: undefined };
  mocks.session.mockResolvedValue({ data: null, error: null });
  mocks.signIn.mockResolvedValue({
    data: { user: { id: "user" } },
    error: null,
  });
});
afterEach(cleanup);
it("ProviderなしでフォントとDBを待ち、準備後に一度だけ認証する", async () => {
  const { result, rerender } = renderHook(
    ({ loaded }) => useAppBootstrap(loaded),
    { initialProps: { loaded: false } }
  );
  expect(mocks.session).not.toHaveBeenCalled();
  mocks.migration.success = false;
  rerender({ loaded: true });
  expect(mocks.session).not.toHaveBeenCalled();
  mocks.migration.success = true;
  rerender({ loaded: true });
  await waitFor(() => expect(result.current.isReady).toBe(true));
  rerender({ loaded: true });
  expect(mocks.session).toHaveBeenCalledTimes(1);
  expect(mocks.signIn).toHaveBeenCalledTimes(1);
});
it("既存セッションがあれば匿名登録しない", async () => {
  mocks.session.mockResolvedValue({
    data: { user: { id: "user" } },
    error: null,
  });
  const { result } = renderHook(() => useAppBootstrap(true));
  await waitFor(() => expect(result.current.isReady).toBe(true));
  expect(mocks.signIn).not.toHaveBeenCalled();
});
it("セッション確認中は匿名登録を開始しない", async () => {
  const session = createDeferred<{ data: null; error: null }>();
  mocks.session.mockReturnValueOnce(session.promise);
  const { result } = renderHook(() => useAppBootstrap(true));
  expect(result.current.isReady).toBe(false);
  expect(mocks.signIn).not.toHaveBeenCalled();
  await act(async () => session.resolve({ data: null, error: null }));
  await waitFor(() => expect(result.current.isReady).toBe(true));
});
it("StrictModeでも認証を重複実行せず完了を表示する", async () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <StrictMode>{children}</StrictMode>
  );
  const { result } = renderHook(() => useAppBootstrap(true), { wrapper });
  await waitFor(() => expect(result.current.isReady).toBe(true));
  expect(mocks.session).toHaveBeenCalledTimes(1);
  expect(mocks.signIn).toHaveBeenCalledTimes(1);
});
it("DB初期化失敗時は認証しない", () => {
  const error = new Error("Migration failed");
  mocks.migration.error = error;
  const { result } = renderHook(() => useAppBootstrap(true));
  expect(result.current.error).toBe(error);
  expect(result.current.isReady).toBe(false);
  expect(mocks.session).not.toHaveBeenCalled();
});
it.each([
  "session",
  "signIn",
] as const)("%s のエラーを返し、再レンダーで再送しない", async (operation) => {
  const error = new Error("Auth failed");
  mocks[operation].mockResolvedValue({ data: null, error });
  const { result, rerender } = renderHook(() => useAppBootstrap(true));
  await waitFor(() => expect(result.current.error).toBe(error));
  rerender();
  expect(result.current.isReady).toBe(false);
  expect(mocks[operation]).toHaveBeenCalledTimes(1);
  if (operation === "session") {
    expect(mocks.signIn).not.toHaveBeenCalled();
  }
});
it("認証SDKの例外を処理する", async () => {
  const error = new Error("Network failed");
  mocks.session.mockRejectedValue(error);
  const { result } = renderHook(() => useAppBootstrap(true));
  await waitFor(() => expect(result.current.error).toBe(error));
  expect(mocks.signIn).not.toHaveBeenCalled();
});
it("アンマウント後に完了しても状態を更新しない", async () => {
  const session = createDeferred<{ data: object; error: null }>();
  mocks.session.mockReturnValueOnce(session.promise);
  const { result, unmount } = renderHook(() => useAppBootstrap(true));
  unmount();
  await act(async () =>
    session.resolve({ data: { user: { id: "user" } }, error: null })
  );
  expect(result.current.isReady).toBe(false);
  expect(mocks.signIn).not.toHaveBeenCalled();
});
