// @vitest-environment jsdom
import { onlineManager } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useSettingsData } from "@/hooks/data/use-settings-data";
import { LOCAL_QUERY_KEYS } from "@/lib/query/options";
import { createDeferred } from "../../deferred";
import { createQueryWrapper } from "../../query-wrapper";

const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  saveObjective: vi.fn(),
  savePurpose: vi.fn(),
  saveBehavior: vi.fn(),
  toast: vi.fn(),
}));
vi.mock("@/repositories/settings-repository", () => ({
  settingsRepository: mocks,
}));
vi.mock("@/utils/toast-utils", () => ({ showErrorToast: mocks.toast }));
let context: ReturnType<typeof createQueryWrapper>;
const stored = { behavior: "supporter", objective: "旧目的", purpose: "理由" };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.read.mockResolvedValue(stored);
  context = createQueryWrapper();
});
afterEach(() => {
  cleanup();
  context.client.clear();
  onlineManager.setOnline(true);
});
it("複数利用元で読込を共有し、不正な設定を正規化する", async () => {
  mocks.read.mockResolvedValue({
    behavior: "unknown",
    objective: null,
    purpose: null,
  });
  const { result } = renderHook(
    () => ({ first: useSettingsData(), second: useSettingsData() }),
    { wrapper: context.wrapper }
  );
  await waitFor(() => expect(result.current.first.query.isSuccess).toBe(true));
  expect(result.current.second.query.data).toEqual({
    behavior: "supporter",
    objective: "",
    purpose: "",
  });
  expect(mocks.read).toHaveBeenCalledTimes(1);
});
it.each([
  "objective",
  "purpose",
  "behavior",
] as const)("%s 保存後にキャッシュを更新する", async (field) => {
  const { result } = renderHook(() => useSettingsData(), {
    wrapper: context.wrapper,
  });
  await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
  act(() => {
    if (field === "behavior") {
      result.current.save.mutate({ field, value: "rival" });
    } else {
      result.current.save.mutate({ field, value: "新値" });
    }
  });
  await waitFor(() => expect(result.current.save.isSuccess).toBe(true));
  expect(result.current.query.data).toEqual({
    ...stored,
    [field]: field === "behavior" ? "rival" : "新値",
  });
});
it("保存失敗ではキャッシュを維持して通知し、再試行しない", async () => {
  mocks.saveObjective.mockRejectedValue(new Error("Write failed"));
  const { result } = renderHook(() => useSettingsData(), {
    wrapper: context.wrapper,
  });
  await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
  act(() => result.current.save.mutate({ field: "objective", value: "新値" }));
  await waitFor(() => expect(result.current.save.isError).toBe(true));
  expect(context.client.getQueryData(LOCAL_QUERY_KEYS.settings)).toEqual(
    stored
  );
  expect(mocks.toast).toHaveBeenCalledWith("設定の保存に失敗しました");
  expect(mocks.saveObjective).toHaveBeenCalledTimes(1);
});
it("連続した書き込みを直列化し、最後の値を保存する", async () => {
  const first = createDeferred<void>();
  mocks.saveObjective.mockReturnValueOnce(first.promise);
  const { result } = renderHook(() => useSettingsData(), {
    wrapper: context.wrapper,
  });
  await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
  act(() => {
    result.current.save.mutate({ field: "objective", value: "1" });
    result.current.save.mutate({ field: "objective", value: "2" });
  });
  await waitFor(() => expect(mocks.saveObjective).toHaveBeenCalledTimes(1));
  await act(async () => first.resolve());
  await waitFor(() => expect(result.current.save.isSuccess).toBe(true));
  expect(mocks.saveObjective.mock.calls).toEqual([["1"], ["2"]]);
  expect(result.current.query.data?.objective).toBe("2");
});
it("遅い初期読込が保存した値を上書きしない", async () => {
  const initial = createDeferred<typeof stored>();
  mocks.read
    .mockReturnValueOnce(initial.promise)
    .mockResolvedValue({ ...stored, objective: "新値" });
  const { result } = renderHook(() => useSettingsData(), {
    wrapper: context.wrapper,
  });
  act(() => result.current.save.mutate({ field: "objective", value: "新値" }));
  await waitFor(() =>
    expect(result.current.query.data?.objective).toBe("新値")
  );
  await act(async () => initial.resolve(stored));
  expect(result.current.query.data?.objective).toBe("新値");
});
it("オフラインでも設定を読み書きする", async () => {
  onlineManager.setOnline(false);
  const { result } = renderHook(() => useSettingsData(), {
    wrapper: context.wrapper,
  });
  await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
  act(() => result.current.save.mutate({ field: "purpose", value: "新値" }));
  await waitFor(() => expect(result.current.save.isSuccess).toBe(true));
  expect(result.current.query.data?.purpose).toBe("新値");
});
it("読込失敗を一度通知し、自動再試行しない", async () => {
  mocks.read.mockRejectedValue(new Error("Read failed"));
  const { result } = renderHook(() => useSettingsData(), {
    wrapper: context.wrapper,
  });
  await waitFor(() => expect(result.current.query.isError).toBe(true));
  expect(mocks.toast).toHaveBeenCalledExactlyOnceWith(
    "設定の読み込みに失敗しました"
  );
  expect(mocks.read).toHaveBeenCalledTimes(1);
});
