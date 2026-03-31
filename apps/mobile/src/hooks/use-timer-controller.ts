import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import { useArchiveRefresh } from "@/contexts/archive-refresh-context";
import {
  DEFAULT_TIMER_EVENT_MESSAGES,
  requestTimerMessage,
  type TimerMessageType,
} from "@/services/messages-service";
import {
  finishTimerSession,
  pauseTimerSession,
  restartTimerSession,
  startTimerSession,
} from "@/services/timer-service";

export const DEFAULT_COACH_MESSAGE =
  "いい調子だね！あと少しで一区切りだよ。集中できていてすごい！";
const MESSAGE_LOADING_FRAMES = [".", "..", "..."] as const;

export const formatRemainingTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
};

interface UseTimerControllerOptions {
  timerDurationSeconds: number;
}

interface QueueCoachMessageUpdateInput {
  durationSec: number;
  elapsedSeconds: number;
  latestMessageSequenceRef: MutableRefObject<number>;
  setCoachMessage: Dispatch<SetStateAction<string>>;
  setHasCoachMessage: Dispatch<SetStateAction<boolean>>;
  setIsGeneratingMessage: Dispatch<SetStateAction<boolean>>;
  timerId: string;
  type: TimerMessageType;
}

const queueCoachMessageUpdate = ({
  durationSec,
  elapsedSeconds,
  latestMessageSequenceRef,
  setCoachMessage,
  setHasCoachMessage,
  setIsGeneratingMessage,
  timerId,
  type,
}: QueueCoachMessageUpdateInput) => {
  const messageSequence = latestMessageSequenceRef.current + 1;

  latestMessageSequenceRef.current = messageSequence;
  setHasCoachMessage(true);
  setIsGeneratingMessage(true);
  setCoachMessage(DEFAULT_TIMER_EVENT_MESSAGES[type]);

  requestTimerMessage({
    durationSec,
    elapsedSec: elapsedSeconds,
    timerId,
    type,
  })
    .then((message) => {
      if (latestMessageSequenceRef.current === messageSequence) {
        setHasCoachMessage(true);
        setIsGeneratingMessage(false);
        setCoachMessage(message);
      }
    })
    .catch(() => {
      if (latestMessageSequenceRef.current === messageSequence) {
        setHasCoachMessage(true);
        setIsGeneratingMessage(false);
        setCoachMessage(DEFAULT_TIMER_EVENT_MESSAGES[type]);
      }
    });
};

