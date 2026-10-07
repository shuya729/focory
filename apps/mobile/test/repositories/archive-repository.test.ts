import { beforeEach, expect, it, vi } from "vitest";
import { archiveRepository } from "@/repositories/archive-repository";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  from: vi.fn(),
  orderBy: vi.fn(),
  all: vi.fn(),
}));
vi.mock("@/lib/db/client", () => ({ db: { select: mocks.select } }));
beforeEach(() => {
  vi.resetAllMocks();
  mocks.select.mockReturnValue({ from: mocks.from });
  mocks.from.mockReturnValue({ orderBy: mocks.orderBy });
  mocks.orderBy.mockReturnValue({ all: mocks.all });
});
it("記録の開始・終了日時を同期的に返す", () => {
  const records = [
    { startAt: new Date(2026, 9, 7, 10), endAt: new Date(2026, 9, 7, 11) },
  ];
  mocks.all.mockReturnValue(records);
  const result = archiveRepository.listRecords();
  expect(result).toEqual(records);
  expect(result).not.toBeInstanceOf(Promise);
  expect(mocks.all).toHaveBeenCalledTimes(1);
});
it("DB読込失敗を伝播する", () => {
  mocks.all.mockImplementation(() => {
    throw new Error("Read failed");
  });
  expect(() => archiveRepository.listRecords()).toThrow("Read failed");
});
