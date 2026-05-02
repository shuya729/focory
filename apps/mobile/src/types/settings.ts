import type { BehaviorOption } from "@/constants/settings-constants";

export interface UserSettings {
  behavior: BehaviorOption["value"];
  objective: string;
  purpose: string;
}
