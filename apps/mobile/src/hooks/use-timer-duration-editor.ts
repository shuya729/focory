import { useState } from "react";
import { useTimerDurationPreference } from "@/contexts/timer-context";
import {
  splitTimerDurationSeconds,
  toTimerDurationSeconds,
} from "@/utils/timer-utils";

export function useTimerDurationEditor() {
  const { durationSeconds, saveTimerDuration, isSaving } =
    useTimerDurationPreference();
  const savedDuration = splitTimerDurationSeconds(durationSeconds);
  const [draftMinutes, setSelectedMinutes] = useState<number | null>(null);
  const [draftSeconds, setSelectedSeconds] = useState<number | null>(null);
  const selectedMinutes = draftMinutes ?? savedDuration.minutes;
  const selectedSeconds = draftSeconds ?? savedDuration.seconds;
  const selectedDurationSeconds = toTimerDurationSeconds(
    selectedMinutes,
    selectedSeconds
  );

  const saveSelectedDuration = (onSuccess: () => void) => {
    if (selectedDurationSeconds === 0 || isSaving) {
      return;
    }
    saveTimerDuration(selectedDurationSeconds, { onSuccess });
  };

  return {
    isSaveDisabled: selectedDurationSeconds === 0 || isSaving,
    saveSelectedDuration,
    selectedMinutes,
    selectedSeconds,
    setSelectedMinutes,
    setSelectedSeconds,
  };
}
