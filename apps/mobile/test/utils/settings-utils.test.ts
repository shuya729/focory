import { expect, it } from "vitest";
import {
  isBehaviorValue,
  normalizeBehaviorValue,
  toNullableSettingValue,
} from "@/utils/settings-utils";

it("定義された振る舞いだけを受け入れる", () => {
  expect(isBehaviorValue("rival")).toBe(true);
  expect(isBehaviorValue("unknown")).toBe(false);
  expect(normalizeBehaviorValue("coach")).toBe("coach");
});
it.each([null, "", "unknown"])("不正な振る舞い %s は既定値へ戻す", (value) => {
  expect(normalizeBehaviorValue(value)).toBe("supporter");
});
it("API用設定値の前後の空白を除き、空白だけならnullにする", () => {
  expect(toNullableSettingValue("  開発 \n")).toBe("開発");
  expect(toNullableSettingValue(" \n ")).toBeNull();
});
