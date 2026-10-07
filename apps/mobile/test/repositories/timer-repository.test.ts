import { beforeEach, expect, it, vi } from "vitest";
import { archives, timers } from "@/lib/db/schema";
import { timerRepository } from "@/repositories/timer-repository";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  from: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  get: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  txInsert: vi.fn(),
  txUpdate: vi.fn(),
  values: vi.fn(),
  set: vi.fn(),
  where: vi.fn(),
  run: vi.fn(),
  transaction: vi.fn(),
  id: vi.fn(),
}));
vi.mock("@/lib/db/client", () => ({
  db: {
    select: mocks.select,
    insert: mocks.insert,
    update: mocks.update,
    transaction: mocks.transaction,
  },
}));
vi.mock("uuid", () => ({ v7: mocks.id }));
vi.mock("drizzle-orm", async (importOriginal) => ({
  ...(await importOriginal<typeof import("drizzle-orm")>()),
  eq: (column: unknown, value: unknown) => ({ column, value }),
}));
let transactionResult: unknown;
beforeEach(() => {
  vi.resetAllMocks();
  const query = {
    from: mocks.from,
    orderBy: mocks.orderBy,
    limit: mocks.limit,
    get: mocks.get,
    values: mocks.values,
    set: mocks.set,
    where: mocks.where,
    run: mocks.run,
  };
  for (const method of [
    mocks.select,
    mocks.from,
    mocks.orderBy,
    mocks.limit,
    mocks.insert,
    mocks.update,
    mocks.txInsert,
    mocks.txUpdate,
    mocks.values,
    mocks.set,
    mocks.where,
  ]) {
    method.mockReturnValue(query);
  }
  mocks.transaction.mockImplementation(
    (
      callback: (tx: {
        insert: typeof mocks.txInsert;
        update: typeof mocks.txUpdate;
      }) => unknown
    ) => {
      transactionResult = callback({
        insert: mocks.txInsert,
        update: mocks.txUpdate,
      });
      return transactionResult;
    }
  );
  mocks.id.mockReturnValueOnce("timer").mockReturnValueOnce("archive");
});
it("最新タイマーを1件だけ同期取得する", () => {
  const stored = { id: "timer", durationSeconds: 600, elapsedSeconds: 200 };
  mocks.get.mockReturnValue(stored);
  expect(timerRepository.findLatestTimer()).toEqual(stored);
  expect(mocks.from).toHaveBeenCalledWith(timers);
  expect(mocks.limit).toHaveBeenCalledWith(1);
  expect(mocks.get).toHaveBeenCalledTimes(1);
});
it("開始時にタイマーと記録を同じ同期トランザクション内に作る", () => {
  const result = timerRepository.startSession(600);
  expect(result).toEqual({ timerId: "timer", archiveId: "archive" });
  expect(mocks.transaction).toHaveBeenCalledTimes(1);
  expect(transactionResult).not.toBeInstanceOf(Promise);
  expect(mocks.txInsert.mock.calls).toEqual([[timers], [archives]]);
  expect(mocks.insert).not.toHaveBeenCalled();
  expect(mocks.values).toHaveBeenCalledWith(
    expect.objectContaining({ id: "timer", durationSec: 600, elapsedSec: 0 })
  );
  expect(mocks.values).toHaveBeenCalledWith(
    expect.objectContaining({ id: "archive", timerId: "timer" })
  );
  expect(mocks.run).toHaveBeenCalledTimes(2);
});
it.each([
  "pause",
  "finish",
] as const)("%s はタイマーと記録を同じトランザクション内で更新する", (operation) => {
  if (operation === "pause") {
    timerRepository.pauseSession({
      timerId: "timer",
      archiveId: "archive",
      elapsedSeconds: 200,
    });
  } else {
    timerRepository.finishSession({
      timerId: "timer",
      archiveId: "archive",
      durationSeconds: 600,
    });
  }
  expect(mocks.txUpdate.mock.calls).toEqual([[timers], [archives]]);
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.set).toHaveBeenCalledWith(
    expect.objectContaining({ elapsedSec: operation === "pause" ? 200 : 600 })
  );
  expect(mocks.where.mock.calls).toEqual([
    [{ column: timers.id, value: "timer" }],
    [{ column: archives.id, value: "archive" }],
  ]);
  expect(transactionResult).not.toBeInstanceOf(Promise);
  expect(mocks.run).toHaveBeenCalledTimes(2);
});
it("再開は既存タイマーの新しい記録だけを作る", () => {
  mocks.id.mockReset().mockReturnValue("new-archive");
  expect(timerRepository.restartSession("timer")).toEqual({
    archiveId: "new-archive",
  });
  expect(mocks.insert).toHaveBeenCalledExactlyOnceWith(archives);
  expect(mocks.values).toHaveBeenCalledWith(
    expect.objectContaining({ timerId: "timer", id: "new-archive" })
  );
  expect(mocks.transaction).not.toHaveBeenCalled();
});
it("リセットは対象タイマーの時間・経過0秒だけを更新し、記録を変更しない", () => {
  timerRepository.resetTimer({ timerId: "timer", durationSeconds: 900 });
  expect(mocks.update).toHaveBeenCalledExactlyOnceWith(timers);
  expect(mocks.set).toHaveBeenCalledWith(
    expect.objectContaining({ durationSec: 900, elapsedSec: 0 })
  );
  expect(mocks.where).toHaveBeenCalledWith({
    column: timers.id,
    value: "timer",
  });
  expect(mocks.insert).not.toHaveBeenCalled();
  expect(mocks.txUpdate).not.toHaveBeenCalled();
});
it("2件目の書き込みの失敗をトランザクションの呼び出し元へ伝える", () => {
  mocks.run
    .mockImplementationOnce(() => undefined)
    .mockImplementationOnce(() => {
      throw new Error("Write failed");
    });
  expect(() => timerRepository.startSession(600)).toThrow("Write failed");
  expect(mocks.transaction).toHaveBeenCalledTimes(1);
});
it("リセットの書き込み失敗を伝播する", () => {
  mocks.run.mockImplementation(() => {
    throw new Error("Reset failed");
  });
  expect(() =>
    timerRepository.resetTimer({ timerId: "timer", durationSeconds: 600 })
  ).toThrow("Reset failed");
});
