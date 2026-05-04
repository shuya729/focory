import {
  BEHAVIOR_OPTIONS,
  type BehaviorOption,
  DEFAULT_BEHAVIOR_OPTION,
} from "@/constants/settings-constants";

type BehaviorValue = BehaviorOption["value"];

export const isBehaviorValue = (value: string): value is BehaviorValue =>
  BEHAVIOR_OPTIONS.some((behaviorOption) => behaviorOption.value === value);

export const normalizeBehaviorValue = (value: string | null): BehaviorValue => {
  if (value && isBehaviorValue(value)) {
    return value;
  }

  return DEFAULT_BEHAVIOR_OPTION.value;
};

export const toNullableSettingValue = (value: string) => {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
};
