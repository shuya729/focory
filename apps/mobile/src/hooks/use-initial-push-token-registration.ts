import { useEffect, useRef } from "react";
import { registerCurrentDevicePushToken } from "@/services/push-token-service";
import { showErrorToast } from "@/utils/toast-utils";

export function useInitialPushTokenRegistration() {
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (hasRequestedRef.current) {
      return;
    }

    hasRequestedRef.current = true;
    registerCurrentDevicePushToken().catch(() => {
      showErrorToast("通知設定の登録に失敗しました");
    });
  }, []);
}
