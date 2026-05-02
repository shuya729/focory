import { DEFAULT_BEHAVIOR_OPTION } from "@/constants/settings-constants";
import { getKVItem, setKVItem } from "@/lib/kv/client";
import {
  SETTINGS_BEHAVIOR_KEY,
  SETTINGS_OBJECTIVE_KEY,
  SETTINGS_PURPOSE_KEY,
} from "@/lib/kv/keys";
import type { UserSettings } from "@/types/settings";
import {
  getBehaviorLabel,
  normalizeBehaviorValue,
  toNullableSettingValue,
} from "@/utils/settings-utils";

export const DEFAULT_USER_SETTINGS: UserSettings = {
  behavior: DEFAULT_BEHAVIOR_OPTION.value,
  objective: "",
  purpose: "",
};

export async function getSettings(): Promise<UserSettings> {
  const [objective, purpose, behavior] = await Promise.all([
    getKVItem(SETTINGS_OBJECTIVE_KEY),
    getKVItem(SETTINGS_PURPOSE_KEY),
    getKVItem(SETTINGS_BEHAVIOR_KEY),
  ]);

  return {
    behavior: normalizeBehaviorValue(behavior),
    objective: objective ?? DEFAULT_USER_SETTINGS.objective,
    purpose: purpose ?? DEFAULT_USER_SETTINGS.purpose,
  };
}

export async function saveObjective(objective: string) {
  await setKVItem(SETTINGS_OBJECTIVE_KEY, objective);
}

export async function savePurpose(purpose: string) {
  await setKVItem(SETTINGS_PURPOSE_KEY, purpose);
}

export async function saveBehavior(behavior: UserSettings["behavior"]) {
  await setKVItem(SETTINGS_BEHAVIOR_KEY, normalizeBehaviorValue(behavior));
}

export function toTimerMessageSettings(settings: UserSettings) {
  return {
    behavior: toNullableSettingValue(getBehaviorLabel(settings.behavior)),
    objective: toNullableSettingValue(settings.objective),
    purpose: toNullableSettingValue(settings.purpose),
  };
}
