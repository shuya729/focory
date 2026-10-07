// @vitest-environment jsdom
import { cleanup, renderHook } from "@testing-library/react";
import { type ReactNode, StrictMode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useInitialPushTokenRegistration } from "@/hooks/use-initial-push-token-registration";

const mocks = vi.hoisted(() => ({ register: vi.fn() }));
vi.mock("@/hooks/data/use-push-token-registration", () => ({
  usePushTokenRegistration: () => ({ register: mocks.register }),
}));
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);
it("再レンダーやStrictModeで初回登録を重複しない", () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <StrictMode>{children}</StrictMode>
  );
  const { rerender } = renderHook(() => useInitialPushTokenRegistration(), {
    wrapper,
  });
  rerender();
  expect(mocks.register).toHaveBeenCalledTimes(1);
});
it("新しくマウントしたら再び登録を要求する", () => {
  const first = renderHook(() => useInitialPushTokenRegistration());
  first.unmount();
  renderHook(() => useInitialPushTokenRegistration());
  expect(mocks.register).toHaveBeenCalledTimes(2);
});
