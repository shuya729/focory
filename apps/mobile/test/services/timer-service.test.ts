import { beforeEach, describe, expect, it, vi } from "vitest";
import { TimerService } from "@/services/timer-service";
import type { TimerRepository } from "@/types/timer";
import { createIdleTimerState } from "@/utils/timer-utils";

const repository = {
  findLatestTimer: vi.fn<TimerRepository["findLatestTimer"]>(),
  startSession: vi.fn<TimerRepository["startSession"]>(),
  restartSession: vi.fn<TimerRepository["restartSession"]>(),
  pauseSession: vi.fn<TimerRepository["pauseSession"]>(),
  finishSession: vi.fn<TimerRepository["finishSession"]>(),
  resetTimer: vi.fn<TimerRepository["resetTimer"]>(),
};
const service = new TimerService(repository);
const running = Object.freeze({
  ...createIdleTimerState(600),
  currentTimerId: "timer",
  currentArchiveId: "archive",
  isRunning: true,
  remainingSeconds: 400,
});
beforeEach(() => {
  vi.resetAllMocks();
  repository.startSession.mockReturnValue({
    timerId: "timer",
    archiveId: "archive",
  });
  repository.restartSession.mockReturnValue({ archiveId: "new-archive" });
});
describe("TimerService", () => {
  it("新規開始を保存し、実行状態とstartメッセージを返す", () => {
    const result = service.startOrResume(
      Object.freeze(createIdleTimerState(600))
    );
    expect(repository.startSession).toHaveBeenCalledWith(600);
    expect(result?.state).toEqual({ ...running, remainingSeconds: 600 });
    expect(result?.message).toEqual({
      timerId: "timer",
      type: "start",
      durationSeconds: 600,
      elapsedSeconds: 0,
    });
  });
  it("未完了タイマーの再開ではIDと残り時間を維持する", () => {
    const result = service.startOrResume({
      ...running,
      isRunning: false,
      currentArchiveId: null,
    });
    expect(repository.restartSession).toHaveBeenCalledWith("timer");
    expect(repository.startSession).not.toHaveBeenCalled();
    expect(result?.state.remainingSeconds).toBe(400);
    expect(result?.message).toEqual({
      timerId: "timer",
      type: "restart",
      durationSeconds: 600,
      elapsedSeconds: 200,
    });
  });
  it.each([
    running,
    { ...createIdleTimerState(600), isTransitioning: true },
    createIdleTimerState(0),
  ])("開始できない状態では保存しない", (state) => {
    expect(service.startOrResume(state)).toBeNull();
    expect(repository.startSession).not.toHaveBeenCalled();
    expect(repository.restartSession).not.toHaveBeenCalled();
  });
  it("停止では経過時間を保存し、アーカイブを閉じる状態を返す", () => {
    const result = service.pause(running);
    expect(repository.pauseSession).toHaveBeenCalledWith({
      timerId: "timer",
      archiveId: "archive",
      elapsedSeconds: 200,
    });
    expect(result?.state).toEqual({
      ...running,
      isRunning: false,
      currentArchiveId: null,
    });
    expect(result?.message.type).toBe("stop");
  });
  it("0秒になった実行中タイマーを完了保存する", () => {
    const result = service.finish({ ...running, remainingSeconds: 0 });
    expect(repository.finishSession).toHaveBeenCalledWith({
      timerId: "timer",
      archiveId: "archive",
      durationSeconds: 600,
    });
    expect(result?.state.isRunning).toBe(false);
    expect(result?.message.type).toBe("finish");
  });
  it("未開始の停止と残り時間がある完了では保存しない", () => {
    expect(service.pause(createIdleTimerState(600))).toBeNull();
    expect(service.finish(running)).toBeNull();
    expect(repository.pauseSession).not.toHaveBeenCalled();
    expect(repository.finishSession).not.toHaveBeenCalled();
  });
  it("リセットでは設定時間を保存し、同じタイマーIDで全時間へ戻す", () => {
    const result = service.reset(
      { ...running, isRunning: false, currentArchiveId: null },
      900
    );
    expect(repository.resetTimer).toHaveBeenCalledWith({
      timerId: "timer",
      durationSeconds: 900,
    });
    expect(result).toEqual({
      ...createIdleTimerState(900),
      currentTimerId: "timer",
    });
    expect(repository.finishSession).not.toHaveBeenCalled();
  });
  it("画面にIDがなくても最新タイマーをリセットする", () => {
    repository.findLatestTimer.mockReturnValue({
      id: "old",
      durationSeconds: 600,
      elapsedSeconds: 200,
    });
    expect(service.reset(createIdleTimerState(900), 900)?.currentTimerId).toBe(
      "old"
    );
    expect(repository.resetTimer).toHaveBeenCalledWith({
      timerId: "old",
      durationSeconds: 900,
    });
  });
  it("保存値なしのリセットは記録を作らず、実行中のリセットは拒否する", () => {
    expect(service.reset(createIdleTimerState(600), 600)).toEqual(
      createIdleTimerState(600)
    );
    expect(service.reset(running, 600)).toBeNull();
    expect(repository.resetTimer).not.toHaveBeenCalled();
    expect(repository.startSession).not.toHaveBeenCalled();
  });
  it.each([
    "start",
    "pause",
    "finish",
    "reset",
  ] as const)("%s の保存失敗を伝播し、入力状態を変更しない", (operation) => {
    const error = new Error("Storage failed");
    const fail = () => {
      throw error;
    };
    repository.startSession.mockImplementation(fail);
    repository.pauseSession.mockImplementation(fail);
    repository.finishSession.mockImplementation(fail);
    repository.resetTimer.mockImplementation(fail);
    expect(() => {
      if (operation === "start") {
        service.startOrResume(createIdleTimerState(600));
      } else if (operation === "pause") {
        service.pause(running);
      } else if (operation === "finish") {
        service.finish({ ...running, remainingSeconds: 0 });
      } else {
        service.reset({ ...running, isRunning: false }, 600);
      }
    }).toThrow(error);
    expect(running.remainingSeconds).toBe(400);
    expect(running.isRunning).toBe(true);
  });
});
