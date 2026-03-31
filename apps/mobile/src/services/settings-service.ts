import { KVClient } from "@/lib/kv/client";

const kvClient = new KVClient();

export const BEHAVIOR_OPTIONS = [
  "やさしい",
  "厳しい",
  "明るい",
  "落ち着き",
  "おもしろい",
  "クール",
] as const;

export type BehaviorOption = (typeof BEHAVIOR_OPTIONS)[number];

export interface UserSettings {
  behavior: BehaviorOption;
  objective: string;
  purpose: string;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  behavior: BEHAVIOR_OPTIONS[0],
  objective: "",
  purpose: "",
};

const isBehaviorOption = (value: string): value is BehaviorOption =>
  BEHAVIOR_OPTIONS.includes(value as BehaviorOption);

const normalizeBehavior = (value: string | null): BehaviorOption => {
  if (value && isBehaviorOption(value)) {
    return value;
  }

  return DEFAULT_USER_SETTINGS.behavior;
};

export const toNullableSettingValue = (value: string) => {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
};

export async function getSettings(): Promise<UserSettings> {
  const [objective, purpose, behavior] = await Promise.all([
    kvClient.get("settingsObjective"),
    kvClient.get("settingsPurpose"),
    kvClient.get("settingsBehavior"),
  ]);

  return {
    behavior: normalizeBehavior(behavior),
    objective: objective ?? DEFAULT_USER_SETTINGS.objective,
    purpose: purpose ?? DEFAULT_USER_SETTINGS.purpose,
  };
}

export async function saveObjective(objective: string) {
  await kvClient.set("settingsObjective", objective);
}

export async function savePurpose(purpose: string) {
  await kvClient.set("settingsPurpose", purpose);
}

export async function saveBehavior(behavior: BehaviorOption) {
  await kvClient.set("settingsBehavior", behavior);
}
