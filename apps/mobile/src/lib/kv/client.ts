import Storage from "expo-sqlite/kv-store";

export const KV_KEYS = {
  settingsObjective: "focory:settings:objective",
  settingsPurpose: "focory:settings:purpose",
  settingsBehavior: "focory:settings:behavior",
} as const;
export type KV_KEY = keyof typeof KV_KEYS;

export class KVClient {
  private readonly storage: typeof Storage = Storage;

  async get(key: KV_KEY): Promise<string | null> {
    return await this.storage.getItem(KV_KEYS[key]);
  }

  async set(key: KV_KEY, value: string): Promise<void> {
    return await this.storage.setItem(KV_KEYS[key], value);
  }

  async del(key: KV_KEY): Promise<void> {
    return await this.storage.removeItem(KV_KEYS[key]);
  }
}
