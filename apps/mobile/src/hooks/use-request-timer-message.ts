import { useCallback } from "react";
import { apiClient } from "@/lib/api/client";
import { toApiError } from "@/lib/api/error";
import type { paths } from "@/lib/api/paths";
import {
  getSettings,
  toNullableSettingValue,
} from "@/services/settings-service";
import type { RequestTimerMessageInput } from "@/types/message";

type PostMessageRequestBody =
  paths["/messages"]["post"]["requestBody"]["content"]["application/json"];

export function useRequestTimerMessage() {
  const { mutateAsync } = apiClient.useMutation("post", "/messages");

  const requestTimerMessage = useCallback(
    async ({
      durationSec,
      elapsedSec,
      timerId,
      type,
    }: RequestTimerMessageInput) => {
      const settings = await getSettings();

      try {
        const response = await mutateAsync({
          body: {
            behavior: toNullableSettingValue(settings.behavior),
            durationSec,
            elapsedSec,
            objective: toNullableSettingValue(settings.objective),
            purpose: toNullableSettingValue(settings.purpose),
            timerId,
            type,
          } satisfies PostMessageRequestBody,
        });

        return response.data.message.content;
      } catch (error) {
        throw toApiError(error, "メッセージの生成に失敗しました。");
      }
    },
    [mutateAsync]
  );

  return { requestTimerMessage };
}
