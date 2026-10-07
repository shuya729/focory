import { describe, expect, it } from "vitest";
import { buildArchiveMonths, classifyDayCategory } from "@/utils/archive-utils";

const today = new Date(2026, 9, 7, 12);
describe("アーカイブ集計", () => {
  it("記録なしでも指定月数のカレンダーを作る", () => {
    const months = buildArchiveMonths([], 3, today);
    expect(months.map((month) => month.id)).toEqual([
      "2026-10",
      "2026-09",
      "2026-08",
    ]);
    expect(months.map((month) => month.totalSeconds)).toEqual([0, 0, 0]);
    expect(
      months[0]?.weeks.flat().filter((day) => day.dayOfMonth !== null)
    ).toHaveLength(31);
  });
  it("同じ日の複数記録を月の合計へ加算する", () => {
    const records = [
      {
        startAt: new Date(2026, 9, 2, 10),
        endAt: new Date(2026, 9, 2, 10, 20),
      },
      {
        startAt: new Date(2026, 9, 2, 11),
        endAt: new Date(2026, 9, 2, 11, 10),
      },
    ];
    expect(buildArchiveMonths(records, 1, today)[0]?.totalSeconds).toBe(1800);
  });
  it("月をまたぐ記録を日境界で分けて各月へ集計する", () => {
    const records = [
      {
        startAt: new Date(2026, 8, 30, 23, 30),
        endAt: new Date(2026, 9, 1, 0, 30),
      },
    ];
    expect(
      buildArchiveMonths(records, 2, today).map((month) => month.totalSeconds)
    ).toEqual([1800, 1800]);
  });
  it("0秒・逆転した区間を加算しない", () => {
    expect(
      buildArchiveMonths(
        [
          { startAt: today, endAt: today },
          { startAt: today, endAt: new Date(today.getTime() - 1000) },
        ],
        1,
        today
      )[0]?.totalSeconds
    ).toBe(0);
  });
  it("数値の日時も受け入れ、うるう年の2月を生成する", () => {
    const months = buildArchiveMonths(
      [
        {
          startAt: new Date(2024, 1, 29).getTime(),
          endAt: new Date(2024, 1, 29, 1).getTime(),
        },
      ],
      1,
      new Date(2024, 1, 29)
    );
    expect(months[0]?.totalSeconds).toBe(3600);
    expect(
      months[0]?.weeks.flat().filter((day) => day.dayOfMonth !== null)
    ).toHaveLength(29);
  });
  it.each([
    [0, "none"],
    [7200, "low"],
    [7201, "medium"],
    [14_401, "high"],
    [21_601, "very-high"],
  ])("%s 秒を %s に分類する", (seconds, expected) => {
    expect(classifyDayCategory(Number(seconds)).key).toBe(expected);
  });
});
