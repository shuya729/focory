// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useArchiveCalendar } from "@/hooks/use-archive-calendar";
import type { ArchiveRecord } from "@/types/archive";

const mocks = vi.hoisted(() => ({
  data: undefined as ArchiveRecord[] | undefined,
}));
vi.mock("@/hooks/data/use-archive-data", () => ({
  useArchiveData: () => {
    return { data: mocks.data };
  },
}));
beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 7));
  mocks.data = undefined;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it("初期3か月を表示し、取得した記録の合計を反映する", () => {
  const { result, rerender } = renderHook(() => useArchiveCalendar());
  expect(result.current.archiveMonths).toHaveLength(3);
  mocks.data = [
    { startAt: new Date(2026, 9, 2, 10), endAt: new Date(2026, 9, 2, 10, 20) },
  ];
  rerender();
  expect(result.current.archiveMonths[0]?.totalSeconds).toBe(1200);
});
it("追加表示で月数を3増やし、既存データで集計する", () => {
  mocks.data = [
    { startAt: new Date(2026, 9, 2, 10), endAt: new Date(2026, 9, 2, 11) },
  ];
  const { result } = renderHook(() => useArchiveCalendar());
  act(() => result.current.loadMoreMonths());
  expect(result.current.archiveMonths).toHaveLength(6);
  expect(result.current.archiveMonths[0]?.totalSeconds).toBe(3600);
});
