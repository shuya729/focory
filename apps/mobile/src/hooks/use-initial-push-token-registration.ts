import { useEffect, useRef } from "react";
import { useRegisterCurrentDevicePushToken } from "@/hooks/use-register-current-device-push-token";

export function useInitialPushTokenRegistration() {
  const hasRequestedRef = useRef(false);
  const { registerCurrentDevicePushToken } =
    useRegisterCurrentDevicePushToken();

  useEffect(() => {
    if (hasRequestedRef.current) {
      return;
    }

    hasRequestedRef.current = true;
    registerCurrentDevicePushToken().catch(() => undefined);
  }, [registerCurrentDevicePushToken]);
}
