import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { RequestTimerMessageInput } from "@/types/timer";
import { toApiError } from "@/utils/api-error-utils";
import { toNullableSettingValue } from "@/utils/settings-utils";
import { settingsQueryOptions } from "./use-settings-data";

export function useTimerMessageMutation() {
  const client = useQueryClient();
  const { mutateAsync } = apiClient.useMutation("post", "/v1/messages", {
    retry: false,
  });
  return useMutation({
    retry: false,
    mutationFn: async (input: RequestTimerMessageInput) => {
      try {
        const settings = await client.ensureQueryData(settingsQueryOptions);
        const response = await mutateAsync({
          body: {
            timerId: input.timerId,
            type: input.type,
            durationSec: input.durationSeconds,
            elapsedSec: input.elapsedSeconds,
            behavior: settings.behavior,
            objective: toNullableSettingValue(settings.objective),
            purpose: toNullableSettingValue(settings.purpose),
          },
        });
        const message = response.data.message.content;
        if (!message.trim()) {
          throw new Error("メッセージの生成に失敗しました。");
        }
        return message;
      } catch (error) {
        throw toApiError(error, "メッセージの生成に失敗しました。");
      }
    },
  });
}
