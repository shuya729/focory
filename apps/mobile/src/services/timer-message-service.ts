import { fetchClient } from "@/lib/api/client";
import type { paths } from "@/lib/api/paths";
import {
  getSettings,
  toTimerMessageSettings,
} from "@/services/settings-service";
import type { RequestTimerMessageInput } from "@/types/timer";
import { toApiError } from "@/utils/api-error-utils";

type PostMessageRequestBody =
  paths["/messages"]["post"]["requestBody"]["content"]["application/json"];

export async function requestTimerMessage({
  durationSeconds,
  elapsedSeconds,
  timerId,
  type,
}: RequestTimerMessageInput) {
  const settings = await getSettings();
  const messageSettings = toTimerMessageSettings(settings);
  const { data, error } = await fetchClient.POST("/messages", {
    body: {
      behavior: messageSettings.behavior,
      durationSec: durationSeconds,
      elapsedSec: elapsedSeconds,
      objective: messageSettings.objective,
      purpose: messageSettings.purpose,
      timerId,
      type,
    } satisfies PostMessageRequestBody,
  });

  if (error) {
    throw toApiError(error, "メッセージの生成に失敗しました。");
  }

  const message = data?.data.message.content;

  if (!message) {
    throw new Error("メッセージの生成に失敗しました。");
  }

  return message;
}
