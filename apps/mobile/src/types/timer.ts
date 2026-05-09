import type { paths } from "@/lib/api/paths";

type PostMessageRequestBody =
  paths["/messages"]["post"]["requestBody"]["content"]["application/json"];

export type TimerMessageType = PostMessageRequestBody["type"];

export interface TimerState {
  currentArchiveId: string | null;
  currentTimerId: string | null;
  durationSeconds: number;
  isRunning: boolean;
  isTransitioning: boolean;
  remainingSeconds: number;
}

export interface RestoredTimerState {
  currentTimerId: string | null;
  durationSeconds: number;
  remainingSeconds: number;
}

export interface TimerMessageState {
  hasMessage: boolean;
  isGenerating: boolean;
  message: string;
}

export interface RequestTimerMessageInput {
  durationSeconds: number;
  elapsedSeconds: number;
  isMessageFailureFeedbackEnabled?: boolean;
  timerId: string;
  type: TimerMessageType;
}
