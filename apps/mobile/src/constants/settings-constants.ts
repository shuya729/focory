export interface BehaviorOption {
  label: string;
  value: string;
}

export const KIND_BEHAVIOR_OPTION: BehaviorOption = {
  label: "やさしい",
  value: "kind",
} as const;
export const INTENSITY_BEHAVIOR_OPTION: BehaviorOption = {
  label: "厳しい",
  value: "intensity",
} as const;
export const BRIGHT_BEHAVIOR_OPTION: BehaviorOption = {
  label: "明るい",
  value: "bright",
} as const;
export const CALM_BEHAVIOR_OPTION: BehaviorOption = {
  label: "落ち着き",
  value: "calm",
} as const;
export const FUN_BEHAVIOR_OPTION: BehaviorOption = {
  label: "おもしろい",
  value: "fun",
} as const;
export const COOL_BEHAVIOR_OPTION: BehaviorOption = {
  label: "クール",
  value: "cool",
} as const;

export const BEHAVIOR_OPTION = {
  KIND: KIND_BEHAVIOR_OPTION,
  INTENSITY: INTENSITY_BEHAVIOR_OPTION,
  BRIGHT: BRIGHT_BEHAVIOR_OPTION,
  CALM: CALM_BEHAVIOR_OPTION,
  FUN: FUN_BEHAVIOR_OPTION,
  COOL: COOL_BEHAVIOR_OPTION,
} as const;
export const BEHAVIOR_OPTIONS: BehaviorOption[] = [
  KIND_BEHAVIOR_OPTION,
  INTENSITY_BEHAVIOR_OPTION,
  BRIGHT_BEHAVIOR_OPTION,
  CALM_BEHAVIOR_OPTION,
  FUN_BEHAVIOR_OPTION,
  COOL_BEHAVIOR_OPTION,
] as const;

export const DEFAULT_BEHAVIOR_OPTION = KIND_BEHAVIOR_OPTION;
export interface SettingLink {
  label: string;
  url: string;
}

export const TERMS_OF_SERVICE_SETTING_LINK: SettingLink = {
  label: "利用規約",
  url: "https://www.google.com",
} as const;
export const PRIVACY_POLICY_SETTING_LINK: SettingLink = {
  label: "プライバシーポリシー",
  url: "https://www.google.com",
} as const;
export const CONTACT_SETTING_LINK: SettingLink = {
  label: "お問い合わせ",
  url: "https://www.google.com",
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
