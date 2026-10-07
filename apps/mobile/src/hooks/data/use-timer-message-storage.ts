import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LOCAL_MUTATION_OPTIONS,
  LOCAL_QUERY_KEYS,
  LOCAL_QUERY_OPTIONS,
} from "@/lib/query/options";
import { timerMessageRepository } from "@/repositories/timer-message-repository";
import { showErrorToast } from "@/utils/toast-utils";

export function useTimerMessageStorage() {
  const client = useQueryClient();
  const query = useQuery({
    ...LOCAL_QUERY_OPTIONS,
    queryKey: LOCAL_QUERY_KEYS.timerMessage,
    queryFn: timerMessageRepository.read,
    meta: { errorMessage: "メッセージの読み込みに失敗しました" },
  });
  const write = useMutation({
    ...LOCAL_MUTATION_OPTIONS,
    scope: { id: "local-timer-message" },
    mutationFn: async (message: string | null) => {
      await client.cancelQueries({ queryKey: LOCAL_QUERY_KEYS.timerMessage });
      if (message === null) {
        await timerMessageRepository.clear();
      } else {
        await timerMessageRepository.save(message);
      }
    },
    onSuccess: (_result, message) =>
      client.setQueryData(LOCAL_QUERY_KEYS.timerMessage, message),
    onError: (_error, message) =>
      showErrorToast(
        message === null
          ? "メッセージの削除に失敗しました"
          : "メッセージの保存に失敗しました"
      ),
  });
  return { query, write: write.mutate };
}
