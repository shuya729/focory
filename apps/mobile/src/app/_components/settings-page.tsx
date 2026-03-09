import { ChevronRight } from "lucide-react-native";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  type PressableProps,
  ScrollView,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewProps,
} from "react-native";
import { PAGES } from "@/constants/pages";
import { cn } from "@/utils/cn";

export interface SettingsPageProps extends Omit<ViewProps, "children"> {
  handleChangePage: (page: number) => void;
}

const PLACEHOLDER_TEXT_COLOR = "rgb(171 171 171)";
const ICON_COLOR = "rgb(91 91 91)";

const BEHAVIOR_OPTIONS = [
  "やさしい",
  "厳しい",
  "明るい",
  "落ち着き",
  "おもしろい",
  "クール",
] as const;

const LINK_LABELS = [
  "利用規約",
  "プライバシーポリシー",
  "お問い合わせ",
] as const;

function SettingsPage({
  collapsable = false,
  className,
  handleChangePage,
  ...props
}: SettingsPageProps) {
  const [purpose, setPurpose] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [selectedBehavior, setSelectedBehavior] = useState<string>(
    BEHAVIOR_OPTIONS[0]
  );

  return (
    <View
      className={cn("flex-1 px-6 pt-2 pb-4", className)}
      collapsable={collapsable}
      {...props}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 gap-3">
          <View className="flex-row items-center justify-between pt-2">
            <View className="h-11 w-11" />
            <Text className="font-semibold text-app-text-primary text-lg">
              設定
            </Text>
            <HeaderIconButton
              accessibilityLabel="タイマー画面に移動"
              onPress={() => handleChangePage(PAGES.timer.page)}
            >
              <ChevronRight color={ICON_COLOR} size={20} />
            </HeaderIconButton>
          </View>

          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-7 py-3">
              <FormSection label="目的">
                <InputField
                  onChangeText={setPurpose}
                  placeholder="集中したいことを入力"
                  value={purpose}
                />
              </FormSection>

              <FormSection label="なぜ">
                <MultilineField
                  onChangeText={setReason}
                  placeholder="なぜそれをやりたいのか、理由を書いてみよう"
                  value={reason}
                />
              </FormSection>

              <FormSection label="振る舞い">
                <View className="gap-2.5">
                  <View className="flex-row gap-2.5">
                    {BEHAVIOR_OPTIONS.slice(0, 3).map((behaviorLabel) => (
                      <BehaviorChipButton
                        isSelected={selectedBehavior === behaviorLabel}
                        key={behaviorLabel}
                        label={behaviorLabel}
                        onPress={() => setSelectedBehavior(behaviorLabel)}
                      />
                    ))}
                  </View>
                  <View className="flex-row gap-2.5">
                    {BEHAVIOR_OPTIONS.slice(3).map((behaviorLabel) => (
                      <BehaviorChipButton
                        isSelected={selectedBehavior === behaviorLabel}
                        key={behaviorLabel}
                        label={behaviorLabel}
                        onPress={() => setSelectedBehavior(behaviorLabel)}
                      />
                    ))}
                  </View>
                </View>
              </FormSection>

              <FormSection label="リンク">
                <View className="overflow-hidden rounded-xl bg-app-surface-muted">
                  {LINK_LABELS.map((linkLabel, index) => {
                    const isLastItem = index === LINK_LABELS.length - 1;

                    return (
                      <LinkRow
                        isLastItem={isLastItem}
                        key={linkLabel}
                        label={linkLabel}
                      />
                    );
                  })}
                </View>
              </FormSection>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

interface FormSectionProps {
  children: React.ReactNode;
  label: string;
}

function FormSection({ children, label }: FormSectionProps) {
  return (
    <View className="gap-2">
      <Text className="font-semibold text-app-text-primary text-sm">
        {label}
      </Text>
      {children}
    </View>
  );
}

interface HeaderIconButtonProps extends PressableProps {}

function HeaderIconButton({
  accessibilityRole = "button",
  children,
  className,
  hitSlop = 8,
  ...props
}: HeaderIconButtonProps) {
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      className={cn(
        "h-11 w-11 items-center justify-center rounded-full",
        className
      )}
      hitSlop={hitSlop}
      {...props}
    >
      {children}
    </Pressable>
  );
}

interface InputFieldProps extends TextInputProps {}

function InputField({ className, ...props }: InputFieldProps) {
  return (
    <View className="rounded-xl border border-app-border bg-app-surface px-4">
      <TextInput
        className={cn("h-12 text-app-text-primary text-sm", className)}
        placeholderTextColor={PLACEHOLDER_TEXT_COLOR}
        underlineColorAndroid="transparent"
        {...props}
      />
    </View>
  );
}

function MultilineField({ className, ...props }: InputFieldProps) {
  return (
    <View className="rounded-xl border border-app-border bg-app-surface px-4 py-3">
      <TextInput
        className={cn(
          "min-h-[92px] text-app-text-primary text-sm leading-6",
          className
        )}
        multiline
        numberOfLines={4}
        placeholderTextColor={PLACEHOLDER_TEXT_COLOR}
        textAlignVertical="top"
        underlineColorAndroid="transparent"
        {...props}
      />
    </View>
  );
}

interface BehaviorChipButtonProps extends PressableProps {
  isSelected: boolean;
  label: string;
}

function BehaviorChipButton({
  isSelected,
  label,
  accessibilityRole = "button",
  className,
  ...props
}: BehaviorChipButtonProps) {
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityState={{ selected: isSelected }}
      className={cn(
        "h-10 flex-1 items-center justify-center rounded-full px-4",
        isSelected ? "bg-app-accent" : "bg-app-surface-muted",
        className
      )}
      {...props}
    >
      <Text
        className={cn(
          "text-center font-medium text-[13px]",
          isSelected ? "text-app-background" : "text-app-text-primary"
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface LinkRowProps {
  isLastItem: boolean;
  label: string;
}

function LinkRow({ isLastItem, label }: LinkRowProps) {
  return (
    <View
      className={cn(
        "h-12 flex-row items-center justify-between px-4",
        !isLastItem && "border-app-border border-b"
      )}
    >
      <Text className="text-app-text-primary text-sm">{label}</Text>
      <ChevronRight color={PLACEHOLDER_TEXT_COLOR} size={18} />
    </View>
  );
}

export default SettingsPage;
