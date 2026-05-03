import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

interface ArchiveInvalidationProviderProps {
  children: ReactNode;
}

const ArchiveRefreshKeyContext = createContext<number | null>(null);
const InvalidateArchivesContext = createContext<(() => void) | null>(null);

function useRequiredContext<T>(contextValue: T | null, hookName: string) {
  if (contextValue === null) {
    throw new Error(
      `${hookName} must be used within ArchiveInvalidationProvider`
    );
  }

  return contextValue;
}

export function ArchiveInvalidationProvider({
  children,
}: ArchiveInvalidationProviderProps) {
  const [archiveRefreshKey, setArchiveRefreshKey] = useState(0);
  const invalidateArchives = useCallback(() => {
    setArchiveRefreshKey((currentRefreshKey) => currentRefreshKey + 1);
  }, []);

  return (
    <ArchiveRefreshKeyContext.Provider value={archiveRefreshKey}>
      <InvalidateArchivesContext.Provider value={invalidateArchives}>
        {children}
      </InvalidateArchivesContext.Provider>
    </ArchiveRefreshKeyContext.Provider>
  );
}

export function useArchiveRefreshKey() {
  return useRequiredContext(
    useContext(ArchiveRefreshKeyContext),
    "useArchiveRefreshKey"
  );
}

export function useInvalidateArchives() {
  return useRequiredContext(
    useContext(InvalidateArchivesContext),
    "useInvalidateArchives"
  );
}
