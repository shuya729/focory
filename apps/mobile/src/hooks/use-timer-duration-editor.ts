import { useEffect, useState } from "react";
import { useTimerDurationPreference } from "@/contexts/timer-context";
import {
  splitTimerDurationSeconds,
  toTimerDurationSeconds,
} from "@/utils/timer-utils";

export function useTimerDurationEditor() {
  const { durationSeconds, saveTimerDuration } = useTimerDurationPreference();
  const [selectedMinutes, setSelectedMinutes] = useState(0);
  const [selectedSeconds, setSelectedSeconds] = useState(0);
  const selectedDurationSeconds = toTimerDurationSeconds(
    selectedMinutes,
    selectedSeconds
  );

  useEffect(() => {
    const nextDuration = splitTimerDurationSeconds(durationSeconds);

    setSelectedMinutes(nextDuration.minutes);
    setSelectedSeconds(nextDuration.seconds);
  }, [durationSeconds]);

  const saveSelectedDuration = async () => {
    if (selectedDurationSeconds === 0) {
      return false;
    }

    return await saveTimerDuration(selectedDurationSeconds);
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
