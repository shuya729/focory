import Storage from "expo-sqlite/kv-store";
import type { KVKey } from "./keys";

export async function getKVItem(key: KVKey): Promise<string | null> {
  return await Storage.getItem(key);
}

export async function setKVItem(key: KVKey, value: string): Promise<void> {
  await Storage.setItem(key, value);
}

export async function removeKVItem(key: KVKey): Promise<void> {
  await Storage.removeItem(key);
}

export default {
  get: getKVItem,
  set: setKVItem,
  remove: removeKVItem,
};
