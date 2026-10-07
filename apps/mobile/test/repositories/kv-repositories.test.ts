import { beforeEach, expect, it, vi } from "vitest";
import {
  SETTINGS_BEHAVIOR_KEY,
  SETTINGS_OBJECTIVE_KEY,
  SETTINGS_PURPOSE_KEY,
  TIMER_DURATION_SECONDS_KEY,
  TIMER_MESSAGE_KEY,
} from "@/lib/kv/keys";
import { settingsRepository } from "@/repositories/settings-repository";
import { timerMessageRepository } from "@/repositories/timer-message-repository";
import { timerPreferenceRepository } from "@/repositories/timer-preference-repository";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("@/lib/kv/client", () => ({
  getKVItem: mocks.get,
  setKVItem: mocks.set,
  removeKVItem: mocks.remove,
}));
beforeEach(() => vi.resetAllMocks());
it("設定値をキーごとに読み込み、保存先を混同しない", async () => {
  const stored = new Map([
    [SETTINGS_OBJECTIVE_KEY, "目的"],
    [SETTINGS_PURPOSE_KEY, "理由"],
    [SETTINGS_BEHAVIOR_KEY, "rival"],
  ]);
  mocks.get.mockImplementation((key: string) =>
    Promise.resolve(stored.get(key) ?? null)
  );
  expect(await settingsRepository.read()).toEqual({
    objective: "目的",
    purpose: "理由",
    behavior: "rival",
  });
  await settingsRepository.saveObjective("新目的");
  await settingsRepository.savePurpose("新理由");
  await settingsRepository.saveBehavior("coach");
  expect(mocks.set.mock.calls).toEqual([
    [SETTINGS_OBJECTIVE_KEY, "新目的"],
    [SETTINGS_PURPOSE_KEY, "新理由"],
    [SETTINGS_BEHAVIOR_KEY, "coach"],
  ]);
});
it("時間は文字列として保存し、未保存の値はnullのまま返す", async () => {
  mocks.get.mockResolvedValue(null);
  expect(await timerPreferenceRepository.readDuration()).toBeNull();
  await timerPreferenceRepository.saveDuration(900);
  expect(mocks.get).toHaveBeenCalledWith(TIMER_DURATION_SECONDS_KEY);
  expect(mocks.set).toHaveBeenCalledWith(TIMER_DURATION_SECONDS_KEY, "900");
});
it("メッセージの読み書きは同じキーを使い、クリアは削除を使う", async () => {
  mocks.get.mockResolvedValue("保存メッセージ");
  expect(await timerMessageRepository.read()).toBe("保存メッセージ");
  await timerMessageRepository.save("新値");
  await timerMessageRepository.clear();
  expect(mocks.get).toHaveBeenCalledWith(TIMER_MESSAGE_KEY);
  expect(mocks.set).toHaveBeenCalledWith(TIMER_MESSAGE_KEY, "新値");
  expect(mocks.remove).toHaveBeenCalledWith(TIMER_MESSAGE_KEY);
});
it("KVの失敗を呼び出し元へ伝える", async () => {
  const error = new Error("KV failed");
  mocks.get.mockRejectedValue(error);
  mocks.set.mockRejectedValue(error);
  mocks.remove.mockRejectedValue(error);
  await expect(settingsRepository.read()).rejects.toThrow(error);
  await expect(timerPreferenceRepository.saveDuration(600)).rejects.toThrow(
    error
  );
  await expect(timerMessageRepository.clear()).rejects.toThrow(error);
});
