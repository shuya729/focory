import { getKVItem, setKVItem } from "@/lib/kv/client";
import { TIMER_DURATION_SECONDS_KEY } from "@/lib/kv/keys";
import type { TimerPreferenceRepository } from "@/types/settings";

export const timerPreferenceRepository: TimerPreferenceRepository = {
  async readDuration() {
    return await getKVItem(TIMER_DURATION_SECONDS_KEY);
  },
  async saveDuration(durationSeconds) {
    await setKVItem(TIMER_DURATION_SECONDS_KEY, String(durationSeconds));
  },
};
