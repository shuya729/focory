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
import { showErrorToast } from "@/utils/toast-utils";

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

    loadDuration().catch((error) => {
      if (isMounted) {
        showErrorToast(error, "タイマー設定の読み込みに失敗しました");
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const saveSelectedDuration = async () => {
    if (selectedDurationSeconds === 0) {
      return false;
    }

    try {
      await saveTimerDurationPreference(selectedDurationSeconds);
      return true;
    } catch (error) {
      showErrorToast(error, "タイマー設定の保存に失敗しました");
      return false;
    }
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
