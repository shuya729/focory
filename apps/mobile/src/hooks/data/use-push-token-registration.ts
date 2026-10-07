import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { getCurrentDevicePushToken } from "@/lib/notifications/client";
import { LOCAL_MUTATION_OPTIONS } from "@/lib/query/options";
import { showErrorToast } from "@/utils/toast-utils";

export function usePushTokenRegistration() {
  const register = apiClient.useMutation("post", "/v1/push-tokens", {
    retry: false,
    onError: () => {
      showErrorToast("通知設定の登録に失敗しました");
    },
  });
  const { mutate } = register;
  const acquire = useMutation({
    ...LOCAL_MUTATION_OPTIONS,
    mutationFn: getCurrentDevicePushToken,
    onSuccess: (token) => {
      if (token) {
        mutate({ body: { token } });
      }
    },
    onError: () => {
      showErrorToast("通知設定の登録に失敗しました");
    },
  });
  return {
    register: acquire.mutate,
    isPending: acquire.isPending || register.isPending,
    error: acquire.error ?? register.error,
  };
}
