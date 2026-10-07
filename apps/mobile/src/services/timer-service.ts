import type {
  TimerRepository,
  TimerState,
  TimerTransition,
} from "@/types/timer";
import {
  calculateElapsedSeconds,
  createIdleTimerState,
} from "@/utils/timer-utils";

export class TimerService {
  private readonly repository: TimerRepository;

  constructor(repository: TimerRepository) {
    this.repository = repository;
  }

  startOrResume(state: TimerState): TimerTransition | null {
    if (
      state.isTransitioning ||
      state.isRunning ||
      state.durationSeconds === 0
    ) {
      return null;
    }
    if (
      state.currentTimerId &&
      !state.currentArchiveId &&
      state.remainingSeconds > 0
    ) {
      const { archiveId } = this.repository.restartSession(
        state.currentTimerId
      );
      return {
        state: {
          ...state,
          currentArchiveId: archiveId,
          isRunning: true,
          isTransitioning: false,
        },
        message: {
          timerId: state.currentTimerId,
          type: "restart",
          durationSeconds: state.durationSeconds,
          elapsedSeconds: calculateElapsedSeconds(
            state.durationSeconds,
            state.remainingSeconds
          ),
        },
      };
    }
    const session = this.repository.startSession(state.durationSeconds);
    return {
      state: {
        ...state,
        currentTimerId: session.timerId,
        currentArchiveId: session.archiveId,
        isRunning: true,
        isTransitioning: false,
        remainingSeconds: state.durationSeconds,
      },
      message: {
        timerId: session.timerId,
        type: "start",
        durationSeconds: state.durationSeconds,
        elapsedSeconds: 0,
      },
    };
  }

  pause(state: TimerState): TimerTransition | null {
    if (
      state.isTransitioning ||
      !state.isRunning ||
      !state.currentTimerId ||
      !state.currentArchiveId
    ) {
      return null;
    }
    const elapsedSeconds = calculateElapsedSeconds(
      state.durationSeconds,
      state.remainingSeconds
    );
    this.repository.pauseSession({
      timerId: state.currentTimerId,
      archiveId: state.currentArchiveId,
      elapsedSeconds,
    });
    return {
      state: {
        ...state,
        currentArchiveId: null,
        isRunning: false,
        isTransitioning: false,
      },
      message: {
        timerId: state.currentTimerId,
        type: "stop",
        durationSeconds: state.durationSeconds,
        elapsedSeconds,
      },
    };
  }

  finish(state: TimerState): TimerTransition | null {
    if (
      state.isTransitioning ||
      !state.isRunning ||
      state.remainingSeconds !== 0 ||
      !state.currentTimerId ||
      !state.currentArchiveId
    ) {
      return null;
    }
    this.repository.finishSession({
      timerId: state.currentTimerId,
      archiveId: state.currentArchiveId,
      durationSeconds: state.durationSeconds,
    });
    return {
      state: {
        ...state,
        currentArchiveId: null,
        isRunning: false,
        isTransitioning: false,
      },
      message: {
        timerId: state.currentTimerId,
        type: "finish",
        durationSeconds: state.durationSeconds,
        elapsedSeconds: state.durationSeconds,
      },
    };
  }
  reset(state: TimerState, durationSeconds: number): TimerState | null {
    if (state.isRunning || state.isTransitioning) {
      return null;
    }
    const timerId =
      state.currentTimerId ?? this.repository.findLatestTimer()?.id ?? null;
    if (timerId) {
      this.repository.resetTimer({ timerId, durationSeconds });
    }
    return {
      ...createIdleTimerState(durationSeconds),
      currentTimerId: timerId,
    };
  }
}
