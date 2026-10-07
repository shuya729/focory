// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useSettings } from "@/hooks/use-settings";
import type { UserSettings } from "@/types/settings";
import { createQueryWrapper } from "../query-wrapper";

const mocks = vi.hoisted(() => ({
  data: undefined as UserSettings | undefined,
  save: vi.fn(),
  open: vi.fn(),
  toast: vi.fn(),
}));
vi.mock("@/hooks/data/use-settings-data", () => ({
  useSettingsData: () => ({
    query: { data: mocks.data },
    save: { mutate: mocks.save },
  }),
}));
vi.mock("expo-web-browser", () => ({ openBrowserAsync: mocks.open }));
vi.mock("@/utils/toast-utils", () => ({ showErrorToast: mocks.toast }));
let context: ReturnType<typeof createQueryWrapper>;
beforeEach(() => {
  vi.resetAllMocks();
  mocks.data = undefined;
  context = createQueryWrapper();
});
afterEach(() => {
  cleanup();
  context.client.clear();
});
it("初期値を表示し、取得後に保存設定を表示する", () => {
  const { result, rerender } = renderHook(() => useSettings(), {
    wrapper: context.wrapper,
  });
  expect(result.current.objective).toBe("");
  expect(result.current.selectedBehavior).toBe("supporter");
  mocks.data = { behavior: "rival", objective: "目的", purpose: "理由" };
  rerender();
  expect(result.current.objective).toBe("目的");
  expect(result.current.purpose).toBe("理由");
  expect(result.current.selectedBehavior).toBe("rival");
});
it("入力を即時反映して保存要求し、再取得で編集中の値を消さない", () => {
  const { result, rerender } = renderHook(() => useSettings(), {
    wrapper: context.wrapper,
  });
  act(() => {
    result.current.handleChangeObjective("新目的");
    result.current.handleChangePurpose("新理由");
    result.current.handleChangeBehavior("coach");
  });
  expect(mocks.save.mock.calls).toEqual([
    [{ field: "objective", value: "新目的" }],
    [{ field: "purpose", value: "新理由" }],
    [{ field: "behavior", value: "coach" }],
  ]);
  mocks.data = { behavior: "rival", objective: "旧目的", purpose: "旧理由" };
  rerender();
  expect(result.current.objective).toBe("新目的");
  expect(result.current.purpose).toBe("新理由");
  expect(result.current.selectedBehavior).toBe("coach");
});
it("保存値が変わらなくても入力中の値を維持する", () => {
  const { result, rerender } = renderHook(() => useSettings(), {
    wrapper: context.wrapper,
  });
  act(() => result.current.handleChangeObjective("未保存"));
  rerender();
  expect(result.current.objective).toBe("未保存");
});
it("リンクを開く失敗を通知し、再試行しない", async () => {
  mocks.open.mockRejectedValue(new Error("Open failed"));
  const { result } = renderHook(() => useSettings(), {
    wrapper: context.wrapper,
  });
  act(() => result.current.onClickLink("https://example.test"));
  await waitFor(() =>
    expect(mocks.toast).toHaveBeenCalledWith("リンクを開けませんでした")
  );
  expect(mocks.open).toHaveBeenCalledTimes(1);
});
