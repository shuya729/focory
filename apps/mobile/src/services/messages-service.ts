import type { paths } from "@/lib/api/paths";
import { postAuthenticatedJson } from "./api-service";
import { getSettings, toNullableSettingValue } from "./settings-service";

type PostMessageRequestBody =
  paths["/messages"]["post"]["requestBody"]["content"]["application/json"];
type PostMessageResponse =
  paths["/messages"]["post"]["responses"][200]["content"]["application/json"];

export type TimerMessageType = PostMessageRequestBody["type"];

interface RequestTimerMessageInput {
  durationSec: number;
  elapsedSec: number;
  timerId: string;
  type: TimerMessageType;
}

export const DEFAULT_TIMER_EVENT_MESSAGES: Record<TimerMessageType, string> = {
  finish: "完了おめでとう。今回の集中を振り返るメッセージを準備しているよ。",
  restart: "もう一度集中に戻る流れを整えているよ。",
  start: "今の目的に合わせたひとことを用意しているよ。",
  stop: "いったん止まった今に合う声かけを考えているよ。",
};

export async function requestTimerMessage({
  durationSec,
  elapsedSec,
  timerId,
  type,
}: RequestTimerMessageInput) {
  const settings = await getSettings();
  const response = await postAuthenticatedJson<PostMessageResponse>(
    "/messages",
    {
      behavior: toNullableSettingValue(settings.behavior),
      durationSec,
      elapsedSec,
      objective: toNullableSettingValue(settings.objective),
      purpose: toNullableSettingValue(settings.purpose),
      timerId,
      type,
    } satisfies PostMessageRequestBody
  );

  return response.data.message.content;
}
