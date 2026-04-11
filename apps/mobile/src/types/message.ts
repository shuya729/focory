import type { paths } from "@/lib/api/paths";

type PostMessageRequestBody =
  paths["/messages"]["post"]["requestBody"]["content"]["application/json"];

export type TimerMessageType = PostMessageRequestBody["type"];

export interface RequestTimerMessageInput {
  durationSec: number;
  elapsedSec: number;
  timerId: string;
  type: TimerMessageType;
}
