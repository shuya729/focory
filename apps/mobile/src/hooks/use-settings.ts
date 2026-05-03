import { useEffect, useState } from "react";
import {
  DEFAULT_USER_SETTINGS,
  getSettings,
  saveBehavior,
  saveObjective,
  savePurpose,
} from "@/services/settings-service";
import type { UserSettings } from "@/types/settings";
import { showErrorToast } from "@/utils/toast-utils";

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      const savedSettings = await getSettings();

      if (isMounted) {
        setSettings(savedSettings);
      }
    };

    loadSettings().catch((error) => {
      if (isMounted) {
        showErrorToast(error, "設定の読み込みに失敗しました");
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChangeObjective = (objective: string) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      objective,
    }));
    saveObjective(objective).catch((error) => {
      showErrorToast(error, "目的の保存に失敗しました");
    });
  };

  const handleChangePurpose = (purpose: string) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      purpose,
    }));
    savePurpose(purpose).catch((error) => {
      showErrorToast(error, "理由の保存に失敗しました");
    });
  };

  const handleChangeBehavior = (behavior: UserSettings["behavior"]) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      behavior,
    }));
    saveBehavior(behavior).catch((error) => {
      showErrorToast(error, "振る舞いの保存に失敗しました");
    });
  };

  return {
    handleChangeBehavior,
    handleChangeObjective,
    handleChangePurpose,
    objective: settings.objective,
    purpose: settings.purpose,
    selectedBehavior: settings.behavior,
  };
}
