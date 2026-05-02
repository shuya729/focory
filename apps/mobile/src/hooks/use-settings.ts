import { useEffect, useState } from "react";
import {
  DEFAULT_USER_SETTINGS,
  getSettings,
  saveBehavior,
  saveObjective,
  savePurpose,
} from "@/services/settings-service";
import type { UserSettings } from "@/types/settings";

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

    loadSettings().catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChangeObjective = (objective: string) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      objective,
    }));
    saveObjective(objective).catch(() => undefined);
  };

  const handleChangePurpose = (purpose: string) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      purpose,
    }));
    savePurpose(purpose).catch(() => undefined);
  };

  const handleChangeBehavior = (behavior: UserSettings["behavior"]) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      behavior,
    }));
    saveBehavior(behavior).catch(() => undefined);
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
