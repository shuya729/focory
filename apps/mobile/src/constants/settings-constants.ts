import type { paths } from "@/lib/api/paths";

type BehaviorValue =
  paths["/messages"]["post"]["requestBody"]["content"]["application/json"]["behavior"];

export interface BehaviorOption {
  label: string;
  value: BehaviorValue;
}

export const SUPPORTER_BEHAVIOR_OPTION: BehaviorOption = {
  label: "サポーター",
  value: "supporter",
} as const;
export const RIVAL_BEHAVIOR_OPTION: BehaviorOption = {
  label: "ライバル",
  value: "rival",
} as const;
export const COOL_BEHAVIOR_OPTION: BehaviorOption = {
  label: "クール",
  value: "cool",
} as const;
export const COACH_BEHAVIOR_OPTION: BehaviorOption = {
  label: "コーチ",
  value: "coach",
} as const;
export const SWORDSMAN_BEHAVIOR_OPTION: BehaviorOption = {
  label: "剣士",
  value: "swordsman",
} as const;
export const TRICKSTER_BEHAVIOR_OPTION: BehaviorOption = {
  label: "いたずらっ子",
  value: "trickster",
} as const;

export const BEHAVIOR_OPTION = {
  SUPPORTER: SUPPORTER_BEHAVIOR_OPTION,
  RIVAL: RIVAL_BEHAVIOR_OPTION,
  COOL: COOL_BEHAVIOR_OPTION,
  COACH: COACH_BEHAVIOR_OPTION,
  SWORDSMAN: SWORDSMAN_BEHAVIOR_OPTION,
  TRICKSTER: TRICKSTER_BEHAVIOR_OPTION,
} as const;
export const BEHAVIOR_OPTIONS: readonly BehaviorOption[] = [
  SUPPORTER_BEHAVIOR_OPTION,
  RIVAL_BEHAVIOR_OPTION,
  COOL_BEHAVIOR_OPTION,
  COACH_BEHAVIOR_OPTION,
  SWORDSMAN_BEHAVIOR_OPTION,
  TRICKSTER_BEHAVIOR_OPTION,
] as const;

export const DEFAULT_BEHAVIOR_OPTION: BehaviorOption =
  SUPPORTER_BEHAVIOR_OPTION;

export interface SettingLink {
  label: string;
  url: string;
}

export const TERMS_OF_SERVICE_SETTING_LINK: SettingLink = {
  label: "利用規約",
  url: "https://focory.com/term",
} as const;
export const PRIVACY_POLICY_SETTING_LINK: SettingLink = {
  label: "プライバシーポリシー",
  url: "https://focory.com/privacy",
} as const;
export const CONTACT_SETTING_LINK: SettingLink = {
  label: "お問い合わせ",
  url: "https://focory.com/contact",
} as const;

export const SETTINGS_LINK = {
  TERMS_OF_SERVICE: TERMS_OF_SERVICE_SETTING_LINK,
  PRIVACY_POLICY: PRIVACY_POLICY_SETTING_LINK,
  CONTACT: CONTACT_SETTING_LINK,
} as const;
export const SETTINGS_LINKS: SettingLink[] = [
  TERMS_OF_SERVICE_SETTING_LINK,
  PRIVACY_POLICY_SETTING_LINK,
  CONTACT_SETTING_LINK,
] as const;
