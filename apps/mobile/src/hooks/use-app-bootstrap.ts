import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useEffect, useState } from "react";
import { DEFAULT_TIMER_DURATION_SECONDS } from "@/hooks/use-timer-duration";
import { db, migrations } from "@/lib/db/client";
import { ensureAuthenticatedUser } from "@/services/auth-service";
import {
  createDefaultRestoredTimerState,
  getLatestRestoredTimerState,
  type RestoredTimerState,
} from "@/services/timer-service";

const toError = (error: unknown) =>
  error instanceof Error ? error : new Error("Unknown error");

export function useAppBootstrap(fontsLoaded: boolean) {
  const { error: migrationError, success: isDatabaseReady } = useMigrations(
    db,
    migrations
  );
  const [authError, setAuthError] = useState<Error | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [restoredTimerState, setRestoredTimerState] =
    useState<RestoredTimerState>(
      createDefaultRestoredTimerState(DEFAULT_TIMER_DURATION_SECONDS)
    );

  useEffect(() => {
    if (!(fontsLoaded && isDatabaseReady) || isAuthReady || authError) {
      return;
    }

    let isMounted = true;

    const bootstrapAsync = async () => {
      try {
        const [nextRestoredTimerState] = await Promise.all([
          getLatestRestoredTimerState(DEFAULT_TIMER_DURATION_SECONDS),
          ensureAuthenticatedUser(),
        ]);

        if (isMounted) {
          setRestoredTimerState(nextRestoredTimerState);
          setIsAuthReady(true);
        }
      } catch (error) {
        if (isMounted) {
          setAuthError(toError(error));
        }
      }
    };

    bootstrapAsync().catch((error) => {
      if (isMounted) {
        setAuthError(toError(error));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [authError, fontsLoaded, isAuthReady, isDatabaseReady]);

  return {
    error: migrationError ?? authError,
    isReady: fontsLoaded && isDatabaseReady && isAuthReady,
    restoredTimerState,
  };
}
