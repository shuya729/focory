import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LOCAL_MUTATION_OPTIONS,
  LOCAL_QUERY_KEYS,
  LOCAL_QUERY_OPTIONS,
} from "@/lib/query/options";
import { timerRepository } from "@/repositories/timer-repository";
import { TimerService } from "@/services/timer-service";
import type { TimerState, TimerTransition } from "@/types/timer";
import { showErrorToast } from "@/utils/toast-utils";

const service = new TimerService(timerRepository);

export function useTimerPersistence() {
  const client = useQueryClient();
  const latest = useQuery({
    ...LOCAL_QUERY_OPTIONS,
    queryKey: LOCAL_QUERY_KEYS.latestTimer,
    queryFn: () => timerRepository.findLatestTimer() ?? null,
    meta: { errorMessage: "タイマー状態の読み込みに失敗しました" },
  });
  const onSuccess = (transition: TimerTransition | null) => {
    if (!transition) {
      return;
    }
    client.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.archives });
    client.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.latestTimer });
  };
  const start = useMutation({
    ...LOCAL_MUTATION_OPTIONS,
    scope: { id: "local-timer" },
    mutationFn: (state: TimerState) =>
      Promise.resolve(service.startOrResume(state)),
    onSuccess,
    onError: () => {
      showErrorToast("タイマーの開始に失敗しました");
    },
  });
  const pause = useMutation({
    ...LOCAL_MUTATION_OPTIONS,
    scope: { id: "local-timer" },
    mutationFn: (state: TimerState) => Promise.resolve(service.pause(state)),
    onSuccess,
    onError: () => {
      showErrorToast("タイマーの一時停止に失敗しました");
    },
  });
  const finish = useMutation({
    ...LOCAL_MUTATION_OPTIONS,
    scope: { id: "local-timer" },
    mutationFn: (state: TimerState) => Promise.resolve(service.finish(state)),
    onSuccess,
    onError: () => {
      showErrorToast("タイマーの完了処理に失敗しました");
    },
  });
  const reset = useMutation({
    ...LOCAL_MUTATION_OPTIONS,
    scope: { id: "local-timer" },
    mutationFn: ({
      state,
      durationSeconds,
    }: {
      state: TimerState;
      durationSeconds: number;
    }) => Promise.resolve(service.reset(state, durationSeconds)),
    onSuccess: (state) => {
      if (state) {
        client.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.latestTimer });
      }
    },
    onError: () => showErrorToast("タイマーのリセットに失敗しました"),
  });
  return { latest, start, pause, finish, reset };
}
