import { getKVItem, setKVItem } from "@/lib/kv/client";
import {
  SETTINGS_BEHAVIOR_KEY,
  SETTINGS_OBJECTIVE_KEY,
  SETTINGS_PURPOSE_KEY,
} from "@/lib/kv/keys";
import type { SettingsRepository } from "@/types/settings";

export const settingsRepository: SettingsRepository = {
  async read() {
    const [objective, purpose, behavior] = await Promise.all([
      getKVItem(SETTINGS_OBJECTIVE_KEY),
      getKVItem(SETTINGS_PURPOSE_KEY),
      getKVItem(SETTINGS_BEHAVIOR_KEY),
    ]);
    return { objective, purpose, behavior };
  },
  async saveObjective(value) {
    await setKVItem(SETTINGS_OBJECTIVE_KEY, value);
  },
  async savePurpose(value) {
    await setKVItem(SETTINGS_PURPOSE_KEY, value);
  },
  async saveBehavior(value) {
    await setKVItem(SETTINGS_BEHAVIOR_KEY, value);
  },
};
