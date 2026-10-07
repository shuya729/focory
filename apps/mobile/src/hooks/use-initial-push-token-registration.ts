import { useEffect, useRef } from "react";
import { usePushTokenRegistration } from "./data/use-push-token-registration";

export function useInitialPushTokenRegistration() {
  const hasRequested = useRef(false);
  const { register } = usePushTokenRegistration();
  useEffect(() => {
    if (hasRequested.current) {
      return;
    }
    hasRequested.current = true;
    register();
  }, [register]);
}
