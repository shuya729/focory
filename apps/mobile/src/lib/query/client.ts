import { QueryCache, QueryClient } from "@tanstack/react-query";
import { showErrorToast } from "@/utils/toast-utils";

export const createQueryClient = () =>
  new QueryClient({
    queryCache: new QueryCache({
      onError: (_error, query) => {
        const message = query.meta?.errorMessage;
        if (typeof message === "string") {
          showErrorToast(message);
        }
      },
    }),
  });
