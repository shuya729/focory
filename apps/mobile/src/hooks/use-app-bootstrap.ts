import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useEffect, useState } from "react";
import { db, migrations } from "@/lib/db/client";
import { ensureAuthenticatedUser } from "@/services/auth-service";

const toError = (error: unknown) =>
  error instanceof Error ? error : new Error("Unknown error");

export function useAppBootstrap(fontsLoaded: boolean) {
  const { error: migrationError, success: isDatabaseReady } = useMigrations(
    db,
    migrations
  );
  const [authError, setAuthError] = useState<Error | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    if (!(fontsLoaded && isDatabaseReady) || isAuthReady || authError) {
      return;
    }

    let isMounted = true;

    const authenticateAsync = async () => {
      try {
        await ensureAuthenticatedUser();

        if (isMounted) {
          setIsAuthReady(true);
        }
      } catch (error) {
        if (isMounted) {
          setAuthError(toError(error));
        }
      }
    };

    authenticateAsync().catch((error) => {
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
  };
}
