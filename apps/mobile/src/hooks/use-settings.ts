import { useMutation } from "@tanstack/react-query";
import { openBrowserAsync } from "expo-web-browser";
import { useState } from "react";
import { DEFAULT_BEHAVIOR_OPTION } from "@/constants/settings-constants";
import type { UserSettings } from "@/types/settings";
import { showErrorToast } from "@/utils/toast-utils";
import { useSettingsData } from "./data/use-settings-data";

export function useSettings() {
  const { query, save } = useSettingsData();
  const [draft, setDraft] = useState<Partial<UserSettings>>({});
  const settings = {
    behavior: DEFAULT_BEHAVIOR_OPTION.value,
    objective: "",
    purpose: "",
    ...query.data,
    ...draft,
  };
  const link = useMutation({
    mutationFn: (url: string) => openBrowserAsync(url),
    retry: false,
    onError: () => showErrorToast("リンクを開けませんでした"),
  });
  return {
    handleChangeBehavior: (behavior: UserSettings["behavior"]) => {
      setDraft((current) => ({ ...current, behavior }));
      save.mutate({ field: "behavior", value: behavior });
    },
    handleChangeObjective: (objective: string) => {
      setDraft((current) => ({ ...current, objective }));
      save.mutate({ field: "objective", value: objective });
    },
    handleChangePurpose: (purpose: string) => {
      setDraft((current) => ({ ...current, purpose }));
      save.mutate({ field: "purpose", value: purpose });
    },
    objective: settings.objective,
    purpose: settings.purpose,
    selectedBehavior: settings.behavior,
    onClickLink: (url: string) => link.mutate(url),
  };
}
