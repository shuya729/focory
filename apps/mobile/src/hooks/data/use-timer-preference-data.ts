import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LOCAL_MUTATION_OPTIONS,
  LOCAL_QUERY_KEYS,
  LOCAL_QUERY_OPTIONS,
} from "@/lib/query/options";
import { timerPreferenceRepository } from "@/repositories/timer-preference-repository";
import {
  clampTimerDurationSeconds,
  normalizePositiveTimerDurationSeconds,
} from "@/utils/timer-utils";
import { showErrorToast } from "@/utils/toast-utils";

export function useTimerPreferenceData() {
  const client = useQueryClient();
  const query = useQuery({
    ...LOCAL_QUERY_OPTIONS,
    queryKey: LOCAL_QUERY_KEYS.timerPreference,
    queryFn: async () =>
      normalizePositiveTimerDurationSeconds(
        Number(await timerPreferenceRepository.readDuration()),
        0
      ),
    meta: { errorMessage: "タイマー設定の読み込みに失敗しました" },
  });
  const save = useMutation({
    ...LOCAL_MUTATION_OPTIONS,
    scope: { id: "local-timer-preference" },
    mutationFn: async (durationSeconds: number) => {
      const duration = clampTimerDurationSeconds(durationSeconds);
      if (duration === 0) {
        throw new Error("Timer duration must be positive");
      }
      await timerPreferenceRepository.saveDuration(duration);
      return duration;
    },
    onSuccess: (duration) => {
      client.setQueryData(LOCAL_QUERY_KEYS.timerPreference, duration);
    },
    onError: () => {
      showErrorToast("タイマー設定の保存に失敗しました");
    },
  });
  return { query, save };
}
