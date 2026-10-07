import { useQuery } from "@tanstack/react-query";
import { LOCAL_QUERY_KEYS, LOCAL_QUERY_OPTIONS } from "@/lib/query/options";
import { archiveRepository } from "@/repositories/archive-repository";

export function useArchiveData() {
  return useQuery({
    ...LOCAL_QUERY_OPTIONS,
    queryKey: LOCAL_QUERY_KEYS.archives,
    queryFn: archiveRepository.listRecords,
    meta: { errorMessage: "過去の記録の読み込みに失敗しました" },
  });
}
