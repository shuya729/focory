import { getKVItem, removeKVItem, setKVItem } from "@/lib/kv/client";
import { TIMER_MESSAGE_KEY } from "@/lib/kv/keys";

export const timerMessageRepository = {
  async read(): Promise<string | null> {
    return await getKVItem(TIMER_MESSAGE_KEY);
  },
  async save(message: string): Promise<void> {
    await setKVItem(TIMER_MESSAGE_KEY, message);
  },
  async clear(): Promise<void> {
    await removeKVItem(TIMER_MESSAGE_KEY);
  },
};
