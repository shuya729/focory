import { DEFAULT_TIMER_DURATION_SECONDS } from "@/constants/timer-constants";
import { getKVItem, setKVItem } from "@/lib/kv/client";
import { TIMER_DURATION_SECONDS_KEY } from "@/lib/kv/keys";
import {
  clampTimerDurationSeconds,
  normalizePositiveTimerDurationSeconds,
} from "@/utils/timer-utils";

export async function getTimerDurationPreference(
  fallbackDurationSeconds = DEFAULT_TIMER_DURATION_SECONDS
) {
  const savedDurationSeconds = await getKVItem(TIMER_DURATION_SECONDS_KEY);
  const parsedDurationSeconds = Number(savedDurationSeconds);

  return normalizePositiveTimerDurationSeconds(
    parsedDurationSeconds,
    fallbackDurationSeconds
  );
}

export async function saveTimerDurationPreference(durationSeconds: number) {
  const nextDurationSeconds = clampTimerDurationSeconds(durationSeconds);

  if (nextDurationSeconds === 0) {
    return;
  }

  await setKVItem(TIMER_DURATION_SECONDS_KEY, nextDurationSeconds.toString());
}
