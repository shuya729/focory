import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  LOCAL_MUTATION_OPTIONS,
  LOCAL_QUERY_KEYS,
  LOCAL_QUERY_OPTIONS,
} from "@/lib/query/options";
import { settingsRepository } from "@/repositories/settings-repository";
import type { BehaviorValue, UserSettings } from "@/types/settings";
import { normalizeBehaviorValue } from "@/utils/settings-utils";
import { showErrorToast } from "@/utils/toast-utils";

export type SettingsChange =
  | { field: "objective" | "purpose"; value: string }
  | { field: "behavior"; value: BehaviorValue };

export const settingsQueryOptions = queryOptions({
  ...LOCAL_QUERY_OPTIONS,
  queryKey: LOCAL_QUERY_KEYS.settings,
  queryFn: async (): Promise<UserSettings> => {
    const stored = await settingsRepository.read();
    return {
      behavior: normalizeBehaviorValue(stored.behavior),
      objective: stored.objective ?? "",
      purpose: stored.purpose ?? "",
    };
  },
  meta: { errorMessage: "設定の読み込みに失敗しました" },
});

export function useSettingsData() {
  const client = useQueryClient();
  const query = useQuery(settingsQueryOptions);
  const save = useMutation({
    ...LOCAL_MUTATION_OPTIONS,
    scope: { id: "local-settings" },
    mutationFn: async (change: SettingsChange) => {
      await client.cancelQueries({ queryKey: LOCAL_QUERY_KEYS.settings });
      if (change.field === "objective") {
        await settingsRepository.saveObjective(change.value);
      } else if (change.field === "purpose") {
        await settingsRepository.savePurpose(change.value);
      } else if (change.field === "behavior") {
        await settingsRepository.saveBehavior(change.value);
      }
    },
    onSuccess: (_result, change) => {
      client.setQueryData<UserSettings>(LOCAL_QUERY_KEYS.settings, (current) =>
        current ? { ...current, [change.field]: change.value } : undefined
      );
      if (!client.getQueryData(LOCAL_QUERY_KEYS.settings)) {
        client.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.settings });
      }
    },
    onError: () => {
      showErrorToast("設定の保存に失敗しました");
    },
  });
  return { query, save };
}
