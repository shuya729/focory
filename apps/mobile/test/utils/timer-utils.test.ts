import { describe, expect, it } from "vitest";
import { MAX_TIMER_DURATION_SECONDS } from "@/constants/timer-constants";
import {
  calculateElapsedSeconds,
  clampTimerDurationSeconds,
  createIdleTimerState,
  formatCompactDuration,
  formatTimerClock,
  normalizePositiveTimerDurationSeconds,
  restoreTimerState,
  splitTimerDurationSeconds,
  toTimerDurationSeconds,
} from "@/utils/timer-utils";

describe("タイマーの時間計算", () => {
  it.each([
    [-1, 0],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
    [12.9, 12],
    [6000, MAX_TIMER_DURATION_SECONDS],
  ])("%s 秒を %s 秒に正規化する", (input, expected) => {
    expect(clampTimerDurationSeconds(input)).toBe(expected);
  });
  it("有効な設定時間を優先し、無効なら代替の時間を使う", () => {
    expect(normalizePositiveTimerDurationSeconds(900, 600)).toBe(900);
    expect(normalizePositiveTimerDurationSeconds(0, 600)).toBe(600);
    expect(normalizePositiveTimerDurationSeconds(-1, -1)).toBe(0);
  });
  it("分と秒の相互変換に上限を適用する", () => {
    expect(splitTimerDurationSeconds(125)).toEqual({ minutes: 2, seconds: 5 });
    expect(toTimerDurationSeconds(2, 5)).toBe(125);
    expect(toTimerDurationSeconds(100, 0)).toBe(MAX_TIMER_DURATION_SECONDS);
  });
  it("経過時間を計算し、負の値を返さない", () => {
    expect(calculateElapsedSeconds(600, 450)).toBe(150);
    expect(calculateElapsedSeconds(600, 700)).toBe(0);
  });
  it("時計と集計用の表示を整形する", () => {
    expect(formatTimerClock(65)).toBe("01:05");
    expect(formatCompactDuration(3600)).toBe("1h");
    expect(formatCompactDuration(3660)).toBe("1h 1m");
    expect(formatCompactDuration(120)).toBe("2m");
  });
  it("待機状態はIDなし・停止中・設定時間の残り時間で作る", () => {
    expect(createIdleTimerState(600)).toEqual({
      currentTimerId: null,
      currentArchiveId: null,
      durationSeconds: 600,
      remainingSeconds: 600,
      isRunning: false,
      isTransitioning: false,
    });
  });
});
describe("保存タイマーの復元", () => {
  it("保存値がなければ設定時間を復元する", () => {
    expect(restoreTimerState(null, 600)).toEqual({
      currentTimerId: null,
      durationSeconds: 600,
      remainingSeconds: 600,
    });
  });
  it("未完了なら保存した経過時間を差し引く", () => {
    expect(
      restoreTimerState(
        { id: "timer", durationSeconds: 900, elapsedSeconds: 300 },
        600
      )
    ).toEqual({
      currentTimerId: "timer",
      durationSeconds: 900,
      remainingSeconds: 600,
    });
  });
  it("完了済みならタイマーIDを復元せず全時間を返す", () => {
    expect(
      restoreTimerState(
        { id: "timer", durationSeconds: 600, elapsedSeconds: 600 },
        600
      )
    ).toEqual({
      currentTimerId: null,
      durationSeconds: 600,
      remainingSeconds: 600,
    });
  });
  it("不正な保存時間を正規化し、リセット済みの経過0秒を復元する", () => {
    expect(
      restoreTimerState(
        { id: "timer", durationSeconds: -1, elapsedSeconds: -1 },
        600
      )
    ).toEqual({
      currentTimerId: "timer",
      durationSeconds: 600,
      remainingSeconds: 600,
    });
    expect(
      restoreTimerState(
        { id: "timer", durationSeconds: 900, elapsedSeconds: 0 },
        600
      ).remainingSeconds
    ).toBe(900);
  });
});
