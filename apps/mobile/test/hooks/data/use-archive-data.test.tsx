// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useArchiveData } from "@/hooks/data/use-archive-data";
import { LOCAL_QUERY_KEYS } from "@/lib/query/options";
import { createQueryWrapper } from "../../query-wrapper";

const mocks = vi.hoisted(() => ({ listRecords: vi.fn(), toast: vi.fn() }));
vi.mock("@/repositories/archive-repository", () => ({
  archiveRepository: mocks,
}));
vi.mock("@/utils/toast-utils", () => ({ showErrorToast: mocks.toast }));
let context: ReturnType<typeof createQueryWrapper>;
beforeEach(() => {
  vi.resetAllMocks();
  mocks.listRecords.mockReturnValue([]);
  context = createQueryWrapper();
});
afterEach(() => {
  cleanup();
  context.client.clear();
});
it("キャッシュ無効化後に最新の記録を取得する", async () => {
  const { result } = renderHook(() => useArchiveData(), {
    wrapper: context.wrapper,
  });
  await waitFor(() => expect(result.current.data).toEqual([]));
  const records = [
    { startAt: new Date(2026, 9, 1, 10), endAt: new Date(2026, 9, 1, 11) },
  ];
  mocks.listRecords.mockReturnValue(records);
  await act(async () => {
    await context.client.invalidateQueries({
      queryKey: LOCAL_QUERY_KEYS.archives,
    });
  });
  expect(mocks.listRecords).toHaveBeenCalledTimes(2);
  expect(context.client.getQueryData(LOCAL_QUERY_KEYS.archives)).toEqual(
    records
  );
  await waitFor(() => expect(result.current.data).toEqual(records));
});
it("同期読込の失敗を一度通知する", async () => {
  mocks.listRecords.mockImplementation(() => {
    throw new Error("Read failed");
  });
  const { result } = renderHook(() => useArchiveData(), {
    wrapper: context.wrapper,
  });
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(mocks.toast).toHaveBeenCalledExactlyOnceWith(
    "過去の記録の読み込みに失敗しました"
  );
  expect(mocks.listRecords).toHaveBeenCalledTimes(1);
});