export function useTimerController({
  timerDurationSeconds,
}: UseTimerControllerOptions) {
  const { notifyArchiveChanged } = useArchiveRefresh();
  const [coachMessage, setCoachMessage] = useState("");
  const [currentArchiveId, setCurrentArchiveId] = useState<string | null>(null);
  const [currentTimerId, setCurrentTimerId] = useState<string | null>(null);
  const [hasCoachMessage, setHasCoachMessage] = useState(false);
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [messageLoadingFrameIndex, setMessageLoadingFrameIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] =
    useState(timerDurationSeconds);
  const isFinished = !isRunning && remainingSeconds === 0;
  const elapsedSeconds = Math.max(timerDurationSeconds - remainingSeconds, 0);
  const isFinishingRef = useRef(false);
  const latestMessageSequenceRef = useRef(0);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const intervalId = setInterval(() => {
      setRemainingSeconds((currentRemainingSeconds) =>
        Math.max(currentRemainingSeconds - 1, 0)
      );
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isRunning]);

  useEffect(() => {
    if (!isGeneratingMessage) {
      setMessageLoadingFrameIndex(0);
      return;
    }

    const intervalId = setInterval(() => {
      setMessageLoadingFrameIndex(
        (currentFrameIndex) =>
          (currentFrameIndex + 1) % MESSAGE_LOADING_FRAMES.length
      );
    }, 350);

    return () => {
      clearInterval(intervalId);
    };
  }, [isGeneratingMessage]);

  useEffect(() => {
    if (
      !isRunning ||
      remainingSeconds !== 0 ||
      isFinishingRef.current ||
      !currentTimerId ||
      !currentArchiveId
    ) {
      return;
    }

    isFinishingRef.current = true;
    setIsRunning(false);
    setIsTransitioning(true);

    const finishCurrentTimer = async () => {
      try {
        await finishTimerSession({
          archiveId: currentArchiveId,
          durationSec: timerDurationSeconds,
          timerId: currentTimerId,
        });
        setCurrentArchiveId(null);
        notifyArchiveChanged();
        queueCoachMessageUpdate({
          durationSec: timerDurationSeconds,
          elapsedSeconds: timerDurationSeconds,
          latestMessageSequenceRef,
          setCoachMessage,
          setHasCoachMessage,
          setIsGeneratingMessage,
          timerId: currentTimerId,
          type: "finish",
        });
      } finally {
        isFinishingRef.current = false;
        setIsTransitioning(false);
      }
    };

    finishCurrentTimer().catch(() => undefined);
  }, [
    currentArchiveId,
    currentTimerId,
    isRunning,
    notifyArchiveChanged,
    remainingSeconds,
    timerDurationSeconds,
  ]);

  useEffect(() => {
    setCoachMessage("");
    setCurrentArchiveId(null);
    setCurrentTimerId(null);
    setHasCoachMessage(false);
    setIsGeneratingMessage(false);
    setIsRunning(false);
    setIsTransitioning(false);
    setRemainingSeconds(timerDurationSeconds);
  }, [timerDurationSeconds]);

  const handleStartOrResumeTimer = async () => {
    if (isTransitioning) {
      return;
    }

    setIsTransitioning(true);

    try {
      if (currentTimerId && !currentArchiveId && remainingSeconds > 0) {
        const { archiveId } = await restartTimerSession(currentTimerId);

        setCurrentArchiveId(archiveId);
        setIsRunning(true);
        notifyArchiveChanged();
        queueCoachMessageUpdate({
          durationSec: timerDurationSeconds,
          elapsedSeconds,
          latestMessageSequenceRef,
          setCoachMessage,
          setHasCoachMessage,
          setIsGeneratingMessage,
          timerId: currentTimerId,
          type: "restart",
        });
        return;
      }

      const { archiveId, timerId } =
        await startTimerSession(timerDurationSeconds);

      setCoachMessage(DEFAULT_TIMER_EVENT_MESSAGES.start);
      setCurrentArchiveId(archiveId);
      setCurrentTimerId(timerId);
      setIsRunning(true);
      setRemainingSeconds(timerDurationSeconds);
      notifyArchiveChanged();
      queueCoachMessageUpdate({
        durationSec: timerDurationSeconds,
        elapsedSeconds: 0,
        latestMessageSequenceRef,
        setCoachMessage,
        setHasCoachMessage,
        setIsGeneratingMessage,
        timerId,
        type: "start",
      });
    } finally {
      setIsTransitioning(false);
    }
  };

  const handlePauseTimer = async () => {
    if (isTransitioning || !isRunning || !currentTimerId || !currentArchiveId) {
      return;
    }

    setIsRunning(false);
    setIsTransitioning(true);

    try {
      await pauseTimerSession({
        archiveId: currentArchiveId,
        elapsedSec: elapsedSeconds,
        timerId: currentTimerId,
      });
      setCurrentArchiveId(null);
      notifyArchiveChanged();
      queueCoachMessageUpdate({
        durationSec: timerDurationSeconds,
        elapsedSeconds,
        latestMessageSequenceRef,
        setCoachMessage,
        setHasCoachMessage,
        setIsGeneratingMessage,
        timerId: currentTimerId,
        type: "stop",
      });
    } catch {
      setIsRunning(true);
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleResetTimer = () => {
    if (isTransitioning) {
      return;
    }

    setCoachMessage("");
    setCurrentArchiveId(null);
    setCurrentTimerId(null);
    setHasCoachMessage(false);
    setIsGeneratingMessage(false);
    setIsRunning(false);
    setRemainingSeconds(timerDurationSeconds);
  };

  return {
    coachMessage: isGeneratingMessage
      ? MESSAGE_LOADING_FRAMES[messageLoadingFrameIndex]
      : coachMessage,
    formattedRemainingTime: formatRemainingTime(remainingSeconds),
    handlePauseTimer,
    handleResetTimer,
    handleStartOrResumeTimer,
    hasCoachMessage,
    isFinished,
    isRunning,
    isTransitioning,
    remainingSeconds,
  };
}
