import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { db, migrations } from "@/lib/db/client";
import { toApiError } from "@/utils/api-error-utils";

export function useAppBootstrap(fontsLoaded: boolean) {
  const { error: migrationError, success: isDatabaseReady } = useMigrations(
    db,
    migrations
  );
  const authenticationRef = useRef<Promise<void> | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticationError, setAuthenticationError] = useState<Error | null>(
    null
  );

  useEffect(() => {
    if (!(fontsLoaded && isDatabaseReady) || migrationError) {
      return;
    }
    let isMounted = true;
    // StrictMode の effect 再実行でも同じ認証処理の結果を待つ。
    authenticationRef.current ??= (async () => {
      const session = await authClient.getSession();
      if (session.error) {
        throw session.error;
      }
      if (session.data) {
        return;
      }
      const result = await authClient.signIn.anonymous();
      if (result.error) {
        throw result.error;
      }
    })();
    authenticationRef.current.then(
      () => {
        if (isMounted) {
          setIsAuthenticated(true);
        }
      },
      (error: unknown) => {
        if (isMounted) {
          setAuthenticationError(toApiError(error, "認証に失敗しました。"));
        }
      }
    );
    return () => {
      isMounted = false;
    };
  }, [fontsLoaded, isDatabaseReady, migrationError]);

  return {
    error: migrationError ?? authenticationError,
    isReady:
      fontsLoaded && isDatabaseReady && !migrationError && isAuthenticated,
  };
}
