export type TimerMessageType = "start" | "stop" | "restart" | "finish";

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

export interface StoredTimer {
  id: string;
  durationSeconds: number;
  elapsedSeconds: number;
}

export interface TimerSession {
  timerId: string;
  archiveId: string;
}

export interface PauseTimerSessionInput extends TimerSession {
  elapsedSeconds: number;
}

export interface FinishTimerSessionInput extends TimerSession {
  durationSeconds: number;
}

export interface ResetTimerInput {
  timerId: string;
  durationSeconds: number;
}

export interface TimerRepository {
  findLatestTimer(): StoredTimer | undefined;
  startSession(durationSeconds: number): TimerSession;
  pauseSession(input: PauseTimerSessionInput): void;
  restartSession(timerId: string): { archiveId: string };
  finishSession(input: FinishTimerSessionInput): void;
  resetTimer(input: ResetTimerInput): void;
}

export interface TimerTransition {
  state: TimerState;
  message: Omit<RequestTimerMessageInput, "isMessageFailureFeedbackEnabled">;
}
