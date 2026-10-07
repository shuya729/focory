export type BehaviorValue =
  | "supporter"
  | "rival"
  | "cool"
  | "coach"
  | "swordsman"
  | "trickster";

export interface UserSettings {
  behavior: BehaviorValue;
  objective: string;
  purpose: string;
}

export interface StoredSettings {
  behavior: string | null;
  objective: string | null;
  purpose: string | null;
}

export interface SettingsRepository {
  read(): Promise<StoredSettings>;
  saveObjective(value: string): Promise<void>;
  savePurpose(value: string): Promise<void>;
  saveBehavior(value: BehaviorValue): Promise<void>;
}

export interface TimerPreferenceRepository {
  readDuration(): Promise<string | null>;
  saveDuration(durationSeconds: number): Promise<void>;
}
