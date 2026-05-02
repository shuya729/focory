import { useEffect, useState } from "react";
import { DEFAULT_TIMER_DURATION_SECONDS } from "@/constants/timer-constants";
import {
  getTimerDurationPreference,
  saveTimerDurationPreference,
} from "@/services/timer-preference-service";
import {
  splitTimerDurationSeconds,
  toTimerDurationSeconds,
} from "@/utils/timer-utils";

export function useTimerDurationEditor() {
  const initialDuration = splitTimerDurationSeconds(
    DEFAULT_TIMER_DURATION_SECONDS
  );
  const [selectedMinutes, setSelectedMinutes] = useState(
    initialDuration.minutes
  );
  const [selectedSeconds, setSelectedSeconds] = useState(
    initialDuration.seconds
  );
  const selectedDurationSeconds = toTimerDurationSeconds(
    selectedMinutes,
    selectedSeconds
  );

  useEffect(() => {
    let isMounted = true;

    const loadDuration = async () => {
      const durationSeconds = await getTimerDurationPreference();
      const nextDuration = splitTimerDurationSeconds(durationSeconds);

      if (isMounted) {
        setSelectedMinutes(nextDuration.minutes);
        setSelectedSeconds(nextDuration.seconds);
      }
    };

    loadDuration().catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const saveSelectedDuration = async () => {
    if (selectedDurationSeconds === 0) {
      return false;
    }

    await saveTimerDurationPreference(selectedDurationSeconds);
    return true;
  };

  return {
    isSaveDisabled: selectedDurationSeconds === 0,
    saveSelectedDuration,
    selectedMinutes,
    selectedSeconds,
    setSelectedMinutes,
    setSelectedSeconds,
  };
}
