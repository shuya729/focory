import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from "react";

interface ArchiveRefreshContextValue {
  notifyArchiveChanged: () => void;
  refreshKey: number;
}

const ArchiveRefreshContext = createContext<ArchiveRefreshContextValue | null>(
  null
);

function ArchiveRefreshProvider({ children }: PropsWithChildren) {
  const [refreshKey, setRefreshKey] = useState(0);

  const notifyArchiveChanged = () => {
    setRefreshKey((currentRefreshKey) => currentRefreshKey + 1);
  };

  return (
    <ArchiveRefreshContext.Provider
      value={{ notifyArchiveChanged, refreshKey }}
    >
      {children}
    </ArchiveRefreshContext.Provider>
  );
}

function useArchiveRefresh() {
  const archiveRefreshContext = useContext(ArchiveRefreshContext);

  if (!archiveRefreshContext) {
    throw new Error(
      "useArchiveRefresh must be used within an ArchiveRefreshProvider."
    );
  }

  return archiveRefreshContext;
}

export { ArchiveRefreshProvider, useArchiveRefresh };
