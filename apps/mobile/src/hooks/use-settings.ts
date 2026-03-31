import { useEffect, useState } from "react";
import {
  BEHAVIOR_OPTIONS,
  type BehaviorOption,
  DEFAULT_USER_SETTINGS,
  getSettings,
  saveBehavior,
  saveObjective,
  savePurpose,
} from "@/services/settings-service";

export function useSettings() {
  const [objective, setObjective] = useState(DEFAULT_USER_SETTINGS.objective);
  const [purpose, setPurpose] = useState(DEFAULT_USER_SETTINGS.purpose);
  const [selectedBehavior, setSelectedBehavior] = useState<BehaviorOption>(
    DEFAULT_USER_SETTINGS.behavior
  );

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      const savedSettings = await getSettings();

      if (!isMounted) {
        return;
      }

      setObjective(savedSettings.objective);
      setPurpose(savedSettings.purpose);
      setSelectedBehavior(savedSettings.behavior);
    };

    loadSettings().catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChangeObjective = (nextObjective: string) => {
    setObjective(nextObjective);
    saveObjective(nextObjective).catch(() => undefined);
  };

  const handleChangePurpose = (nextPurpose: string) => {
    setPurpose(nextPurpose);
    savePurpose(nextPurpose).catch(() => undefined);
  };

  const handleChangeBehavior = (nextBehavior: BehaviorOption) => {
    setSelectedBehavior(nextBehavior);
    saveBehavior(nextBehavior).catch(() => undefined);
  };

  return {
    behaviorOptions: BEHAVIOR_OPTIONS,
    handleChangeBehavior,
    handleChangeObjective,
    handleChangePurpose,
    objective,
    purpose,
    selectedBehavior,
  };
}
