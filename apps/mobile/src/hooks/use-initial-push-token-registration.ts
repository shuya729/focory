import { useEffect, useRef } from "react";
import { registerCurrentDevicePushToken } from "@/services/push-token-service";

export function useInitialPushTokenRegistration() {
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (hasRequestedRef.current) {
      return;
    }

    hasRequestedRef.current = true;
    registerCurrentDevicePushToken().catch(() => undefined);
  }, []);
}
